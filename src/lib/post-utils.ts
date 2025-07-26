import { prisma } from './prisma';
import { Post, User } from '../generated/prisma';

// Constants
const MAX_POST_LENGTH = 500;

/**
 * Post utility functions
 */

/**
 * Validate post content
 * @param content Post content
 * @returns True if content is valid
 * @throws Error if content is invalid
 */
export function validatePostContent(content: string): boolean {
    if (!content || content.trim() === '') {
        throw new Error('Post content cannot be empty');
    }

    if (content.length > MAX_POST_LENGTH) {
        throw new Error(`Post content cannot exceed ${MAX_POST_LENGTH} characters`);
    }

    return true;
}

/**
 * Create a new post
 * @param postData Post data
 * @returns Created post
 */
export async function createPost(postData: {
    content: string;
    userId: string;
    parentId?: string;
}): Promise<Post> {
    // Validate content
    validatePostContent(postData.content);

    // Check if parent post exists if parentId is provided
    if (postData.parentId) {
        const parentPost = await prisma.post.findUnique({
            where: { id: postData.parentId },
        });

        if (!parentPost) {
            throw new Error('Parent post not found');
        }
    }

    // Create post
    return await prisma.post.create({
        data: {
            content: postData.content,
            userId: postData.userId,
            parentId: postData.parentId,
        },
    });
}

/**
 * Get post by ID with optional relations
 * @param postId Post ID
 * @param includeUser Include user relation
 * @param includeReplies Include replies relation
 * @param includeLikes Include likes relation
 * @returns Post with requested relations
 */
export async function getPostById(
    postId: string,
    includeUser = false,
    includeReplies = false,
    includeLikes = false
): Promise<Post | null> {
    return await prisma.post.findUnique({
        where: { id: postId },
        include: {
            user: includeUser,
            replies: includeReplies,
            likes: includeLikes,
        },
    });
}

/**
 * Update a post
 * @param postId Post ID
 * @param content New content
 * @param userId User ID (for authorization)
 * @returns Updated post
 */
export async function updatePost(
    postId: string,
    content: string,
    userId: string
): Promise<Post> {
    // Validate content
    validatePostContent(content);

    // Get post
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check if user is the author
    if (post.userId !== userId) {
        throw new Error('Unauthorized: You can only edit your own posts');
    }

    // Update post
    return await prisma.post.update({
        where: { id: postId },
        data: {
            content,
            isEdited: true,
        },
    });
}

/**
 * Delete a post
 * @param postId Post ID
 * @param userId User ID (for authorization)
 * @returns Deleted post
 */
export async function deletePost(postId: string, userId: string): Promise<Post> {
    // Get post
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check if user is the author
    if (post.userId !== userId) {
        throw new Error('Unauthorized: You can only delete your own posts');
    }

    // Delete post
    return await prisma.post.delete({
        where: { id: postId },
    });
}

/**
 * Get posts by user ID
 * @param userId User ID
 * @param page Page number (1-based)
 * @param pageSize Number of posts per page
 * @returns Posts by user
 */
export async function getPostsByUserId(
    userId: string,
    page = 1,
    pageSize = 10
): Promise<{ posts: Post[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                user: true,
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        }),
        prisma.post.count({
            where: { userId },
        }),
    ]);

    return { posts, total };
}

/**
 * Get replies to a post
 * @param postId Post ID
 * @param page Page number (1-based)
 * @param pageSize Number of replies per page
 * @returns Replies to post
 */
export async function getRepliesByPostId(
    postId: string,
    page = 1,
    pageSize = 10
): Promise<{ replies: Post[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [replies, total] = await Promise.all([
        prisma.post.findMany({
            where: { parentId: postId },
            orderBy: { createdAt: 'asc' },
            skip,
            take: pageSize,
            include: {
                user: true,
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        }),
        prisma.post.count({
            where: { parentId: postId },
        }),
    ]);

    return { replies, total };
}