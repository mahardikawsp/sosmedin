import { likePost, unlikePost, hasUserLikedPost } from '../like-utils';
import { prisma } from '../prisma';

// Mock the prisma client
jest.mock('../prisma', () => ({
    prisma: {
        post: {
            findUnique: jest.fn(),
        },
        like: {
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

describe('Like Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('likePost', () => {
        it('should like a post successfully', async () => {
            const userId = 'user-id';
            const postId = 'post-id';
            const postOwnerId = 'post-owner-id';

            const mockPost = {
                id: postId,
                content: 'Post content',
                userId: postOwnerId,
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            const mockLike = {
                id: 'like-id',
                userId,
                postId,
                createdAt: new Date(),
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
            (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.like.create as jest.Mock).mockResolvedValue(mockLike);
            (prisma.notification.create as jest.Mock).mockResolvedValue({});

            const result = await likePost(userId, postId);
            expect(result).toEqual(mockLike);
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postId },
            });
            expect(prisma.like.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            expect(prisma.like.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    postId,
                },
            });
            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    type: 'like',
                    referenceId: postId,
                    userId: postOwnerId,
                },
            });
        });

        it('should not create notification when liking own post', async () => {
            const userId = 'user-id';
            const postId = 'post-id';

            const mockPost = {
                id: postId,
                content: 'Post content',
                userId, // Same as the user liking the post
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            const mockLike = {
                id: 'like-id',
                userId,
                postId,
                createdAt: new Date(),
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
            (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.like.create as jest.Mock).mockResolvedValue(mockLike);

            const result = await likePost(userId, postId);
            expect(result).toEqual(mockLike);
            expect(prisma.notification.create).not.toHaveBeenCalled();
        });

        it('should throw an error if post does not exist', async () => {
            const userId = 'user-id';
            const postId = 'non-existent-post-id';

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(likePost(userId, postId)).rejects.toThrow('Post not found');
            expect(prisma.like.create).not.toHaveBeenCalled();
            expect(prisma.notification.create).not.toHaveBeenCalled();
        });

        it('should throw an error if user has already liked the post', async () => {
            const userId = 'user-id';
            const postId = 'post-id';

            const mockPost = {
                id: postId,
                content: 'Post content',
                userId: 'post-owner-id',
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            const mockExistingLike = {
                id: 'like-id',
                userId,
                postId,
                createdAt: new Date(),
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
            (prisma.like.findUnique as jest.Mock).mockResolvedValue(mockExistingLike);

            await expect(likePost(userId, postId)).rejects.toThrow('You have already liked this post');
            expect(prisma.like.create).not.toHaveBeenCalled();
            expect(prisma.notification.create).not.toHaveBeenCalled();
        });
    });

    describe('unlikePost', () => {
        it('should unlike a post successfully', async () => {
            const userId = 'user-id';
            const postId = 'post-id';

            const mockLike = {
                id: 'like-id',
                userId,
                postId,
                createdAt: new Date(),
            };

            (prisma.like.findUnique as jest.Mock).mockResolvedValue(mockLike);
            (prisma.like.delete as jest.Mock).mockResolvedValue(mockLike);

            const result = await unlikePost(userId, postId);
            expect(result).toEqual(mockLike);
            expect(prisma.like.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            expect(prisma.like.delete).toHaveBeenCalledWith({
                where: {
                    id: mockLike.id,
                },
            });
        });

        it('should throw an error if like does not exist', async () => {
            const userId = 'user-id';
            const postId = 'post-id';

            (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(unlikePost(userId, postId)).rejects.toThrow('You have not liked this post');
            expect(prisma.like.delete).not.toHaveBeenCalled();
        });
    });

    describe('hasUserLikedPost', () => {
        it('should return true if user has liked the post', async () => {
            const userId = 'user-id';
            const postId = 'post-id';

            const mockLike = {
                id: 'like-id',
                userId,
                postId,
                createdAt: new Date(),
            };

            (prisma.like.findUnique as jest.Mock).mockResolvedValue(mockLike);

            const result = await hasUserLikedPost(userId, postId);
            expect(result).toBe(true);
            expect(prisma.like.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
        });

        it('should return false if user has not liked the post', async () => {
            const userId = 'user-id';
            const postId = 'post-id';

            (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await hasUserLikedPost(userId, postId);
            expect(result).toBe(false);
            expect(prisma.like.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
        });
    });
});