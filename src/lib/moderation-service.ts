import { analyzeContent, AutomatedModerationResult, ContentAnalysisOptions } from './automated-moderation';
import { moderateContent } from './content-moderation';

export interface ModerationAction {
    id: string;
    contentId: string;
    contentType: 'post' | 'reply' | 'profile';
    action: 'flagged' | 'blocked' | 'approved';
    reason: string;
    automated: boolean;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
    reviewerId?: string;
    moderationTags: string[];
}

export interface ModerationQueue {
    id: string;
    contentId: string;
    contentType: 'post' | 'reply' | 'profile';
    content: string;
    userId: string;
    flagReason: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    moderationTags: string[];
    createdAt: Date;
    status: 'pending' | 'reviewed' | 'escalated';
    automatedResult: AutomatedModerationResult;
}

class ModerationService {
    private moderationQueue: ModerationQueue[] = [];
    private moderationActions: ModerationAction[] = [];
    private defaultOptions: ContentAnalysisOptions = {
        enableToxicityDetection: true,
        enableSpamDetection: true,
        enableProfanityFilter: true,
        enableThreatDetection: true,
        enablePersonalInfoDetection: true,
        flagThreshold: 0.6, // Slightly lower threshold for better coverage
    };

    /**
     * Moderate content before it's published
     */
    async moderateBeforePublish(
        content: string,
        contentType: 'post' | 'reply' | 'profile',
        userId: string,
        contentId?: string
    ): Promise<{
        allowed: boolean;
        filtered: boolean;
        filteredContent?: string;
        moderationResult: AutomatedModerationResult;
        queueId?: string;
    }> {
        // First run basic content validation
        const basicValidation = moderateContent(content);

        // Then run automated analysis
        const automatedResult = await analyzeContent(content, this.defaultOptions);

        // Determine if content should be allowed
        let allowed = true;
        let filtered = false;
        let filteredContent = content;
        let queueId: string | undefined;

        // Block high-severity threats immediately
        if (automatedResult.suggestedAction === 'block') {
            allowed = false;
            this.logModerationAction({
                contentId: contentId || this.generateId(),
                contentType,
                action: 'blocked',
                reason: automatedResult.flagReason || 'Blocked by automated system',
                automated: true,
                severity: automatedResult.severity,
                moderationTags: automatedResult.moderationTags,
            });
        }
        // Queue for review if flagged
        else if (automatedResult.shouldFlag) {
            // For medium/high severity, block until reviewed
            if (automatedResult.severity === 'high' || automatedResult.details.threatScore > 0.3) {
                allowed = false;
            }

            queueId = this.addToModerationQueue({
                contentId: contentId || this.generateId(),
                contentType,
                content,
                userId,
                flagReason: automatedResult.flagReason || 'Flagged by automated system',
                severity: automatedResult.severity,
                confidence: automatedResult.confidence,
                moderationTags: automatedResult.moderationTags,
                automatedResult,
            });
        }
        // Apply content filtering if needed
        else if (basicValidation.filteredContent && basicValidation.filteredContent !== content) {
            filtered = true;
            filteredContent = basicValidation.filteredContent;
        }

        return {
            allowed,
            filtered,
            filteredContent: filtered ? filteredContent : undefined,
            moderationResult: automatedResult,
            queueId,
        };
    }

    /**
     * Add content to moderation queue
     */
    private addToModerationQueue(item: Omit<ModerationQueue, 'id' | 'createdAt' | 'status'>): string {
        const queueItem: ModerationQueue = {
            ...item,
            id: this.generateId(),
            createdAt: new Date(),
            status: 'pending',
        };

        this.moderationQueue.push(queueItem);

        // Auto-escalate high-severity items
        if (item.severity === 'high' || item.confidence > 0.8) {
            queueItem.status = 'escalated';
        }

        return queueItem.id;
    }

    /**
     * Get moderation queue items
     */
    getModerationQueue(filters?: {
        status?: 'pending' | 'reviewed' | 'escalated';
        severity?: 'low' | 'medium' | 'high';
        contentType?: 'post' | 'reply' | 'profile';
    }): ModerationQueue[] {
        let queue = [...this.moderationQueue];

        if (filters) {
            if (filters.status) {
                queue = queue.filter(item => item.status === filters.status);
            }
            if (filters.severity) {
                queue = queue.filter(item => item.severity === filters.severity);
            }
            if (filters.contentType) {
                queue = queue.filter(item => item.contentType === filters.contentType);
            }
        }

        // Sort by severity and creation time
        return queue.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;

            return b.createdAt.getTime() - a.createdAt.getTime();
        });
    }

    /**
     * Process moderation decision
     */
    processModerationDecision(
        queueId: string,
        decision: 'approve' | 'reject' | 'escalate',
        reviewerId: string,
        reason?: string
    ): boolean {
        const queueItem = this.moderationQueue.find(item => item.id === queueId);
        if (!queueItem) return false;

        queueItem.status = decision === 'escalate' ? 'escalated' : 'reviewed';

        const action: 'approved' | 'blocked' | 'flagged' =
            decision === 'approve' ? 'approved' :
                decision === 'reject' ? 'blocked' : 'flagged';

        this.logModerationAction({
            contentId: queueItem.contentId,
            contentType: queueItem.contentType,
            action,
            reason: reason || `${decision}d by moderator`,
            automated: false,
            severity: queueItem.severity,
            reviewerId,
            moderationTags: queueItem.moderationTags,
        });

        return true;
    }

    /**
     * Log moderation action
     */
    private logModerationAction(action: Omit<ModerationAction, 'id' | 'timestamp'>): void {
        const moderationAction: ModerationAction = {
            ...action,
            id: this.generateId(),
            timestamp: new Date(),
        };

        this.moderationActions.push(moderationAction);
    }

    /**
     * Get moderation history for content
     */
    getModerationHistory(contentId: string): ModerationAction[] {
        return this.moderationActions
            .filter(action => action.contentId === contentId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Get moderation statistics
     */
    getModerationStats(timeframe?: { start: Date; end: Date }) {
        let actions = this.moderationActions;

        if (timeframe) {
            actions = actions.filter(action =>
                action.timestamp >= timeframe.start && action.timestamp <= timeframe.end
            );
        }

        const total = actions.length;
        const automated = actions.filter(a => a.automated).length;
        const manual = total - automated;

        const actionBreakdown = {
            approved: actions.filter(a => a.action === 'approved').length,
            blocked: actions.filter(a => a.action === 'blocked').length,
            flagged: actions.filter(a => a.action === 'flagged').length,
        };

        const severityBreakdown = {
            low: actions.filter(a => a.severity === 'low').length,
            medium: actions.filter(a => a.severity === 'medium').length,
            high: actions.filter(a => a.severity === 'high').length,
        };

        const queueStats = {
            pending: this.moderationQueue.filter(q => q.status === 'pending').length,
            escalated: this.moderationQueue.filter(q => q.status === 'escalated').length,
            totalInQueue: this.moderationQueue.filter(q => q.status !== 'reviewed').length,
        };

        return {
            total,
            automated,
            manual,
            actionBreakdown,
            severityBreakdown,
            queueStats,
            automationRate: total > 0 ? (automated / total) * 100 : 0,
        };
    }

    /**
     * Update moderation settings
     */
    updateModerationSettings(options: Partial<ContentAnalysisOptions>): void {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }

    /**
     * Get current moderation settings
     */
    getModerationSettings(): ContentAnalysisOptions {
        return { ...this.defaultOptions };
    }

    /**
     * Bulk moderate content (for batch processing)
     */
    async bulkModerate(
        contents: Array<{
            content: string;
            contentType: 'post' | 'reply' | 'profile';
            userId: string;
            contentId: string;
        }>
    ): Promise<Array<{
        contentId: string;
        allowed: boolean;
        filtered: boolean;
        filteredContent?: string;
        moderationResult: AutomatedModerationResult;
        queueId?: string;
    }>> {
        const results = await Promise.all(
            contents.map(item =>
                this.moderateBeforePublish(
                    item.content,
                    item.contentType,
                    item.userId,
                    item.contentId
                )
            )
        );

        return results.map((result, index) => ({
            contentId: contents[index].contentId,
            ...result,
        }));
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clear old queue items (cleanup)
     */
    cleanupOldQueueItems(olderThanDays: number = 30): number {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const initialLength = this.moderationQueue.length;
        this.moderationQueue = this.moderationQueue.filter(
            item => item.createdAt > cutoffDate || item.status !== 'reviewed'
        );

        return initialLength - this.moderationQueue.length;
    }
}

// Export singleton instance
export const moderationService = new ModerationService();
export default moderationService;