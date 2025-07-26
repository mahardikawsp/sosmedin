import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markNotificationAsRead, deleteNotification } from '@/lib/notification-utils';

/**
 * PUT /api/notifications/[id]
 * Mark a notification as read
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const notificationId = params.id;
        if (!notificationId) {
            return NextResponse.json(
                { error: { code: 'INVALID_PARAMS', message: 'Notification ID is required' } },
                { status: 400 }
            );
        }

        // Mark notification as read
        const notification = await markNotificationAsRead(notificationId, session.user.id);

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);

        if (error instanceof Error) {
            if (error.message === 'Notification not found') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Notification not found' } },
                    { status: 404 }
                );
            }
            if (error.message.includes('Unauthorized')) {
                return NextResponse.json(
                    { error: { code: 'FORBIDDEN', message: 'You can only mark your own notifications as read' } },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to mark notification as read' } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const notificationId = params.id;
        if (!notificationId) {
            return NextResponse.json(
                { error: { code: 'INVALID_PARAMS', message: 'Notification ID is required' } },
                { status: 400 }
            );
        }

        // Delete notification
        const notification = await deleteNotification(notificationId, session.user.id);

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Error deleting notification:', error);

        if (error instanceof Error) {
            if (error.message === 'Notification not found') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Notification not found' } },
                    { status: 404 }
                );
            }
            if (error.message.includes('Unauthorized')) {
                return NextResponse.json(
                    { error: { code: 'FORBIDDEN', message: 'You can only delete your own notifications' } },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete notification' } },
            { status: 500 }
        );
    }
}