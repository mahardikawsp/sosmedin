import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/[username]/posts
 * Get posts by a specific user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Get current user ID (if authenticated)
        const currentUserId = await getCurrentUserId();

        // Find the user by username
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get user's posts
        const posts = await prisma.post.findMany({
            where: {
                userId: user.id,
                parentId: null, // Only get top-level posts, not replies
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
                likes: currentUserId
                    ? {
                        where: { userId: currentUserId },
                        select: { id: true },
                    }
                    : false,
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        // Transform posts to include isLiked flag
        const transformedPosts = posts.map((post) => ({
            ...post,
            isLiked: currentUserId ? post.likes.length > 0 : false,
            likes: undefined, // Remove the likes array from response
        }));

        // Get total count for pagination
        const total = await prisma.post.count({
            where: {
                userId: user.id,
                parentId: null,
            },
        });

        return NextResponse.json({
            posts: transformedPosts,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user posts' },
            { status: 500 }
        );
    }
}