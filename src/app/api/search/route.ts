import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search
 * Universal search endpoint for users and posts
 */
export async function GET(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        const { searchParams } = new URL(request.url);

        const query = searchParams.get('q');
        const type = searchParams.get('type') || 'all'; // 'all', 'users', 'posts'
        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        if (query.trim().length < 2) {
            return NextResponse.json(
                { error: 'Search query must be at least 2 characters' },
                { status: 400 }
            );
        }

        const searchQuery = query.trim();
        const results: any = {};

        // Search users
        if (type === 'all' || type === 'users') {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { username: { contains: searchQuery, mode: 'insensitive' } },
                        { displayName: { contains: searchQuery, mode: 'insensitive' } },
                    ],
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
                    followedBy: currentUserId ? {
                        where: { followerId: currentUserId },
                        select: { id: true },
                    } : false,
                },
                take: type === 'users' ? limit : Math.min(limit / 2, 10),
                orderBy: [
                    // Prioritize exact username matches
                    { username: 'asc' },
                    { displayName: 'asc' },
                ],
            });

            // Transform users to include isFollowing flag
            results.users = users.map(user => ({
                ...user,
                isFollowing: currentUserId ? user.followedBy.length > 0 : false,
                followedBy: undefined, // Remove from response
            }));
        }

        // Search posts
        if (type === 'all' || type === 'posts') {
            const posts = await prisma.post.findMany({
                where: {
                    content: {
                        contains: searchQuery,
                        mode: 'insensitive',
                    },
                    parentId: null, // Only search top-level posts
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
                take: type === 'posts' ? limit : Math.min(limit / 2, 10),
                orderBy: {
                    createdAt: 'desc',
                },
                ...(cursor && type === 'posts' && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
            });

            // Transform posts to include isLiked flag
            results.posts = posts.map(post => ({
                ...post,
                isLiked: currentUserId ? post.likes.length > 0 : false,
                likes: undefined, // Remove from response
            }));
        }

        // Add pagination info for posts if searching posts specifically
        if (type === 'posts') {
            results.hasMore = results.posts?.length === limit;
            results.nextCursor = results.hasMore ? results.posts[results.posts.length - 1].id : null;
        }

        return NextResponse.json({
            ...results,
            query: searchQuery,
            type,
        });
    } catch (error) {
        console.error('Error searching:', error);
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        );
    }
}