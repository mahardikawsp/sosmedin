import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { getNotificationsByUserId, getUnreadNotificationCount } from '@/lib/notification-utils';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/notification-utils');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGetNotificationsByUserId = getNotificationsByUserId as jest.MockedFunction<typeof getNotificationsByUserId>;
const mockGetUnreadNotificationCount = getUnreadNotificationCount as jest.MockedFunction<typeof getUnreadNotificationCount>;

describe('/api/notifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/notifications');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return notifications for authenticated user', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };
            const mockNotifications = [
                {
                    id: 'notif1',
                    type: 'like',
                    userId: 'user1',
                    referenceId: 'post1',
                    isRead: false,
                    createdAt: new Date(),
                }
            ];

            mockGetServerSession.mockResolvedValue(mockSession);
            mockGetNotificationsByUserId.mockResolvedValue({
                notifications: mockNotifications,
                total: 1
            });
            mockGetUnreadNotificationCount.mockResolvedValue(1);

            const request = new NextRequest('http://localhost:3000/api/notifications');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.notifications).toEqual(mockNotifications);
            expect(data.unreadCount).toBe(1);
            expect(data.pagination.total).toBe(1);
        });

        it('should handle pagination parameters', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockGetNotificationsByUserId.mockResolvedValue({
                notifications: [],
                total: 0
            });
            mockGetUnreadNotificationCount.mockResolvedValue(0);

            const request = new NextRequest('http://localhost:3000/api/notifications?page=2&pageSize=20');
            const response = await GET(request);

            expect(mockGetNotificationsByUserId).toHaveBeenCalledWith('user1', 2, 20, false);
        });

        it('should handle unreadOnly parameter', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockGetNotificationsByUserId.mockResolvedValue({
                notifications: [],
                total: 0
            });
            mockGetUnreadNotificationCount.mockResolvedValue(0);

            const request = new NextRequest('http://localhost:3000/api/notifications?unreadOnly=true');
            const response = await GET(request);

            expect(mockGetNotificationsByUserId).toHaveBeenCalledWith('user1', 1, 10, true);
        });

        it('should validate page parameters', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost:3000/api/notifications?page=0');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error.code).toBe('INVALID_PARAMS');
        });

        it('should limit pageSize to maximum of 50', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockGetNotificationsByUserId.mockResolvedValue({
                notifications: [],
                total: 0
            });
            mockGetUnreadNotificationCount.mockResolvedValue(0);

            const request = new NextRequest('http://localhost:3000/api/notifications?pageSize=100');
            const response = await GET(request);

            expect(mockGetNotificationsByUserId).toHaveBeenCalledWith('user1', 1, 50, false);
        });
    });
});