import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNotificationsByUserId, getUnreadNotificationCount } from '@/lib/notification-utils';

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 50); // Max 50 per page
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        // Validate page parameters
        if (page < 1 || pageSize < 1) {
            return NextResponse.json(
                { error: { code: 'INVALID_PARAMS', message: 'Page and pageSize must be positive integers' } },
                { status: 400 }
            );
        }

        // Get notifications
        const { notifications, total } = await getNotificationsByUserId(
            session.user.id,
            page,
            pageSize,
            unreadOnly
        );

        // Get unread count
        const unreadCount = await getUnreadNotificationCount(session.user.id);

        return NextResponse.json({
            notifications,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } },
            { status: 500 }
        );
    }
}