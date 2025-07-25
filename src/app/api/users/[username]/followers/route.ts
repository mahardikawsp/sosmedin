import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/[username]/followers
 * Get followers of a specific user
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

        // Get user's followers
        const followers = await prisma.follow.findMany({
            where: { followingId: user.id },
            include: {
                follower: {
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

        // Check if current user is following each follower
        let followingStatus: { [key: string]: boolean } = {};
        if (currentUserId) {
            const followingRecords = await prisma.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: {
                        in: followers.map((f) => f.follower.id),
                    },
                },
                select: { followingId: true },
            });

            followingStatus = followingRecords.reduce((acc, record) => {
                acc[record.followingId] = true;
                return acc;
            }, {} as { [key: string]: boolean });
        }

        // Transform followers data
        const transformedFollowers = followers.map((follow) => ({
            ...follow.follower,
            isFollowing: followingStatus[follow.follower.id] || false,
            isCurrentUser: currentUserId === follow.follower.id,
            followedAt: follow.createdAt,
        }));

        // Get total count for pagination
        const total = await prisma.follow.count({
            where: { followingId: user.id },
        });

        return NextResponse.json({
            followers: transformedFollowers,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching user followers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user followers' },
            { status: 500 }
        );
    }
}