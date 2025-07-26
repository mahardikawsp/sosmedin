import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/feed
 * Get personalized feed with suggested users and trending content
 */
export async function GET(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        const { searchParams } = new URL(request.url);

        const type = searchParams.get('type') || 'personalized'; // 'personalized', 'explore', 'trending'
        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        let posts;
        let suggestedUsers: Array<{
            id: string;
            username: string;
            displayName: string | null;
            bio: string | null;
            profileImageUrl: string | null;
            _count: {
                posts: number;
                followedBy: number;
                following: number;
            };
        }> = [];

        if (type === 'explore' || !currentUserId) {
            // Explore feed - show trending and popular posts
            posts = await prisma.post.findMany({
                where: {
                    parentId: null, // Only top-level posts
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
                orderBy: [
                    // Sort by engagement (likes + replies) and recency
                    { createdAt: 'desc' },
                ],
                take: limit,
                ...(cursor && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
            });

            // Get suggested users if user is authenticated
            if (currentUserId) {
                const followingIds = await prisma.follow.findMany({
                    where: { followerId: currentUserId },
                    select: { followingId: true },
                });

                const followingUserIds = followingIds.map(f => f.followingId);
                followingUserIds.push(currentUserId); // Exclude current user

                suggestedUsers = await prisma.user.findMany({
                    where: {
                        id: {
                            notIn: followingUserIds,
                        },
                    },
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        bio: true,
                        profileImageUrl: true,
                        _count: {
                            select: {
                                posts: true,
                                followedBy: true,
                                following: true,
                            },
                        },
                    },
                    orderBy: {
                        followedBy: {
                            _count: 'desc',
                        },
                    },
                    take: 5,
                });
            }
        } else if (type === 'trending') {
            // Trending posts - posts with high engagement in the last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            posts = await prisma.post.findMany({
                where: {
                    parentId: null,
                    createdAt: {
                        gte: yesterday,
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
                    likes: currentUserId ? {
                        where: { userId: currentUserId },
                        select: { id: true },
                    } : false,
                },
                orderBy: [
                    // Order by engagement metrics for trending
                    { likes: { _count: 'desc' } },
                    { replies: { _count: 'desc' } },
                    { createdAt: 'desc' },
                ],
                take: limit,
                ...(cursor && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
            });
        } else {
            // Personalized feed - posts from followed users
            const followingUsers = await prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true },
            });

            const followingIds = followingUsers.map(f => f.followingId);

            // If user isn't following anyone, show explore feed instead
            if (followingIds.length === 0) {
                // Fall back to explore feed logic
                posts = await prisma.post.findMany({
                    where: {
                        parentId: null, // Only top-level posts
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
                    orderBy: [
                        { createdAt: 'desc' },
                    ],
                    take: limit,
                    ...(cursor && {
                        skip: 1,
                        cursor: { id: cursor },
                    }),
                });
            } else {
                // Include current user's posts in their own feed
                followingIds.push(currentUserId);

                posts = await prisma.post.findMany({
                    where: {
                        parentId: null,
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
        }

        // Transform posts to include isLiked flag
        const transformedPosts = posts.map(post => ({
            ...post,
            isLiked: currentUserId ? post.likes.length > 0 : false,
            likes: undefined, // Remove the likes array from response
        }));

        const response: {
            posts: typeof transformedPosts;
            hasMore: boolean;
            nextCursor: string | null;
            type: string;
            suggestedUsers?: typeof suggestedUsers;
        } = {
            posts: transformedPosts,
            hasMore: posts.length === limit,
            nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
            type,
        };

        // Include suggested users for explore feed
        if (suggestedUsers.length > 0) {
            response.suggestedUsers = suggestedUsers;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching feed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feed' },
            { status: 500 }
        );
    }
}