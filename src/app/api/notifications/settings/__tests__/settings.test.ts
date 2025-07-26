import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/notifications/settings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/notifications/settings');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return notification settings for authenticated user', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };
            const mockSettings = {
                likes: true,
                follows: false,
                replies: true
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.user.findUnique.mockResolvedValue({
                notificationSettings: mockSettings
            });

            const request = new NextRequest('http://localhost:3000/api/notifications/settings');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.settings).toEqual(mockSettings);
        });

        it('should return default settings if user has no settings', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.user.findUnique.mockResolvedValue({
                notificationSettings: null
            });

            const request = new NextRequest('http://localhost:3000/api/notifications/settings');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.settings).toEqual({
                likes: true,
                follows: true,
                replies: true
            });
        });
    });

    describe('PUT', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: { likes: false } })
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should update notification settings for authenticated user', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };
            const newSettings = {
                likes: false,
                follows: true,
                replies: false
            };

            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.user.update.mockResolvedValue({
                notificationSettings: newSettings
            });

            const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: newSettings })
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.settings).toEqual(newSettings);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user1' },
                data: { notificationSettings: newSettings },
                select: { notificationSettings: true }
            });
        });

        it('should validate settings structure', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: null })
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error.code).toBe('INVALID_PARAMS');
        });

        it('should validate settings keys', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: { invalidKey: true } })
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error.code).toBe('INVALID_PARAMS');
            expect(data.error.message).toContain('Invalid settings keys');
        });

        it('should validate settings values are boolean', async () => {
            const mockSession = {
                user: { id: 'user1', email: 'test@example.com' }
            };

            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost:3000/api/notifications/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: { likes: 'true' } })
            });
            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error.code).toBe('INVALID_PARAMS');
            expect(data.error.message).toContain('must be boolean');
        });
    });
});