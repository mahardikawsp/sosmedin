import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { moderationService } from '@/lib/moderation-service';

/**
 * POST /api/posts
 * Create a new post
 */
export async function POST(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, parentId } = body;

        // Validate and moderate content with automated system
        const moderationResult = await moderationService.moderateBeforePublish(
            content,
            parentId ? 'reply' : 'post',
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

        // If parentId is provided, validate that the parent post exists
        if (parentId) {
            const parentPost = await prisma.post.findUnique({
                where: { id: parentId },
            });

            if (!parentPost) {
                return NextResponse.json(
                    { error: 'Parent post not found' },
                    { status: 404 }
                );
            }
        }

        // Create the post with moderated content
        const post = await prisma.post.create({
            data: {
                content: finalContent.trim(),
                userId: currentUserId,
                parentId: parentId || null,
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

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/posts
 * Get posts for feed (personalized or explore)
 */
export async function GET(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        const { searchParams } = new URL(request.url);

        const type = searchParams.get('type') || 'feed'; // 'feed' or 'explore'
        const cursor = searchParams.get('cursor'); // For pagination
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        let posts;

        if (type === 'explore' || !currentUserId) {
            // Explore feed - show all posts, ordered by recent activity
            posts = await prisma.post.findMany({
                where: {
                    parentId: null, // Only top-level posts for feed
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
                    createdAt: 'desc',
                },
                take: limit,
                ...(cursor && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
            });
        } else {
            // Personalized feed - show posts from followed users
            const followingUsers = await prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true },
            });

            const followingIds = followingUsers.map(f => f.followingId);

            // Include current user's posts in their own feed
            followingIds.push(currentUserId);

            posts = await prisma.post.findMany({
                where: {
                    parentId: null, // Only top-level posts for feed
                    userId: {
                        in: followingIds,
                    },
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
                    likes: {
                        where: { userId: currentUserId },
                        select: { id: true },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
                ...(cursor && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
            });
        }

        // Transform the response to include isLiked flag
        const transformedPosts = posts.map(post => ({
            ...post,
            isLiked: currentUserId ? post.likes.length > 0 : false,
            likes: undefined, // Remove the likes array from response
        }));

        return NextResponse.json({
            posts: transformedPosts,
            hasMore: posts.length === limit,
            nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}