import { prisma } from './prisma';
import { Like } from '@prisma/client';

/**
 * Like utility functions
 */

/**
 * Like a post
 * @param userId User ID
 * @param postId Post ID
 * @returns Created like
 */
export async function likePost(userId: string, postId: string): Promise<Like> {
    // Check if post exists
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check if user has already liked the post
    const existingLike = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });

    if (existingLike) {
        throw new Error('You have already liked this post');
    }

    // Create like
    const like = await prisma.like.create({
        data: {
            userId,
            postId,
        },
    });

    // Create notification for post owner (if not the same user)
    if (post.userId !== userId) {
        await prisma.notification.create({
            data: {
                type: 'like',
                referenceId: postId,
                userId: post.userId,
            },
        });
    }

    return like;
}

/**
 * Unlike a post
 * @param userId User ID
 * @param postId Post ID
 * @returns Deleted like
 */
export async function unlikePost(userId: string, postId: string): Promise<Like> {
    // Check if like exists
    const like = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });

    if (!like) {
        throw new Error('You have not liked this post');
    }

    // Delete like
    return await prisma.like.delete({
        where: {
            id: like.id,
        },
    });
}

/**
 * Check if user has liked a post
 * @param userId User ID
 * @param postId Post ID
 * @returns True if user has liked the post
 */
export async function hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });

    return !!like;
}

/**
 * Get likes for a post
 * @param postId Post ID
 * @param page Page number (1-based)
 * @param pageSize Number of likes per page
 * @returns Likes for post
 */
export async function getLikesByPostId(
    postId: string,
    page = 1,
    pageSize = 10
): Promise<{ likes: Like[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [likes, total] = await Promise.all([
        prisma.like.findMany({
            where: { postId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                user: true,
            },
        }),
        prisma.like.count({
            where: { postId },
        }),
    ]);

    return { likes, total };
}

/**
 * Get likes by user ID
 * @param userId User ID
 * @param page Page number (1-based)
 * @param pageSize Number of likes per page
 * @returns Likes by user
 */
export async function getLikesByUserId(
    userId: string,
    page = 1,
    pageSize = 10
): Promise<{ likes: Like[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [likes, total] = await Promise.all([
        prisma.like.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                post: {
                    include: {
                        user: true,
                    },
                },
            },
        }),
        prisma.like.count({
            where: { userId },
        }),
    ]);

    return { likes, total };
}