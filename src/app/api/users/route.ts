import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users
 * Get all users (with pagination)
 */
export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build where clause for search
        const where = search
            ? {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { displayName: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        // Get users with pagination
        const users = await prisma.user.findMany({
            where,
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
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        // Get total count for pagination
        const total = await prisma.user.count({ where });

        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}