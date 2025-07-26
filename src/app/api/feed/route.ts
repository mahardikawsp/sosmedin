import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
    withApiOptimizations,
    parsePaginationParams,
    optimizeApiResponse,
    withQueryPerformanceMonitoring
} from '@/lib/api-optimization';
import { QueryOptimizer, dbCache } from '@/lib/db-optimization';

// Initialize query optimizer
const queryOptimizer = new QueryOptimizer(prisma);

/**
 * GET /api/feed
 * Get personalized feed with suggested users and trending content
 */
async function getFeedHandler(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        const { searchParams } = new URL(request.url);

        const type = searchParams.get('type') || 'personalized';
        const { cursor, limit } = parsePaginationParams(searchParams);
        const finalLimit = Math.min(limit || 20, 50);

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
            // Use cached query for explore feed
            const cacheKey = `explore-feed:${cursor || 'start'}:${finalLimit}:${currentUserId || 'anonymous'}`;
            posts = await dbCache.withCache(
                cacheKey,
                () => withQueryPerformanceMonitoring('explore-feed', async () => {
                    return prisma.post.findMany({
                        where: {
                            parentId: null,
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
                        take: finalLimit,
                        ...(cursor && {
                            skip: 1,
                            cursor: { id: cursor },
                        }),
                    });
                })(),
                120 // Cache for 2 minutes
            );

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
            // Use optimized trending query with caching
            const cacheKey = `trending-feed:${cursor || 'start'}:${finalLimit}:${currentUserId || 'anonymous'}`;
            posts = await dbCache.withCache(
                cacheKey,
                () => withQueryPerformanceMonitoring('trending-feed', async () => {
                    return queryOptimizer.getTrendingPosts(finalLimit, 24, currentUserId);
                })(),
                300 // Cache for 5 minutes
            );
        } else {
            // Use optimized personalized feed query
            const cacheKey = `personalized-feed:${currentUserId}:${cursor || 'start'}:${finalLimit}`;
            posts = await dbCache.withCache(
                cacheKey,
                () => withQueryPerformanceMonitoring('personalized-feed', async () => {
                    return queryOptimizer.getOptimizedFeed(currentUserId, cursor, finalLimit);
                })(),
                60 // Cache for 1 minute (shorter for personalized content)
            );
        }

        // Transform posts to include isLiked flag
        const transformedPosts = posts.map(post => ({
            ...post,
            isLiked: currentUserId && post.likes ? (post.likes.length > 0) : false,
            likes: undefined, // Remove the likes array from response
        }));

        const response = {
            posts: transformedPosts,
            hasMore: posts.length === finalLimit,
            nextCursor: posts.length === finalLimit ? posts[posts.length - 1].id : null,
            type,
            ...(suggestedUsers.length > 0 && { suggestedUsers }),
        };

        return NextResponse.json(optimizeApiResponse(response));
    } catch (error) {
        console.error('Error fetching feed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feed' },
            { status: 500 }
        );
    }
}

// Export optimized handler
export const GET = withApiOptimizations(getFeedHandler, {
    cache: { ttl: 120 }, // Cache for 2 minutes
    rateLimit: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    monitoring: true,
});