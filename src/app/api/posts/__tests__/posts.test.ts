import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { GET as getPost, PUT as updatePost, DELETE as deletePost } from '../[id]/route';

// Mock the dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/prisma');

import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const mockGetCurrentUserId = jest.mocked(getCurrentUserId);
const mockPrisma = jest.mocked(prisma, true);

describe('/api/posts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/posts', () => {
        it('should create a new post successfully', async () => {
            const userId = 'user-123';
            const postData = {
                id: 'post-123',
                content: 'Test post content',
                userId,
                parentId: null,
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: userId,
                    username: 'testuser',
                    displayName: 'Test User',
                    profileImageUrl: null,
                },
                parent: null,
                _count: {
                    likes: 0,
                    replies: 0,
                },
            };

            mockGetCurrentUserId.mockResolvedValue(userId);
            (mockPrisma.post.create as jest.Mock).mockResolvedValue(postData);

            const request = new NextRequest('http://localhost/api/posts', {
                method: 'POST',
                body: JSON.stringify({ content: 'Test post content' }),
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(201);
            expect(result.content).toBe('Test post content');
            expect(result.userId).toBe(userId);
            expect(mockPrisma.post.create).toHaveBeenCalledWith({
                data: {
                    content: 'Test post content',
                    userId,
                    parentId: null,
                },
                include: expect.any(Object),
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts', {
                method: 'POST',
                body: JSON.stringify({ content: 'Test post content' }),
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return 400 if content is empty', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');

            const request = new NextRequest('http://localhost/api/posts', {
                method: 'POST',
                body: JSON.stringify({ content: '' }),
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toBe('Content cannot be empty');
        });

        it('should return 400 if content exceeds 500 characters', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');

            const longContent = 'a'.repeat(501);
            const request = new NextRequest('http://localhost/api/posts', {
                method: 'POST',
                body: JSON.stringify({ content: longContent }),
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toBe('Content cannot exceed 500 characters');
        });

        it('should create a reply when parentId is provided', async () => {
            const userId = 'user-123';
            const parentId = 'parent-post-123';

            mockGetCurrentUserId.mockResolvedValue(userId);
            (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({ id: parentId });
            (mockPrisma.post.create as jest.Mock).mockResolvedValue({
                id: 'reply-123',
                content: 'Reply content',
                userId,
                parentId,
                user: { id: userId, username: 'testuser', displayName: 'Test User', profileImageUrl: null },
                parent: { id: parentId, content: 'Parent content', user: { username: 'parentuser', displayName: 'Parent User' } },
                _count: { likes: 0, replies: 0 },
            });

            const request = new NextRequest('http://localhost/api/posts', {
                method: 'POST',
                body: JSON.stringify({ content: 'Reply content', parentId }),
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(201);
            expect(result.parentId).toBe(parentId);
            expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: parentId },
            });
        });

        it('should return 404 if parent post does not exist', async () => {
            const userId = 'user-123';
            const parentId = 'nonexistent-post';

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/posts', {
                method: 'POST',
                body: JSON.stringify({ content: 'Reply content', parentId }),
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('Parent post not found');
        });
    });

    describe('GET /api/posts', () => {
        it('should return explore feed when type is explore', async () => {
            const posts = [
                {
                    id: 'post-1',
                    content: 'Post 1',
                    user: { id: 'user-1', username: 'user1', displayName: 'User 1', profileImageUrl: null },
                    _count: { likes: 5, replies: 2 },
                    likes: [],
                },
            ];

            mockGetCurrentUserId.mockResolvedValue('current-user');
            mockPrisma.post.findMany.mockResolvedValue(posts as any);

            const request = new NextRequest('http://localhost/api/posts?type=explore');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.posts).toHaveLength(1);
            expect(result.posts[0].isLiked).toBe(false);
            expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
                where: { parentId: null },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
        });

        it('should return personalized feed for authenticated user', async () => {
            const userId = 'current-user';
            const followingUsers = [{ followingId: 'user-1' }, { followingId: 'user-2' }];
            const posts = [
                {
                    id: 'post-1',
                    content: 'Post 1',
                    user: { id: 'user-1', username: 'user1', displayName: 'User 1', profileImageUrl: null },
                    _count: { likes: 5, replies: 2 },
                    likes: [{ id: 'like-1' }],
                },
            ];

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.follow.findMany.mockResolvedValue(followingUsers as any);
            mockPrisma.post.findMany.mockResolvedValue(posts as any);

            const request = new NextRequest('http://localhost/api/posts?type=feed');
            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.posts).toHaveLength(1);
            expect(result.posts[0].isLiked).toBe(true);
            expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
                where: { followerId: userId },
                select: { followingId: true },
            });
        });
    });

    describe('GET /api/posts/[id]', () => {
        it('should return a specific post with replies', async () => {
            const postId = 'post-123';
            const userId = 'user-123';
            const post = {
                id: postId,
                content: 'Test post',
                user: { id: userId, username: 'testuser', displayName: 'Test User', profileImageUrl: null },
                parent: null,
                replies: [
                    {
                        id: 'reply-1',
                        content: 'Reply 1',
                        user: { id: 'user-2', username: 'user2', displayName: 'User 2', profileImageUrl: null },
                        _count: { likes: 1, replies: 0 },
                        likes: [],
                    },
                ],
                _count: { likes: 3, replies: 1 },
                likes: [{ id: 'like-1' }],
            };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(post as any);

            const response = await getPost(
                new NextRequest('http://localhost/api/posts/post-123'),
                { params: { id: postId } }
            );
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.id).toBe(postId);
            expect(result.isLiked).toBe(true);
            expect(result.replies[0].isLiked).toBe(false);
        });

        it('should return 404 if post does not exist', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.post.findUnique.mockResolvedValue(null);

            const response = await getPost(
                new NextRequest('http://localhost/api/posts/nonexistent'),
                { params: { id: 'nonexistent' } }
            );
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('Post not found');
        });
    });

    describe('PUT /api/posts/[id]', () => {
        it('should update a post successfully', async () => {
            const postId = 'post-123';
            const userId = 'user-123';
            const existingPost = { userId, content: 'Old content' };
            const updatedPost = {
                id: postId,
                content: 'Updated content',
                isEdited: true,
                user: { id: userId, username: 'testuser', displayName: 'Test User', profileImageUrl: null },
                parent: null,
                _count: { likes: 0, replies: 0 },
                likes: [],
            };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(existingPost as any);
            mockPrisma.post.update.mockResolvedValue(updatedPost as any);

            const request = new NextRequest(`http://localhost/api/posts/${postId}`, {
                method: 'PUT',
                body: JSON.stringify({ content: 'Updated content' }),
            });

            const response = await updatePost(request, { params: { id: postId } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.content).toBe('Updated content');
            expect(result.isEdited).toBe(true);
        });

        it('should return 403 if user does not own the post', async () => {
            const postId = 'post-123';
            const userId = 'user-123';
            const otherUserId = 'other-user';
            const existingPost = { userId: otherUserId, content: 'Old content' };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(existingPost as any);

            const request = new NextRequest(`http://localhost/api/posts/${postId}`, {
                method: 'PUT',
                body: JSON.stringify({ content: 'Updated content' }),
            });

            const response = await updatePost(request, { params: { id: postId } });
            const result = await response.json();

            expect(response.status).toBe(403);
            expect(result.error).toBe('You can only edit your own posts');
        });
    });

    describe('DELETE /api/posts/[id]', () => {
        it('should delete a post successfully', async () => {
            const postId = 'post-123';
            const userId = 'user-123';
            const existingPost = { userId };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(existingPost as any);
            mockPrisma.post.delete.mockResolvedValue({} as any);

            const response = await deletePost(
                new NextRequest(`http://localhost/api/posts/${postId}`, { method: 'DELETE' }),
                { params: { id: postId } }
            );
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Post deleted successfully');
            expect(mockPrisma.post.delete).toHaveBeenCalledWith({
                where: { id: postId },
            });
        });

        it('should return 403 if user does not own the post', async () => {
            const postId = 'post-123';
            const userId = 'user-123';
            const otherUserId = 'other-user';
            const existingPost = { userId: otherUserId };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.post.findUnique.mockResolvedValue(existingPost as any);

            const response = await deletePost(
                new NextRequest(`http://localhost/api/posts/${postId}`, { method: 'DELETE' }),
                { params: { id: postId } }
            );
            const result = await response.json();

            expect(response.status).toBe(403);
            expect(result.error).toBe('You can only delete your own posts');
        });
    });
});