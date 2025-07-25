import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        post: {
            findMany: jest.fn(),
        },
        follow: {
            findMany: jest.fn(),
        },
        user: {
            findMany: jest.fn(),
        },
    },
}));

const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/feed', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return explore feed for unauthenticated users', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);
            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: '1',
                    content: 'Test post',
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
                        likes: 5,
                        replies: 2,
                    },
                    likes: [],
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/feed');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.posts).toHaveLength(1);
            expect(data.type).toBe('personalized');
            expect(data.posts[0].isLiked).toBe(false);
        });

        it('should return personalized feed for authenticated users', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            mockPrisma.follow.findMany.mockResolvedValue([
                { followingId: 'user1' },
                { followingId: 'user2' },
            ]);

            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: '1',
                    content: 'Test post from followed user',
                    userId: 'user1',
                    parentId: null,
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        username: 'followeduser',
                        displayName: 'Followed User',
                        profileImageUrl: null,
                    },
                    _count: {
                        likes: 3,
                        replies: 1,
                    },
                    likes: [{ id: 'like1' }],
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/feed');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.posts).toHaveLength(1);
            expect(data.posts[0].isLiked).toBe(true);
            expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
                where: { followerId: userId },
                select: { followingId: true },
            });
        });

        it('should return explore feed with suggested users', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: '1',
                    content: 'Explore post',
                    userId: 'user1',
                    parentId: null,
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        username: 'exploreuser',
                        displayName: 'Explore User',
                        profileImageUrl: null,
                    },
                    _count: {
                        likes: 10,
                        replies: 5,
                    },
                    likes: [],
                },
            ]);

            mockPrisma.follow.findMany.mockResolvedValue([
                { followingId: 'user2' },
            ]);

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'user3',
                    username: 'suggested',
                    displayName: 'Suggested User',
                    bio: 'A suggested user',
                    profileImageUrl: null,
                    _count: {
                        posts: 15,
                        followedBy: 100,
                        following: 50,
                    },
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/feed?type=explore');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.posts).toHaveLength(1);
            expect(data.suggestedUsers).toHaveLength(1);
            expect(data.type).toBe('explore');
        });

        it('should return trending posts', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: '1',
                    content: 'Trending post',
                    userId: 'user1',
                    parentId: null,
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        username: 'trendinguser',
                        displayName: 'Trending User',
                        profileImageUrl: null,
                    },
                    _count: {
                        likes: 50,
                        replies: 20,
                    },
                    likes: [],
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/feed?type=trending');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.posts).toHaveLength(1);
            expect(data.type).toBe('trending');
            expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: {
                            gte: expect.any(Date),
                        },
                    }),
                })
            );
        });

        it('should handle pagination with cursor', async () => {
            const userId = 'current-user';
            mockGetCurrentUserId.mockResolvedValue(userId);

            mockPrisma.follow.findMany.mockResolvedValue([
                { followingId: 'user1' },
            ]);

            mockPrisma.post.findMany.mockResolvedValue([
                {
                    id: '2',
                    content: 'Second page post',
                    userId: 'user1',
                    parentId: null,
                    isEdited: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        username: 'user1',
                        displayName: 'User 1',
                        profileImageUrl: null,
                    },
                    _count: {
                        likes: 1,
                        replies: 0,
                    },
                    likes: [],
                },
            ]);

            const request = new NextRequest('http://localhost:3000/api/feed?cursor=1&limit=1');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.hasMore).toBe(true);
            expect(data.nextCursor).toBe('2');
            expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 1,
                    cursor: { id: '1' },
                    take: 1,
                })
            );
        });

        it('should handle errors gracefully', async () => {
            mockGetCurrentUserId.mockRejectedValue(new Error('Database error'));

            const request = new NextRequest('http://localhost:3000/api/feed');
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to fetch feed');
        });
    });
});