import {
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    deleteNotification,
} from '../notification-utils';
import { prisma } from '../prisma';

// Mock the prisma client
jest.mock('../prisma', () => ({
    prisma: {
        notification: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            count: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe('Notification Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotification', () => {
        it('should create a notification successfully', async () => {
            const notificationData = {
                type: 'like',
                userId: 'user-id',
                referenceId: 'post-id',
            };

            const mockNotification = {
                id: 'notification-id',
                ...notificationData,
                isRead: false,
                createdAt: new Date(),
            };

            (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await createNotification(notificationData);
            expect(result).toEqual(mockNotification);
            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: notificationData,
            });
        });
    });

    describe('markNotificationAsRead', () => {
        it('should mark a notification as read successfully', async () => {
            const notificationId = 'notification-id';
            const userId = 'user-id';

            const mockNotification = {
                id: notificationId,
                type: 'like',
                userId,
                referenceId: 'post-id',
                isRead: false,
                createdAt: new Date(),
            };

            const mockUpdatedNotification = {
                ...mockNotification,
                isRead: true,
            };

            (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
            (prisma.notification.update as jest.Mock).mockResolvedValue(mockUpdatedNotification);

            const result = await markNotificationAsRead(notificationId, userId);
            expect(result).toEqual(mockUpdatedNotification);
            expect(prisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId },
            });
            expect(prisma.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: {
                    isRead: true,
                },
            });
        });

        it('should throw an error if notification does not exist', async () => {
            const notificationId = 'non-existent-id';
            const userId = 'user-id';

            (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(markNotificationAsRead(notificationId, userId)).rejects.toThrow(
                'Notification not found'
            );
            expect(prisma.notification.update).not.toHaveBeenCalled();
        });

        it('should throw an error if user is not the recipient', async () => {
            const notificationId = 'notification-id';
            const userId = 'user-id';
            const recipientId = 'different-user-id';

            const mockNotification = {
                id: notificationId,
                type: 'like',
                userId: recipientId, // Different from the userId parameter
                referenceId: 'post-id',
                isRead: false,
                createdAt: new Date(),
            };

            (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);

            await expect(markNotificationAsRead(notificationId, userId)).rejects.toThrow(
                'Unauthorized: You can only mark your own notifications as read'
            );
            expect(prisma.notification.update).not.toHaveBeenCalled();
        });
    });

    describe('markAllNotificationsAsRead', () => {
        it('should mark all notifications as read successfully', async () => {
            const userId = 'user-id';
            const mockUpdateResult = { count: 5 };

            (prisma.notification.updateMany as jest.Mock).mockResolvedValue(mockUpdateResult);

            const result = await markAllNotificationsAsRead(userId);
            expect(result).toBe(5);
            expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
        });
    });

    describe('getUnreadNotificationCount', () => {
        it('should return the count of unread notifications', async () => {
            const userId = 'user-id';
            const mockCount = 3;

            (prisma.notification.count as jest.Mock).mockResolvedValue(mockCount);

            const result = await getUnreadNotificationCount(userId);
            expect(result).toBe(3);
            expect(prisma.notification.count).toHaveBeenCalledWith({
                where: {
                    userId,
                    isRead: false,
                },
            });
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification successfully', async () => {
            const notificationId = 'notification-id';
            const userId = 'user-id';

            const mockNotification = {
                id: notificationId,
                type: 'like',
                userId,
                referenceId: 'post-id',
                isRead: false,
                createdAt: new Date(),
            };

            (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
            (prisma.notification.delete as jest.Mock).mockResolvedValue(mockNotification);

            const result = await deleteNotification(notificationId, userId);
            expect(result).toEqual(mockNotification);
            expect(prisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId },
            });
            expect(prisma.notification.delete).toHaveBeenCalledWith({
                where: { id: notificationId },
            });
        });

        it('should throw an error if notification does not exist', async () => {
            const notificationId = 'non-existent-id';
            const userId = 'user-id';

            (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(deleteNotification(notificationId, userId)).rejects.toThrow(
                'Notification not found'
            );
            expect(prisma.notification.delete).not.toHaveBeenCalled();
        });

        it('should throw an error if user is not the recipient', async () => {
            const notificationId = 'notification-id';
            const userId = 'user-id';
            const recipientId = 'different-user-id';

            const mockNotification = {
                id: notificationId,
                type: 'like',
                userId: recipientId, // Different from the userId parameter
                referenceId: 'post-id',
                isRead: false,
                createdAt: new Date(),
            };

            (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);

            await expect(deleteNotification(notificationId, userId)).rejects.toThrow(
                'Unauthorized: You can only delete your own notifications'
            );
            expect(prisma.notification.delete).not.toHaveBeenCalled();
        });
    });
});