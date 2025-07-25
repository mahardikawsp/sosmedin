import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/[username]/following
 * Get users that a specific user is following
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

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

        // Get users that this user is following
        const following = await prisma.follow.findMany({
            where: { followerId: user.id },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        bio: true,
                        profileImageUrl: true,
                        _count: {
                            select: {
                                followedBy: true,
                                following: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        // Check if current user is following each user
        let followingStatus: { [key: string]: boolean } = {};
        if (currentUserId) {
            const followingRecords = await prisma.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: {
                        in: following.map((f) => f.following.id),
                    },
                },
                select: { followingId: true },
            });

            followingStatus = followingRecords.reduce((acc, record) => {
                acc[record.followingId] = true;
                return acc;
            }, {} as { [key: string]: boolean });
        }

        // Transform following data
        const transformedFollowing = following.map((follow) => ({
            ...follow.following,
            isFollowing: followingStatus[follow.following.id] || false,
            isCurrentUser: currentUserId === follow.following.id,
            followedAt: follow.createdAt,
        }));

        // Get total count for pagination
        const total = await prisma.follow.count({
            where: { followerId: user.id },
        });

        return NextResponse.json({
            following: transformedFollowing,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching user following:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user following' },
            { status: 500 }
        );
    }
}