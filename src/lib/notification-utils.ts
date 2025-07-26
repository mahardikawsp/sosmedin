import { prisma } from './prisma';
import { Notification } from '../generated/prisma';

/**
 * Notification utility functions
 */

/**
 * Create a notification
 * @param notificationData Notification data
 * @returns Created notification
 */
export async function createNotification(notificationData: {
    type: string;
    userId: string;
    referenceId?: string;
}): Promise<Notification> {
    return await prisma.notification.create({
        data: {
            type: notificationData.type,
            userId: notificationData.userId,
            referenceId: notificationData.referenceId,
        },
    });
}

/**
 * Mark a notification as read
 * @param notificationId Notification ID
 * @param userId User ID (for authorization)
 * @returns Updated notification
 */
export async function markNotificationAsRead(
    notificationId: string,
    userId: string
): Promise<Notification> {
    // Get notification
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new Error('Notification not found');
    }

    // Check if user is the recipient
    if (notification.userId !== userId) {
        throw new Error('Unauthorized: You can only mark your own notifications as read');
    }

    // Update notification
    return await prisma.notification.update({
        where: { id: notificationId },
        data: {
            isRead: true,
        },
    });
}

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 * @returns Number of notifications marked as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });

    return result.count;
}

/**
 * Get notifications for a user
 * @param userId User ID
 * @param page Page number (1-based)
 * @param pageSize Number of notifications per page
 * @param unreadOnly Only return unread notifications
 * @returns Notifications for user
 */
export async function getNotificationsByUserId(
    userId: string,
    page = 1,
    pageSize = 10,
    unreadOnly = false
): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const whereClause = {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.notification.count({
            where: whereClause,
        }),
    ]);

    return { notifications, total };
}

/**
 * Get unread notification count for a user
 * @param userId User ID
 * @returns Number of unread notifications
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    return await prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
}

/**
 * Delete a notification
 * @param notificationId Notification ID
 * @param userId User ID (for authorization)
 * @returns Deleted notification
 */
export async function deleteNotification(
    notificationId: string,
    userId: string
): Promise<Notification> {
    // Get notification
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new Error('Notification not found');
    }

    // Check if user is the recipient
    if (notification.userId !== userId) {
        throw new Error('Unauthorized: You can only delete your own notifications');
    }

    // Delete notification
    return await prisma.notification.delete({
        where: { id: notificationId },
    });
}