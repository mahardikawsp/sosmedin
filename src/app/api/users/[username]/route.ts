import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/[username]
 * Get a user profile by username
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;

        // Get current user ID (if authenticated)
        const currentUserId = await getCurrentUserId();

        // Find the user by username
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                profileImageUrl: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        followedBy: true,
                        following: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if the current user is following this user
        let isFollowing = false;
        if (currentUserId) {
            const followRecord = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: user.id,
                    },
                },
            });
            isFollowing = !!followRecord;
        }

        // Return user data with following status
        return NextResponse.json({
            ...user,
            isFollowing,
            isCurrentUser: currentUserId === user.id,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/users/[username]
 * Update a user profile
 */
export async function PUT(
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

        // Find the user by username
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if the current user is the owner of this profile
        if (user.id !== currentUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { displayName, bio, username: newUsername } = body;

        // Validate input
        if (displayName && displayName.length > 50) {
            return NextResponse.json(
                { error: 'Display name cannot exceed 50 characters' },
                { status: 400 }
            );
        }

        if (bio && bio.length > 160) {
            return NextResponse.json(
                { error: 'Bio cannot exceed 160 characters' },
                { status: 400 }
            );
        }

        // Check if new username is already taken (if changing username)
        if (newUsername && newUsername !== username) {
            const existingUser = await prisma.user.findUnique({
                where: { username: newUsername },
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Username is already taken' },
                    { status: 400 }
                );
            }
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                displayName: displayName || undefined,
                bio: bio || undefined,
                username: newUsername || undefined,
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Failed to update user profile' },
            { status: 500 }
        );
    }
}