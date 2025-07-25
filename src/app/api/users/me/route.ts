import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/me
 * Get current user's profile
 */
export async function GET() {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                bio: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true,
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

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching current user profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/users/me
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { displayName, bio, username } = body;

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

        if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return NextResponse.json(
                { error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' },
                { status: 400 }
            );
        }

        // Check if new username is already taken (if changing username)
        if (username) {
            const currentUser = await prisma.user.findUnique({
                where: { id: currentUserId },
                select: { username: true },
            });

            if (currentUser && username !== currentUser.username) {
                const existingUser = await prisma.user.findUnique({
                    where: { username },
                });

                if (existingUser) {
                    return NextResponse.json(
                        { error: 'Username is already taken' },
                        { status: 400 }
                    );
                }
            }
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: currentUserId },
            data: {
                displayName: displayName !== undefined ? displayName : undefined,
                bio: bio !== undefined ? bio : undefined,
                username: username !== undefined ? username : undefined,
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                bio: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        posts: true,
                        followedBy: true,
                        following: true,
                    },
                },
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