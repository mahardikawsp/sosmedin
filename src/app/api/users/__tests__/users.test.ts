import { NextRequest } from 'next/server';
import { GET } from '../route';
import { GET as getUserProfile, PUT as updateUserProfile } from '../[username]/route';
import { GET as getUserPosts } from '../[username]/posts/route';
import { POST as uploadProfileImage } from '../[username]/profile-image/route';

// Mock dependencies
jest.mock('@/lib/session', () => ({
    getCurrentUserId: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
        follow: {
            findUnique: jest.fn(),
        },
        post: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;

describe('/api/users', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/users', () => {
        it('should return users list with pagination', async () => {
            mockGetCurrentUserId.mockResolvedValue('current-user-id');

            const mockUsers = [
                {
                    id: 'user-1',
                    username: 'user1',
                    displayName: 'User One',
                    bio: 'Bio 1',
                    profileImageUrl: null,
                    createdAt: new Date(),
                    _count: {
                        posts: 5,
                        followedBy: 10,
                        following: 8,
                    },
                },
            ];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            (prisma.user.count as jest.Mock).mockResolvedValue(1);

            const request = new NextRequest('http://localhost:3000/api/users?page=1&limit=10');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.users).toEqual(mockUsers);
            expect(data.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                pages: 1,
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/users');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should handle search queries', async () => {
            mockGetCurrentUserId.mockResolvedValue('current-user-id');

            const request = new NextRequest('http://localhost:3000/api/users?search=john');
            await GET(request);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { username: { contains: 'john', mode: 'insensitive' } },
                            { displayName: { contains: 'john', mode: 'insensitive' } },
                        ],
                    },
                })
            );
        });
    });

    describe('GET /api/users/[username]', () => {
        it('should return user profile', async () => {
            mockGetCurrentUserId.mockResolvedValue('current-user-id');

            const mockUser = {
                id: 'user-1',
                username: 'testuser',
                displayName: 'Test User',
                bio: 'Test bio',
                profileImageUrl: null,
                createdAt: new Date(),
                _count: {
                    posts: 5,
                    followedBy: 10,
                    following: 8,
                },
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.follow.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await getUserProfile(
                new NextRequest('http://localhost:3000/api/users/testuser'),
                { params: { username: 'testuser' } }
            );
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.username).toBe('testuser');
            expect(data.isFollowing).toBe(false);
            expect(data.isCurrentUser).toBe(false);
        });

        it('should return 404 if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await getUserProfile(
                new NextRequest('http://localhost:3000/api/users/nonexistent'),
                { params: { username: 'nonexistent' } }
            );
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('User not found');
        });
    });

    describe('PUT /api/users/[username]', () => {
        it('should update user profile', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');

            const mockUser = { id: 'user-1' };
            const updatedUser = {
                id: 'user-1',
                username: 'testuser',
                displayName: 'Updated Name',
                bio: 'Updated bio',
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

            const request = new NextRequest('http://localhost:3000/api/users/testuser', {
                method: 'PUT',
                body: JSON.stringify({
                    displayName: 'Updated Name',
                    bio: 'Updated bio',
                }),
            });

            const response = await updateUserProfile(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.displayName).toBe('Updated Name');
            expect(data.bio).toBe('Updated bio');
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/users/testuser', {
                method: 'PUT',
                body: JSON.stringify({ displayName: 'New Name' }),
            });

            const response = await updateUserProfile(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should return 403 if user tries to update another user profile', async () => {
            mockGetCurrentUserId.mockResolvedValue('different-user-id');

            const mockUser = { id: 'user-1' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost:3000/api/users/testuser', {
                method: 'PUT',
                body: JSON.stringify({ displayName: 'New Name' }),
            });

            const response = await updateUserProfile(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe('Forbidden');
        });

        it('should validate display name length', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');

            const mockUser = { id: 'user-1' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost:3000/api/users/testuser', {
                method: 'PUT',
                body: JSON.stringify({
                    displayName: 'a'.repeat(51), // Exceeds 50 character limit
                }),
            });

            const response = await updateUserProfile(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Display name cannot exceed 50 characters');
        });

        it('should validate bio length', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');

            const mockUser = { id: 'user-1' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost:3000/api/users/testuser', {
                method: 'PUT',
                body: JSON.stringify({
                    bio: 'a'.repeat(161), // Exceeds 160 character limit
                }),
            });

            const response = await updateUserProfile(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Bio cannot exceed 160 characters');
        });
    });

    describe('GET /api/users/[username]/posts', () => {
        it('should return user posts with pagination', async () => {
            mockGetCurrentUserId.mockResolvedValue('current-user-id');

            const mockUser = { id: 'user-1' };
            const mockPosts = [
                {
                    id: 'post-1',
                    content: 'Test post',
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: 'user-1',
                    parentId: null,
                    user: {
                        id: 'user-1',
                        username: 'testuser',
                        displayName: 'Test User',
                        profileImageUrl: null,
                    },
                    likes: [],
                    _count: {
                        likes: 5,
                        replies: 2,
                    },
                },
            ];

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
            (prisma.post.count as jest.Mock).mockResolvedValue(1);

            const response = await getUserPosts(
                new NextRequest('http://localhost:3000/api/users/testuser/posts'),
                { params: { username: 'testuser' } }
            );
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.posts).toHaveLength(1);
            expect(data.posts[0].isLiked).toBe(false);
            expect(data.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                pages: 1,
            });
        });

        it('should return 404 if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await getUserPosts(
                new NextRequest('http://localhost:3000/api/users/nonexistent/posts'),
                { params: { username: 'nonexistent' } }
            );
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('User not found');
        });
    });
});