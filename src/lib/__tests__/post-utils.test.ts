import { validatePostContent, createPost, updatePost, deletePost } from '../post-utils';
import { prisma } from '../prisma';

// Mock the prisma client
jest.mock('../prisma', () => ({
    prisma: {
        post: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));

describe('Post Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validatePostContent', () => {
        it('should validate valid content', () => {
            const content = 'This is a valid post content';
            expect(() => validatePostContent(content)).not.toThrow();
        });

        it('should reject empty content', () => {
            const content = '';
            expect(() => validatePostContent(content)).toThrow('Post content cannot be empty');
        });

        it('should reject content exceeding maximum length', () => {
            // Create a string longer than MAX_POST_LENGTH (500)
            const content = 'a'.repeat(501);
            expect(() => validatePostContent(content)).toThrow('Post content cannot exceed 500 characters');
        });
    });

    describe('createPost', () => {
        it('should create a post successfully', async () => {
            const postData = {
                content: 'Test post content',
                userId: 'user-id',
            };

            const mockPost = {
                id: 'post-id',
                ...postData,
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

            const result = await createPost(postData);
            expect(result).toEqual(mockPost);
            expect(prisma.post.create).toHaveBeenCalledWith({
                data: {
                    content: postData.content,
                    userId: postData.userId,
                    parentId: undefined,
                },
            });
        });

        it('should create a reply post successfully', async () => {
            const postData = {
                content: 'Test reply content',
                userId: 'user-id',
                parentId: 'parent-post-id',
            };

            const mockParentPost = {
                id: 'parent-post-id',
                content: 'Parent post content',
                userId: 'another-user-id',
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            const mockPost = {
                id: 'post-id',
                content: postData.content,
                userId: postData.userId,
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: postData.parentId,
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockParentPost);
            (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

            const result = await createPost(postData);
            expect(result).toEqual(mockPost);
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postData.parentId },
            });
            expect(prisma.post.create).toHaveBeenCalledWith({
                data: {
                    content: postData.content,
                    userId: postData.userId,
                    parentId: postData.parentId,
                },
            });
        });

        it('should throw an error if parent post does not exist', async () => {
            const postData = {
                content: 'Test reply content',
                userId: 'user-id',
                parentId: 'non-existent-post-id',
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(createPost(postData)).rejects.toThrow('Parent post not found');
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postData.parentId },
            });
            expect(prisma.post.create).not.toHaveBeenCalled();
        });
    });

    describe('updatePost', () => {
        it('should update a post successfully', async () => {
            const postId = 'post-id';
            const content = 'Updated content';
            const userId = 'user-id';

            const mockPost = {
                id: postId,
                content: 'Original content',
                userId,
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            const mockUpdatedPost = {
                ...mockPost,
                content,
                isEdited: true,
                updatedAt: new Date(),
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
            (prisma.post.update as jest.Mock).mockResolvedValue(mockUpdatedPost);

            const result = await updatePost(postId, content, userId);
            expect(result).toEqual(mockUpdatedPost);
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postId },
            });
            expect(prisma.post.update).toHaveBeenCalledWith({
                where: { id: postId },
                data: {
                    content,
                    isEdited: true,
                },
            });
        });

        it('should throw an error if post does not exist', async () => {
            const postId = 'non-existent-post-id';
            const content = 'Updated content';
            const userId = 'user-id';

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(updatePost(postId, content, userId)).rejects.toThrow('Post not found');
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postId },
            });
            expect(prisma.post.update).not.toHaveBeenCalled();
        });

        it('should throw an error if user is not the author', async () => {
            const postId = 'post-id';
            const content = 'Updated content';
            const userId = 'user-id';
            const authorId = 'different-user-id';

            const mockPost = {
                id: postId,
                content: 'Original content',
                userId: authorId, // Different from the userId parameter
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

            await expect(updatePost(postId, content, userId)).rejects.toThrow(
                'Unauthorized: You can only edit your own posts'
            );
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postId },
            });
            expect(prisma.post.update).not.toHaveBeenCalled();
        });
    });

    describe('deletePost', () => {
        it('should delete a post successfully', async () => {
            const postId = 'post-id';
            const userId = 'user-id';

            const mockPost = {
                id: postId,
                content: 'Post content',
                userId,
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
            (prisma.post.delete as jest.Mock).mockResolvedValue(mockPost);

            const result = await deletePost(postId, userId);
            expect(result).toEqual(mockPost);
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postId },
            });
            expect(prisma.post.delete).toHaveBeenCalledWith({
                where: { id: postId },
            });
        });

        it('should throw an error if post does not exist', async () => {
            const postId = 'non-existent-post-id';
            const userId = 'user-id';

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(deletePost(postId, userId)).rejects.toThrow('Post not found');
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postId },
            });
            expect(prisma.post.delete).not.toHaveBeenCalled();
        });

        it('should throw an error if user is not the author', async () => {
            const postId = 'post-id';
            const userId = 'user-id';
            const authorId = 'different-user-id';

            const mockPost = {
                id: postId,
                content: 'Post content',
                userId: authorId, // Different from the userId parameter
                isEdited: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                parentId: null,
            };

            (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

            await expect(deletePost(postId, userId)).rejects.toThrow(
                'Unauthorized: You can only delete your own posts'
            );
            expect(prisma.post.findUnique).toHaveBeenCalledWith({
                where: { id: postId },
            });
            expect(prisma.post.delete).not.toHaveBeenCalled();
        });
    });
});