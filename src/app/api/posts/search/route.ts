import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/posts/search
 * Search for posts by content
 */
export async function GET(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        const { searchParams } = new URL(request.url);

        const query = searchParams.get('q');
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

        // Search for posts containing the query in their content
        const posts = await prisma.post.findMany({
            where: {
                content: {
                    contains: query.trim(),
                    mode: 'insensitive',
                },
                parentId: null, // Only search top-level posts for main results
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
                {
                    createdAt: 'desc',
                },
            ],
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
        });

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
            query: query.trim(),
        });
    } catch (error) {
        console.error('Error searching posts:', error);
        return NextResponse.json(
            { error: 'Failed to search posts' },
            { status: 500 }
        );
    }
}