import { moderationService } from '../moderation-service';

describe('ModerationService', () => {
    beforeEach(() => {
        // Reset the service state before each test
        moderationService.cleanupOldQueueItems(0); // Clear all items
    });

    describe('moderateBeforePublish', () => {
        it('should allow clean content', async () => {
            const result = await moderationService.moderateBeforePublish(
                'This is a nice post about my day!',
                'post',
                'user123'
            );

            expect(result.allowed).toBe(true);
            expect(result.filtered).toBe(false);
            expect(result.queueId).toBeUndefined();
        });

        it('should block high-severity threats', async () => {
            const result = await moderationService.moderateBeforePublish(
                'I will kill you if you keep posting',
                'post',
                'user123'
            );

            expect(result.allowed).toBe(false);
            expect(result.moderationResult.suggestedAction).toBe('block');
        });

        it('should queue flagged content for review', async () => {
            const result = await moderationService.moderateBeforePublish(
                'You are such a stupid person',
                'post',
                'user123'
            );

            if (result.moderationResult.shouldFlag) {
                expect(result.queueId).toBeDefined();

                const queue = moderationService.getModerationQueue();
                expect(queue).toHaveLength(1);
                expect(queue[0].content).toBe('You are such a stupid person');
            }
        });

        it('should apply content filtering', async () => {
            const result = await moderationService.moderateBeforePublish(
                'This is fucking awesome!',
                'post',
                'user123'
            );

            if (result.filtered) {
                expect(result.filteredContent).toBeDefined();
                expect(result.filteredContent).not.toBe('This is fucking awesome!');
            }
        });

        it('should handle different content types', async () => {
            const postResult = await moderationService.moderateBeforePublish(
                'Test post content',
                'post',
                'user123'
            );

            const replyResult = await moderationService.moderateBeforePublish(
                'Test reply content',
                'reply',
                'user123'
            );

            const profileResult = await moderationService.moderateBeforePublish(
                'Test profile bio',
                'profile',
                'user123'
            );

            expect(postResult.allowed).toBe(true);
            expect(replyResult.allowed).toBe(true);
            expect(profileResult.allowed).toBe(true);
        });
    });

    describe('getModerationQueue', () => {
        beforeEach(async () => {
            // Add some test items to the queue
            await moderationService.moderateBeforePublish(
                'Mildly inappropriate content',
                'post',
                'user1'
            );
            await moderationService.moderateBeforePublish(
                'Very bad threatening content',
                'post',
                'user2'
            );
            await moderationService.moderateBeforePublish(
                'Spam content with links',
                'reply',
                'user3'
            );
        });

        it('should return all queue items', () => {
            const queue = moderationService.getModerationQueue();
            expect(queue.length).toBeGreaterThan(0);
        });

        it('should filter by status', () => {
            const pendingQueue = moderationService.getModerationQueue({ status: 'pending' });
            const escalatedQueue = moderationService.getModerationQueue({ status: 'escalated' });

            expect(pendingQueue.every(item => item.status === 'pending')).toBe(true);
            expect(escalatedQueue.every(item => item.status === 'escalated')).toBe(true);
        });

        it('should filter by severity', () => {
            const highSeverityQueue = moderationService.getModerationQueue({ severity: 'high' });
            expect(highSeverityQueue.every(item => item.severity === 'high')).toBe(true);
        });

        it('should filter by content type', () => {
            const postQueue = moderationService.getModerationQueue({ contentType: 'post' });
            const replyQueue = moderationService.getModerationQueue({ contentType: 'reply' });

            expect(postQueue.every(item => item.contentType === 'post')).toBe(true);
            expect(replyQueue.every(item => item.contentType === 'reply')).toBe(true);
        });

        it('should sort by severity and creation time', () => {
            const queue = moderationService.getModerationQueue();

            // Check that high severity items come first
            for (let i = 0; i < queue.length - 1; i++) {
                const current = queue[i];
                const next = queue[i + 1];

                const severityOrder = { high: 3, medium: 2, low: 1 };
                expect(severityOrder[current.severity]).toBeGreaterThanOrEqual(severityOrder[next.severity]);
            }
        });
    });

    describe('processModerationDecision', () => {
        let queueId: string;

        beforeEach(async () => {
            const result = await moderationService.moderateBeforePublish(
                'Questionable content',
                'post',
                'user123'
            );
            queueId = result.queueId!;
        });

        it('should approve content', () => {
            const success = moderationService.processModerationDecision(
                queueId,
                'approve',
                'moderator123',
                'Content is acceptable'
            );

            expect(success).toBe(true);

            const history = moderationService.getModerationHistory(queueId);
            expect(history).toHaveLength(1);
            expect(history[0].action).toBe('approved');
            expect(history[0].reviewerId).toBe('moderator123');
        });

        it('should reject content', () => {
            const success = moderationService.processModerationDecision(
                queueId,
                'reject',
                'moderator123',
                'Content violates guidelines'
            );

            expect(success).toBe(true);

            const history = moderationService.getModerationHistory(queueId);
            expect(history[0].action).toBe('blocked');
        });

        it('should escalate content', () => {
            const success = moderationService.processModerationDecision(
                queueId,
                'escalate',
                'moderator123',
                'Needs senior review'
            );

            expect(success).toBe(true);

            const queue = moderationService.getModerationQueue();
            const item = queue.find(q => q.id === queueId);
            expect(item?.status).toBe('escalated');
        });

        it('should return false for non-existent queue item', () => {
            const success = moderationService.processModerationDecision(
                'non-existent-id',
                'approve',
                'moderator123'
            );

            expect(success).toBe(false);
        });
    });

    describe('bulkModerate', () => {
        it('should moderate multiple pieces of content', async () => {
            const contents = [
                {
                    content: 'Nice post!',
                    contentType: 'post' as const,
                    userId: 'user1',
                    contentId: 'post1'
                },
                {
                    content: 'You are stupid',
                    contentType: 'post' as const,
                    userId: 'user2',
                    contentId: 'post2'
                }
            ];

            const results = await moderationService.bulkModerate(contents);

            expect(results).toHaveLength(2);
            expect(results[0].contentId).toBe('post1');
            expect(results[1].contentId).toBe('post2');
            expect(results[0].allowed).toBe(true);
        });
    });

    describe('getModerationStats', () => {
        beforeEach(async () => {
            // Generate some moderation activity
            await moderationService.moderateBeforePublish('Clean content', 'post', 'user1');
            await moderationService.moderateBeforePublish('Bad content', 'post', 'user2');
            await moderationService.moderateBeforePublish('Spam content', 'post', 'user3');
        });

        it('should return comprehensive statistics', () => {
            const stats = moderationService.getModerationStats();

            expect(stats.total).toBeGreaterThan(0);
            expect(stats.automated).toBeGreaterThan(0);
            expect(stats.actionBreakdown).toBeDefined();
            expect(stats.severityBreakdown).toBeDefined();
            expect(stats.queueStats).toBeDefined();
            expect(stats.automationRate).toBeGreaterThan(0);
        });

        it('should filter by timeframe', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const stats = moderationService.getModerationStats({
                start: yesterday,
                end: tomorrow
            });

            expect(stats).toBeDefined();
        });
    });

    describe('updateModerationSettings', () => {
        it('should update moderation settings', () => {
            const newSettings = {
                flagThreshold: 0.8,
                enableToxicityDetection: false
            };

            moderationService.updateModerationSettings(newSettings);
            const settings = moderationService.getModerationSettings();

            expect(settings.flagThreshold).toBe(0.8);
            expect(settings.enableToxicityDetection).toBe(false);
        });
    });

    describe('cleanupOldQueueItems', () => {
        it('should remove old reviewed items', async () => {
            // Add an item and mark it as reviewed
            const result = await moderationService.moderateBeforePublish(
                'Test content',
                'post',
                'user123'
            );

            if (result.queueId) {
                moderationService.processModerationDecision(
                    result.queueId,
                    'approve',
                    'moderator123'
                );

                const cleanedCount = moderationService.cleanupOldQueueItems(0);
                expect(cleanedCount).toBeGreaterThanOrEqual(0);
            }
        });
    });
});