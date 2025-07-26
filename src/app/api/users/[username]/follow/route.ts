import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { generateFollowNotification } from '@/lib/notification-service';

/**
 * POST /api/users/[username]/follow
 * Follow a user
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;

        // Get current user ID
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the user to follow
        const userToFollow = await prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true },
        });

        if (!userToFollow) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if trying to follow themselves
        if (userToFollow.id === currentUserId) {
            return NextResponse.json(
                { error: 'Cannot follow yourself' },
                { status: 400 }
            );
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userToFollow.id,
                },
            },
        });

        if (existingFollow) {
            return NextResponse.json(
                { error: 'Already following this user' },
                { status: 400 }
            );
        }

        // Create follow relationship
        await prisma.follow.create({
            data: {
                followerId: currentUserId,
                followingId: userToFollow.id,
            },
        });

        // Generate real-time notification for the followed user
        await generateFollowNotification(currentUserId, userToFollow.id);

        return NextResponse.json({
            message: `Successfully followed ${userToFollow.username}`,
            isFollowing: true,
        });
    } catch (error) {
        console.error('Error following user:', error);
        return NextResponse.json(
            { error: 'Failed to follow user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[username]/follow
 * Unfollow a user
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;

        // Get current user ID
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the user to unfollow
        const userToUnfollow = await prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true },
        });

        if (!userToUnfollow) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if currently following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userToUnfollow.id,
                },
            },
        });

        if (!existingFollow) {
            return NextResponse.json(
                { error: 'Not following this user' },
                { status: 400 }
            );
        }

        // Remove follow relationship
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userToUnfollow.id,
                },
            },
        });

        return NextResponse.json({
            message: `Successfully unfollowed ${userToUnfollow.username}`,
            isFollowing: false,
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return NextResponse.json(
            { error: 'Failed to unfollow user' },
            { status: 500 }
        );
    }
}