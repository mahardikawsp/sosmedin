import { NextRequest } from 'next/server';
import { POST, DELETE } from '../route';

// Mock the dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/prisma');

import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const mockGetCurrentUserId = jest.mocked(getCurrentUserId);
const mockPrisma = jest.mocked(prisma, true);

describe('/api/posts/[id]/like', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/posts/[id]/like', () => {
        it('should like a post successfully', async () => {
            const userId = 'user-123';
            const postId = 'post-123';
            const post = {
                id: postId,
                userId: 'other-user',
                user: {
                    username: 'otheruser',
                    displayName: 'Other User',
                },
            };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(post as any);
            mockPrisma.like.findUnique.mockResolvedValue(null);
            mockPrisma.like.create.mockResolvedValue({} as any);
            mockPrisma.notification.create.mockResolvedValue({} as any);

            const request = new NextRequest(`http://localhost/api/posts/${postId}/like`, {
                method: 'POST',
            });

            const response = await POST(request, { params: { id: postId } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Post liked successfully');
            expect(mockPrisma.like.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    postId,
                },
            });
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'other-user',
                    type: 'like',
                    referenceId: postId,
                },
            });
        });

        it('should not create notification when liking own post', async () => {
            const userId = 'user-123';
            const postId = 'post-123';
            const post = {
                id: postId,
                userId: userId, // Same user
                user: {
                    username: 'testuser',
                    displayName: 'Test User',
                },
            };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(post as any);
            mockPrisma.like.findUnique.mockResolvedValue(null);
            mockPrisma.like.create.mockResolvedValue({} as any);

            const request = new NextRequest(`http://localhost/api/posts/${postId}/like`, {
                method: 'POST',
            });

            const response = await POST(request, { params: { id: postId } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Post liked successfully');
            expect(mockPrisma.like.create).toHaveBeenCalled();
            expect(mockPrisma.notification.create).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts/post-123/like', {
                method: 'POST',
            });

            const response = await POST(request, { params: { id: 'post-123' } });
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return 404 if post does not exist', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.post.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts/nonexistent/like', {
                method: 'POST',
            });

            const response = await POST(request, { params: { id: 'nonexistent' } });
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('Post not found');
        });

        it('should return 400 if post is already liked', async () => {
            const userId = 'user-123';
            const postId = 'post-123';
            const post = { id: postId, userId: 'other-user' };
            const existingLike = { id: 'like-123' };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(post as any);
            mockPrisma.like.findUnique.mockResolvedValue(existingLike as any);

            const request = new NextRequest(`http://localhost/api/posts/${postId}/like`, {
                method: 'POST',
            });

            const response = await POST(request, { params: { id: postId } });
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toBe('Post already liked');
        });
    });

    describe('DELETE /api/posts/[id]/like', () => {
        it('should unlike a post successfully', async () => {
            const userId = 'user-123';
            const postId = 'post-123';
            const existingLike = { id: 'like-123' };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.like.findUnique.mockResolvedValue(existingLike as any);
            mockPrisma.like.delete.mockResolvedValue({} as any);

            const request = new NextRequest(`http://localhost/api/posts/${postId}/like`, {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { id: postId } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Post unliked successfully');
            expect(mockPrisma.like.delete).toHaveBeenCalledWith({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts/post-123/like', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { id: 'post-123' } });
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return 404 if like does not exist', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.like.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts/post-123/like', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { id: 'post-123' } });
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('Like not found');
        });
    });
});