import { followUser, unfollowUser, isFollowing } from '../follow-utils';
import { prisma } from '../prisma';

// Mock the prisma client
jest.mock('../prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
        },
        follow: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        notification: {
            create: jest.fn(),
        },
    },
}));

describe('Follow Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('followUser', () => {
        it('should follow a user successfully', async () => {
            const followerId = 'follower-id';
            const followingId = 'following-id';

            const mockUsers = [
                { id: followerId, username: 'follower' },
                { id: followingId, username: 'following' },
            ];

            const mockFollow = {
                id: 'follow-id',
                followerId,
                followingId,
                createdAt: new Date(),
            };

            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            (prisma.follow.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.follow.create as jest.Mock).mockResolvedValue(mockFollow);
            (prisma.notification.create as jest.Mock).mockResolvedValue({});

            const result = await followUser(followerId, followingId);
            expect(result).toEqual(mockFollow);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    id: {
                        in: [followerId, followingId],
                    },
                },
            });
            expect(prisma.follow.findUnique).toHaveBeenCalledWith({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId,
                    },
                },
            });
            expect(prisma.follow.create).toHaveBeenCalledWith({
                data: {
                    followerId,
                    followingId,
                },
            });
            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    type: 'follow',
                    referenceId: followerId,
                    userId: followingId,
                },
            });
        });

        it('should throw an error if trying to follow self', async () => {
            const userId = 'user-id';

            await expect(followUser(userId, userId)).rejects.toThrow('You cannot follow yourself');
            expect(prisma.user.findMany).not.toHaveBeenCalled();
            expect(prisma.follow.create).not.toHaveBeenCalled();
            expect(prisma.notification.create).not.toHaveBeenCalled();
        });

        it('should throw an error if one or both users do not exist', async () => {
            const followerId = 'follower-id';
            const followingId = 'non-existent-id';

            // Only one user found
            const mockUsers = [{ id: followerId, username: 'follower' }];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

            await expect(followUser(followerId, followingId)).rejects.toThrow('One or both users not found');
            expect(prisma.follow.create).not.toHaveBeenCalled();
            expect(prisma.notification.create).not.toHaveBeenCalled();
        });

        it('should throw an error if already following', async () => {
            const followerId = 'follower-id';
            const followingId = 'following-id';

            const mockUsers = [
                { id: followerId, username: 'follower' },
                { id: followingId, username: 'following' },
            ];

            const mockExistingFollow = {
                id: 'follow-id',
                followerId,
                followingId,
                createdAt: new Date(),
            };

            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            (prisma.follow.findUnique as jest.Mock).mockResolvedValue(mockExistingFollow);

            await expect(followUser(followerId, followingId)).rejects.toThrow(
                'You are already following this user'
            );
            expect(prisma.follow.create).not.toHaveBeenCalled();
            expect(prisma.notification.create).not.toHaveBeenCalled();
        });
    });

    describe('unfollowUser', () => {
        it('should unfollow a user successfully', async () => {
            const followerId = 'follower-id';
            const followingId = 'following-id';

            const mockFollow = {
                id: 'follow-id',
                followerId,
                followingId,
                createdAt: new Date(),
            };

            (prisma.follow.findUnique as jest.Mock).mockResolvedValue(mockFollow);
            (prisma.follow.delete as jest.Mock).mockResolvedValue(mockFollow);

            const result = await unfollowUser(followerId, followingId);
            expect(result).toEqual(mockFollow);
            expect(prisma.follow.findUnique).toHaveBeenCalledWith({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId,
                    },
                },
            });
            expect(prisma.follow.delete).toHaveBeenCalledWith({
                where: {
                    id: mockFollow.id,
                },
            });
        });

        it('should throw an error if not following', async () => {
            const followerId = 'follower-id';
            const followingId = 'following-id';

            (prisma.follow.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(unfollowUser(followerId, followingId)).rejects.toThrow(
                'You are not following this user'
            );
            expect(prisma.follow.delete).not.toHaveBeenCalled();
        });
    });

    describe('isFollowing', () => {
        it('should return true if following', async () => {
            const followerId = 'follower-id';
            const followingId = 'following-id';

            const mockFollow = {
                id: 'follow-id',
                followerId,
                followingId,
                createdAt: new Date(),
            };

            (prisma.follow.findUnique as jest.Mock).mockResolvedValue(mockFollow);

            const result = await isFollowing(followerId, followingId);
            expect(result).toBe(true);
            expect(prisma.follow.findUnique).toHaveBeenCalledWith({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId,
                    },
                },
            });
        });

        it('should return false if not following', async () => {
            const followerId = 'follower-id';
            const followingId = 'following-id';

            (prisma.follow.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await isFollowing(followerId, followingId);
            expect(result).toBe(false);
            expect(prisma.follow.findUnique).toHaveBeenCalledWith({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId,
                    },
                },
            });
        });
    });
});