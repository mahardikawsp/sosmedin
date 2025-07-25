import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/posts/[id]/replies
 * Get replies to a specific post with pagination
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUserId = await getCurrentUserId();
        const postId = params.id;
        const { searchParams } = new URL(request.url);

        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        // First, verify the parent post exists
        const parentPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!parentPost) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // Get replies to the post
        const replies = await prisma.post.findMany({
            where: {
                parentId: postId,
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
                createdAt: 'asc', // Replies are typically shown chronologically
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
        console.error('Error fetching post replies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch post replies' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/posts/[id]/replies
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

        const postId = params.id;
        const body = await request.json();
        const { content } = body;

        // Validate content
        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        if (content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Content cannot be empty' },
                { status: 400 }
            );
        }

        if (content.length > 500) {
            return NextResponse.json(
                { error: 'Content cannot exceed 500 characters' },
                { status: 400 }
            );
        }

        // Verify the parent post exists
        const parentPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
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
                content: content.trim(),
                userId: currentUserId,
                parentId: postId,
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

        return NextResponse.json(reply, { status: 201 });
    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json(
            { error: 'Failed to create reply' },
            { status: 500 }
        );
    }
}