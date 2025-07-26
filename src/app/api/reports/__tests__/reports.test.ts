import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        report: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        post: {
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/reports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST', () => {
        const mockSession = {
            user: { id: 'user1', email: 'test@example.com' },
        };

        it('should create a post report successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.post.findUnique.mockResolvedValue({
                id: 'post1',
                content: 'Test post',
                userId: 'user2',
            } as any);
            mockPrisma.report.findFirst.mockResolvedValue(null);
            mockPrisma.report.create.mockResolvedValue({
                id: 'report1',
                type: 'post',
                reason: 'spam',
                description: 'This is spam',
                reporterId: 'user1',
                reportedPostId: 'post1',
                reporter: { id: 'user1', username: 'testuser', displayName: 'Test User' },
                reportedPost: {
                    id: 'post1',
                    content: 'Test post',
                    user: { id: 'user2', username: 'author', displayName: 'Author' },
                },
            } as any);

            const request = new NextRequest('http://localhost/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'post',
                    reason: 'spam',
                    description: 'This is spam',
                    reportedPostId: 'post1',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.report.id).toBe('report1');
            expect(mockPrisma.report.create).toHaveBeenCalledWith({
                data: {
                    type: 'post',
                    reason: 'spam',
                    description: 'This is spam',
                    reporterId: 'user1',
                    reportedPostId: 'post1',
                    reportedUserId: undefined,
                },
                include: expect.any(Object),
            });
        });

        it('should create a user report successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user2',
                username: 'reporteduser',
                displayName: 'Reported User',
            } as any);
            mockPrisma.report.findFirst.mockResolvedValue(null);
            mockPrisma.report.create.mockResolvedValue({
                id: 'report1',
                type: 'user',
                reason: 'harassment',
                reporterId: 'user1',
                reportedUserId: 'user2',
                reporter: { id: 'user1', username: 'testuser', displayName: 'Test User' },
                reportedUser: { id: 'user2', username: 'reporteduser', displayName: 'Reported User' },
            } as any);

            const request = new NextRequest('http://localhost/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'user',
                    reason: 'harassment',
                    reportedUserId: 'user2',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.report.id).toBe('report1');
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'post',
                    reason: 'spam',
                    reportedPostId: 'post1',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 404 if reported post does not exist', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.post.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'post',
                    reason: 'spam',
                    reportedPostId: 'nonexistent',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should return 400 if user tries to report themselves', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user1', // Same as session user
                username: 'testuser',
                displayName: 'Test User',
            } as any);

            const request = new NextRequest('http://localhost/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'user',
                    reason: 'spam',
                    reportedUserId: 'user1',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error.code).toBe('INVALID_REQUEST');
        });

        it('should return 409 if user has already reported the content', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.post.findUnique.mockResolvedValue({
                id: 'post1',
                content: 'Test post',
                userId: 'user2',
            } as any);
            mockPrisma.report.findFirst.mockResolvedValue({
                id: 'existing-report',
                reporterId: 'user1',
                reportedPostId: 'post1',
            } as any);

            const request = new NextRequest('http://localhost/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'post',
                    reason: 'spam',
                    reportedPostId: 'post1',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error.code).toBe('ALREADY_REPORTED');
        });

        it('should return 400 for invalid request data', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost/api/reports', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'invalid',
                    reason: 'spam',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET', () => {
        const mockSession = {
            user: { id: 'user1', email: 'test@example.com' },
        };

        it('should fetch user reports successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            const mockReports = [
                {
                    id: 'report1',
                    type: 'post',
                    reason: 'spam',
                    status: 'pending',
                    createdAt: new Date(),
                    reportedPost: {
                        id: 'post1',
                        content: 'Test post',
                        user: { id: 'user2', username: 'author', displayName: 'Author' },
                    },
                },
            ];
            mockPrisma.report.findMany.mockResolvedValue(mockReports as any);
            mockPrisma.report.count.mockResolvedValue(1);

            const request = new NextRequest('http://localhost/api/reports?page=1&limit=20');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.reports).toEqual(mockReports);
            expect(data.pagination.total).toBe(1);
            expect(mockPrisma.report.findMany).toHaveBeenCalledWith({
                where: { reporterId: 'user1' },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 20,
            });
        });

        it('should filter reports by status and type', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockPrisma.report.findMany.mockResolvedValue([]);
            mockPrisma.report.count.mockResolvedValue(0);

            const request = new NextRequest('http://localhost/api/reports?status=pending&type=post');
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(mockPrisma.report.findMany).toHaveBeenCalledWith({
                where: {
                    reporterId: 'user1',
                    status: 'pending',
                    type: 'post',
                },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 20,
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/reports');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });
    });
});