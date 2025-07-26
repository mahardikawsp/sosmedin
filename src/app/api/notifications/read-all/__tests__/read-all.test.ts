import { NextRequest } from 'next/server';
import { PUT } from '../route';
import { getServerSession } from 'next-auth';
import { markAllNotificationsAsRead } from '@/lib/notification-utils';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/notification-utils');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockMarkAllNotificationsAsRead = markAllNotificationsAsRead as jest.MockedFunction<typeof markAllNotificationsAsRead>;

describe('/api/notifications/read-all', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('PUT', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/notifications/read-all', {
                method: 'PUT'
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should mark all notifications as read for authenticated user', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockMarkAllNotificationsAsRead.mockResolvedValue(5);

            const request = new NextRequest('http://localhost:3000/api/notifications/read-all', {
                method: 'PUT'
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.count).toBe(5);
            expect(data.message).toBe('5 notifications marked as read');
            expect(mockMarkAllNotificationsAsRead).toHaveBeenCalledWith('user1');
        });

        it('should handle case when no notifications need to be marked as read', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockMarkAllNotificationsAsRead.mockResolvedValue(0);

            const request = new NextRequest('http://localhost:3000/api/notifications/read-all', {
                method: 'PUT'
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.count).toBe(0);
            expect(data.message).toBe('0 notifications marked as read');
        });

        it('should handle database errors', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockMarkAllNotificationsAsRead.mockRejectedValue(new Error('Database error'));

            const request = new NextRequest('http://localhost:3000/api/notifications/read-all', {
                method: 'PUT'
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error.code).toBe('INTERNAL_ERROR');
        });
    });
});