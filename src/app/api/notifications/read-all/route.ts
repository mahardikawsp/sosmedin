import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markAllNotificationsAsRead } from '@/lib/notification-utils';

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Mark all notifications as read
        const count = await markAllNotificationsAsRead(session.user.id);

        return NextResponse.json({
            message: `${count} notifications marked as read`,
            count
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to mark all notifications as read' } },
            { status: 500 }
        );
    }
}