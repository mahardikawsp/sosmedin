import { NextRequest, NextResponse } from 'next/server';
import { moderationService } from '@/lib/moderation-service';
import { analyzeContent } from '@/lib/automated-moderation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has moderation permissions (in a real app, check user role)
        // For now, we'll allow any authenticated user to view moderation data

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'queue':
                const status = searchParams.get('status') as 'pending' | 'reviewed' | 'escalated' | undefined;
                const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | undefined;
                const contentType = searchParams.get('contentType') as 'post' | 'reply' | 'profile' | undefined;

                const queue = moderationService.getModerationQueue({
                    status,
                    severity,
                    contentType,
                });

                return NextResponse.json({ queue });

            case 'stats':
                const timeframe = searchParams.get('timeframe');
                let timeframeObj;

                if (timeframe) {
                    const days = parseInt(timeframe);
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - days);
                    timeframeObj = { start, end };
                }

                const stats = moderationService.getModerationStats(timeframeObj);
                return NextResponse.json({ stats });

            case 'settings':
                const settings = moderationService.getModerationSettings();
                return NextResponse.json({ settings });

            case 'history':
                const contentId = searchParams.get('contentId');
                if (!contentId) {
                    return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
                }

                const history = moderationService.getModerationHistory(contentId);
                return NextResponse.json({ history });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Moderation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'analyze':
                const { content, options } = body;
                if (!content) {
                    return NextResponse.json({ error: 'Content required' }, { status: 400 });
                }

                const analysisResult = await analyzeContent(content, options);
                return NextResponse.json({ result: analysisResult });

            case 'moderate':
                const { content: moderateContent, contentType, userId, contentId } = body;
                if (!moderateContent || !contentType || !userId) {
                    return NextResponse.json(
                        { error: 'Content, contentType, and userId required' },
                        { status: 400 }
                    );
                }

                const moderationResult = await moderationService.moderateBeforePublish(
                    moderateContent,
                    contentType,
                    userId,
                    contentId
                );

                return NextResponse.json({ result: moderationResult });

            case 'decision':
                const { queueId, decision, reason } = body;
                if (!queueId || !decision) {
                    return NextResponse.json(
                        { error: 'Queue ID and decision required' },
                        { status: 400 }
                    );
                }

                const success = moderationService.processModerationDecision(
                    queueId,
                    decision,
                    session.user.id,
                    reason
                );

                if (!success) {
                    return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
                }

                return NextResponse.json({ success: true });

            case 'bulk-moderate':
                const { contents } = body;
                if (!Array.isArray(contents)) {
                    return NextResponse.json({ error: 'Contents array required' }, { status: 400 });
                }

                const bulkResults = await moderationService.bulkModerate(contents);
                return NextResponse.json({ results: bulkResults });

            case 'update-settings':
                const { settings } = body;
                if (!settings) {
                    return NextResponse.json({ error: 'Settings required' }, { status: 400 });
                }

                moderationService.updateModerationSettings(settings);
                return NextResponse.json({ success: true });

            case 'cleanup':
                const { olderThanDays = 30 } = body;
                const cleanedCount = moderationService.cleanupOldQueueItems(olderThanDays);
                return NextResponse.json({ cleanedCount });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Moderation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}