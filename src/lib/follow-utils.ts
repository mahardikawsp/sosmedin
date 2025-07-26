import { prisma } from './prisma';
import { Follow } from '../generated/prisma';

/**
 * Follow utility functions
 */

/**
 * Follow a user
 * @param followerId ID of the user who is following
 * @param followingId ID of the user being followed
 * @returns Created follow
 */
export async function followUser(followerId: string, followingId: string): Promise<Follow> {
    // Check if users are the same
    if (followerId === followingId) {
        throw new Error('You cannot follow yourself');
    }

    // Check if both users exist
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: [followerId, followingId],
            },
        },
    });

    if (users.length !== 2) {
        throw new Error('One or both users not found');
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
    });

    if (existingFollow) {
        throw new Error('You are already following this user');
    }

    // Create follow
    const follow = await prisma.follow.create({
        data: {
            followerId,
            followingId,
        },
    });

    // Create notification for followed user
    await prisma.notification.create({
        data: {
            type: 'follow',
            referenceId: followerId,
            userId: followingId,
        },
    });

    return follow;
}

/**
 * Unfollow a user
 * @param followerId ID of the user who is unfollowing
 * @param followingId ID of the user being unfollowed
 * @returns Deleted follow
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<Follow> {
    // Check if follow exists
    const follow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
    });

    if (!follow) {
        throw new Error('You are not following this user');
    }

    // Delete follow
    return await prisma.follow.delete({
        where: {
            id: follow.id,
        },
    });
}

/**
 * Check if user is following another user
 * @param followerId ID of the user who might be following
 * @param followingId ID of the user who might be followed
 * @returns True if following
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
    });

    return !!follow;
}

/**
 * Get followers of a user
 * @param userId User ID
 * @param page Page number (1-based)
 * @param pageSize Number of followers per page
 * @returns Followers of user
 */
export async function getFollowers(
    userId: string,
    page = 1,
    pageSize = 10
): Promise<{ followers: Follow[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [followers, total] = await Promise.all([
        prisma.follow.findMany({
            where: { followingId: userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                follower: true,
            },
        }),
        prisma.follow.count({
            where: { followingId: userId },
        }),
    ]);

    return { followers, total };
}

/**
 * Get users followed by a user
 * @param userId User ID
 * @param page Page number (1-based)
 * @param pageSize Number of followed users per page
 * @returns Users followed by user
 */
export async function getFollowing(
    userId: string,
    page = 1,
    pageSize = 10
): Promise<{ following: Follow[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [following, total] = await Promise.all([
        prisma.follow.findMany({
            where: { followerId: userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                following: true,
            },
        }),
        prisma.follow.count({
            where: { followerId: userId },
        }),
    ]);

    return { following, total };
}