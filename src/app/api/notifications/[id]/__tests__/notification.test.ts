import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { markNotificationAsRead, deleteNotification } from '@/lib/notification-utils';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/notification-utils');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockMarkNotificationAsRead = markNotificationAsRead as jest.MockedFunction<typeof markNotificationAsRead>;
const mockDeleteNotification = deleteNotification as jest.MockedFunction<typeof deleteNotification>;

describe('/api/notifications/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('PUT', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'PUT'
            });
            const response = await PUT(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should mark notification as read for authenticated user', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };
            const mockNotification = {
                id: 'notif1',
                type: 'like',
                userId: 'user1',
                referenceId: 'post1',
                isRead: true,
                createdAt: new Date(),
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockMarkNotificationAsRead.mockResolvedValue(mockNotification);

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'PUT'
            });
            const response = await PUT(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.notification).toEqual(mockNotification);
            expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('notif1', 'user1');
        });

        it('should return 404 if notification not found', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockMarkNotificationAsRead.mockRejectedValue(new Error('Notification not found'));

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'PUT'
            });
            const response = await PUT(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should return 403 if user tries to mark another users notification as read', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockMarkNotificationAsRead.mockRejectedValue(new Error('Unauthorized: You can only mark your own notifications as read'));

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'PUT'
            });
            const response = await PUT(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error.code).toBe('FORBIDDEN');
        });
    });

    describe('DELETE', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'DELETE'
            });
            const response = await DELETE(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should delete notification for authenticated user', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };
            const mockNotification = {
                id: 'notif1',
                type: 'like',
                userId: 'user1',
                referenceId: 'post1',
                isRead: false,
                createdAt: new Date(),
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockDeleteNotification.mockResolvedValue(mockNotification);

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'DELETE'
            });
            const response = await DELETE(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.notification).toEqual(mockNotification);
            expect(mockDeleteNotification).toHaveBeenCalledWith('notif1', 'user1');
        });

        it('should return 404 if notification not found', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockDeleteNotification.mockRejectedValue(new Error('Notification not found'));

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'DELETE'
            });
            const response = await DELETE(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should return 403 if user tries to delete another users notification', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockDeleteNotification.mockRejectedValue(new Error('Unauthorized: You can only delete your own notifications'));

            const request = new NextRequest('http://localhost:3000/api/notifications/notif1', {
                method: 'DELETE'
            });
            const response = await DELETE(request, { params: { id: 'notif1' } });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error.code).toBe('FORBIDDEN');
        });
    });
});