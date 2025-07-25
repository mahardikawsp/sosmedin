import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock the dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/prisma');

import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const mockGetCurrentUserId = jest.mocked(getCurrentUserId);
const mockPrisma = jest.mocked(prisma, true);

describe('/api/posts/[id]/reply', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/posts/[id]/reply', () => {
        it('should create a reply successfully', async () => {
            const currentUserId = 'user-123';
            const parentId = 'parent-post-123';
            const parentPost = {
                id: parentId,
                userId: 'other-user',
                user: {
                    username: 'otheruser',
                    displayName: 'Other User',
                },
            };
            const reply = {
                id: 'reply-123',
                content: 'This is a reply',
                userId: currentUserId,
                parentId,
                user: {
                    id: currentUserId,
                    username: 'testuser',
                    displayName: 'Test User',
                    profileImageUrl: null,
                },
                parent: {
                    id: parentId,
                    content: 'Parent post content',
                    user: {
                        username: 'otheruser',
                        displayName: 'Other User',
                    },
                },
                _count: {
                    likes: 0,
                    replies: 0,
                },
            };

            mockGetCurrentUserId.mockResolvedValue(currentUserId);
            mockPrisma.post.findUnique.mockResolvedValue(parentPost as any);
            mockPrisma.post.create.mockResolvedValue(reply as any);
            mockPrisma.notification.create.mockResolvedValue({} as any);

            const request = new NextRequest(`http://localhost/api/posts/${parentId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ content: 'This is a reply' }),
            });

            const response = await POST(request, { params: { id: parentId } });
            const result = await response.json();

            expect(response.status).toBe(201);
            expect(result.content).toBe('This is a reply');
            expect(result.parentId).toBe(parentId);
            expect(mockPrisma.post.create).toHaveBeenCalledWith({
                data: {
                    content: 'This is a reply',
                    userId: currentUserId,
                    parentId,
                },
                include: expect.any(Object),
            });
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'other-user',
                    type: 'reply',
                    referenceId: 'reply-123',
                },
            });
        });

        it('should not create notification when replying to own post', async () => {
            const currentUserId = 'user-123';
            const parentId = 'parent-post-123';
            const parentPost = {
                id: parentId,
                userId: currentUserId, // Same user
                user: {
                    username: 'testuser',
                    displayName: 'Test User',
                },
            };
            const reply = {
                id: 'reply-123',
                content: 'This is a reply',
                userId: currentUserId,
                parentId,
                user: {
                    id: currentUserId,
                    username: 'testuser',
                    displayName: 'Test User',
                    profileImageUrl: null,
                },
                parent: {
                    id: parentId,
                    content: 'Parent post content',
                    user: {
                        username: 'testuser',
                        displayName: 'Test User',
                    },
                },
                _count: {
                    likes: 0,
                    replies: 0,
                },
            };

            mockGetCurrentUserId.mockResolvedValue(currentUserId);
            mockPrisma.post.findUnique.mockResolvedValue(parentPost as any);
            mockPrisma.post.create.mockResolvedValue(reply as any);

            const request = new NextRequest(`http://localhost/api/posts/${parentId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ content: 'This is a reply' }),
            });

            const response = await POST(request, { params: { id: parentId } });
            const result = await response.json();

            expect(response.status).toBe(201);
            expect(result.content).toBe('This is a reply');
            expect(mockPrisma.post.create).toHaveBeenCalled();
            expect(mockPrisma.notification.create).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts/post-123/reply', {
                method: 'POST',
                body: JSON.stringify({ content: 'This is a reply' }),
            });

            const response = await POST(request, { params: { id: 'post-123' } });
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return 404 if parent post does not exist', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.post.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts/nonexistent/reply', {
                method: 'POST',
                body: JSON.stringify({ content: 'This is a reply' }),
            });

            const response = await POST(request, { params: { id: 'nonexistent' } });
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('Parent post not found');
        });

        it('should return 400 if content is empty', async () => {
            const parentPost = { id: 'parent-123', userId: 'other-user' };

            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.post.findUnique.mockResolvedValue(parentPost as any);

            const request = new NextRequest('http://localhost/api/posts/parent-123/reply', {
                method: 'POST',
                body: JSON.stringify({ content: '' }),
            });

            const response = await POST(request, { params: { id: 'parent-123' } });
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toBe('Content cannot be empty');
        });
    });

    describe('GET /api/posts/[id]/reply', () => {
        it('should get replies for a post successfully', async () => {
            const parentId = 'parent-post-123';
            const currentUserId = 'user-123';
            const parentPost = { id: parentId };
            const replies = [
                {
                    id: 'reply-1',
                    content: 'First reply',
                    user: {
                        id: 'user-1',
                        username: 'user1',
                        displayName: 'User 1',
                        profileImageUrl: null,
                    },
                    _count: { likes: 2, replies: 0 },
                    likes: [{ id: 'like-1' }],
                },
                {
                    id: 'reply-2',
                    content: 'Second reply',
                    user: {
                        id: 'user-2',
                        username: 'user2',
                        displayName: 'User 2',
                        profileImageUrl: null,
                    },
                    _count: { likes: 0, replies: 1 },
                    likes: [],
                },
            ];

            mockGetCurrentUserId.mockResolvedValue(currentUserId);
            mockPrisma.post.findUnique.mockResolvedValue(parentPost as any);
            mockPrisma.post.findMany.mockResolvedValue(replies as any);

            const request = new NextRequest(`http://localhost/api/posts/${parentId}/reply`);

            const response = await GET(request, { params: { id: parentId } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.replies).toHaveLength(2);
            expect(result.replies[0].isLiked).toBe(true);
            expect(result.replies[1].isLiked).toBe(false);
            expect(result.hasMore).toBe(false);
            expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
                where: { parentId },
                include: expect.any(Object),
                orderBy: { createdAt: 'asc' },
                take: 20,
            });
        });

        it('should return 404 if parent post does not exist', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.post.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts/nonexistent/reply');

            const response = await GET(request, { params: { id: 'nonexistent' } });
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('Parent post not found');
        });

        it('should handle pagination correctly', async () => {
            const parentId = 'parent-post-123';
            const parentPost = { id: parentId };
            const replies = Array.from({ length: 20 }, (_, i) => ({
                id: `reply-${i}`,
                content: `Reply ${i}`,
                user: {
                    id: `user-${i}`,
                    username: `user${i}`,
                    displayName: `User ${i}`,
                    profileImageUrl: null,
                },
                _count: { likes: 0, replies: 0 },
                likes: [],
            }));

            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.post.findUnique.mockResolvedValue(parentPost as any);
            mockPrisma.post.findMany.mockResolvedValue(replies as any);

            const request = new NextRequest(`http://localhost/api/posts/${parentId}/reply?limit=20`);

            const response = await GET(request, { params: { id: parentId } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.replies).toHaveLength(20);
            expect(result.hasMore).toBe(true);
            expect(result.nextCursor).toBe('reply-19');
        });
    });
});