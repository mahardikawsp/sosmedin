import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
        },
        post: {
            findMany: jest.fn(),
        },
    },
}));

const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/search', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return error for empty query', async () => {
            const request = new NextRequest('http://localhost:3000/api/search?q=');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Search query is required');
        });

        it('should return error for query less than 2 characters', async () => {
            const request = new NextRequest('http://localhost:3000/api/search?q=a');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Search query must be at least 2 characters');
        });

        it('should search both users and posts by default', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'user1',
                    username: 'testuser',
                    displayName: 'Test User',
                    bio: 'A test user',
                    profileImageUrl: null,
                    _count: {
                        posts: 10,
                        followedBy: 5,
                        following: 3,
                    },
                    followedBy: [],
                },
            ]);

            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: 'post1',
                    content: 'This is a test post',
                    userId: 'user1',
                    parentId: null,
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        username: 'testuser',
                        displayName: 'Test User',
                        profileImageUrl: null,
                    },
                    _count: {
                        likes: 2,
                        replies: 1,
                    },
                    likes: [],
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/search?q=test');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.users).toHaveLength(1);
            expect(data.posts).toHaveLength(1);
            expect(data.query).toBe('test');
            expect(data.type).toBe('all');
            expect(data.users[0].isFollowing).toBe(false);
            expect(data.posts[0].isLiked).toBe(false);
        });

        it('should search only users when type=users', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'user1',
                    username: 'testuser',
                    displayName: 'Test User',
                    bio: 'A test user',
                    profileImageUrl: null,
                    _count: {
                        posts: 10,
                        followedBy: 5,
                        following: 3,
                    },
                    followedBy: [{ id: 'follow1' }],
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/search?q=test&type=users');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.users).toHaveLength(1);
            expect(data.posts).toBeUndefined();
            expect(data.users[0].isFollowing).toBe(true);
            expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
        });

        it('should search only posts when type=posts', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: 'post1',
                    content: 'This is a test post',
                    userId: 'user1',
                    parentId: null,
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        username: 'testuser',
                        displayName: 'Test User',
                        profileImageUrl: null,
                    },
                    _count: {
                        likes: 2,
                        replies: 1,
                    },
                    likes: [{ id: 'like1' }],
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/search?q=test&type=posts&limit=20');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.posts).toHaveLength(1);
            expect(data.users).toBeUndefined();
            expect(data.posts[0].isLiked).toBe(true);
            expect(data.hasMore).toBe(false);
            expect(data.nextCursor).toBeNull();
            expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
        });

        it('should handle pagination for posts search', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            // Mock 20 posts to trigger hasMore
            const mockPosts = Array.from({ length: 20 }, (_, i) => ({
                id: `post${i + 1}`,
                content: `Test post ${i + 1}`,
                userId: 'user1',
                parentId: null,
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 'user1',
                    username: 'testuser',
                    displayName: 'Test User',
                    profileImageUrl: null,
                },
                _count: {
                    likes: 1,
                    replies: 0,
                },
                likes: [],
            }));

            mockPrisma.post.findMany.mockResolvedValue(mockPosts);

            const request = new NextRequest('http://localhost:3000/api/search?q=test&type=posts&limit=20');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.hasMore).toBe(true);
            expect(data.nextCursor).toBe('post20');
        });

        it('should work for unauthenticated users', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'user1',
                    username: 'testuser',
                    displayName: 'Test User',
                    bio: 'A test user',
                    profileImageUrl: null,
                    _count: {
                        posts: 10,
                        followedBy: 5,
                        following: 3,
                    },
                    followedBy: false,
                },
            ]);

            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: 'post1',
                    content: 'This is a test post',
                    userId: 'user1',
                    parentId: null,
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        username: 'testuser',
                        displayName: 'Test User',
                        profileImageUrl: null,
                    },
                    _count: {
                        likes: 2,
                        replies: 1,
                    },
                    likes: false,
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/search?q=test');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.users[0].isFollowing).toBe(false);
            expect(data.posts[0].isLiked).toBe(false);
        });

        it('should handle database errors gracefully', async () => {
            mockGetCurrentUserId.mockResolvedValue('user1');
            mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

            const request = new NextRequest('http://localhost:3000/api/search?q=test');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to perform search');
        });
    });
});