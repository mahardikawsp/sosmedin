import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { generateReplyNotification } from '@/lib/notification-service';
import { moderationService } from '@/lib/moderation-service';

/**
 * POST /api/posts/[id]/reply
 * Create a reply to a specific post
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const parentId = params.id;
        const body = await request.json();
        const { content } = body;

        // Validate and moderate content with automated system
        const moderationResult = await moderationService.moderateBeforePublish(
            content,
            'reply',
            currentUserId
        );

        // If content is not allowed, return error
        if (!moderationResult.allowed) {
            return NextResponse.json(
                {
                    error: 'Content blocked by moderation system',
                    reason: moderationResult.moderationResult.flagReason,
                    queueId: moderationResult.queueId
                },
                { status: 403 }
            );
        }

        // Use filtered content if available
        const finalContent = moderationResult.filteredContent || content;

        // Validate that the parent post exists
        const parentPost = await prisma.post.findUnique({
            where: { id: parentId },
            select: {
                id: true,
                userId: true,
                user: {
                    select: {
                        username: true,
                        displayName: true,
                    }
                }
            },
        });

        if (!parentPost) {
            return NextResponse.json(
                { error: 'Parent post not found' },
                { status: 404 }
            );
        }

        // Create the reply
        const reply = await prisma.post.create({
            data: {
                content: finalContent.trim(),
                userId: currentUserId,
                parentId: parentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                username: true,
                                displayName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        });

        // Generate real-time notification for the parent post author
        await generateReplyNotification(parentId, parentPost.userId, currentUserId);

        return NextResponse.json(reply, { status: 201 });
    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json(
            { error: 'Failed to create reply' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/posts/[id]/reply
 * Get all replies for a specific post
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUserId = await getCurrentUserId();
        const parentId = params.id;
        const { searchParams } = new URL(request.url);

        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        // Check if parent post exists
        const parentPost = await prisma.post.findUnique({
            where: { id: parentId },
            select: { id: true },
        });

        if (!parentPost) {
            return NextResponse.json(
                { error: 'Parent post not found' },
                { status: 404 }
            );
        }

        // Get replies
        const replies = await prisma.post.findMany({
            where: {
                parentId: parentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
                likes: currentUserId ? {
                    where: { userId: currentUserId },
                    select: { id: true },
                } : false,
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
        });

        // Transform the response to include isLiked flag
        const transformedReplies = replies.map(reply => ({
            ...reply,
            isLiked: currentUserId ? reply.likes.length > 0 : false,
            likes: undefined, // Remove the likes array from response
        }));

        return NextResponse.json({
            replies: transformedReplies,
            hasMore: replies.length === limit,
            nextCursor: replies.length === limit ? replies[replies.length - 1].id : null,
        });
    } catch (error) {
        console.error('Error fetching replies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch replies' },
            { status: 500 }
        );
    }
}