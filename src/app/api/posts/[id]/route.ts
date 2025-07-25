import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { validatePostContent } from '@/lib/content-moderation';

/**
 * GET /api/posts/[id]
 * Get a specific post with its replies
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUserId = await getCurrentUserId();
        const postId = params.id;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                username: true,
                                displayName: true,
                            },
                        },
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                profileImageUrl: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                replies: true,
                            },
                        },
                        likes: currentUserId ? {
                            where: { userId: currentUserId },
                            select: { id: true },
                        } : false,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
                likes: currentUserId ? {
                    where: { userId: currentUserId },
                    select: { id: true },
                } : false,
            },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // Transform the response to include isLiked flags
        const transformedPost = {
            ...post,
            isLiked: currentUserId ? post.likes.length > 0 : false,
            replies: post.replies.map(reply => ({
                ...reply,
                isLiked: currentUserId ? reply.likes.length > 0 : false,
                likes: undefined, // Remove the likes array from response
            })),
            likes: undefined, // Remove the likes array from response
        };

        return NextResponse.json(transformedPost);
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/posts/[id]
 * Update a specific post (only by the author)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const postId = params.id;
        const body = await request.json();
        const { content } = body;

        // Validate and moderate content
        const moderationResult = validatePostContent(content);
        if (!moderationResult.isValid) {
            return NextResponse.json(
                { error: moderationResult.errors[0] },
                { status: 400 }
            );
        }

        // Check if post exists and user owns it
        const existingPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true, content: true },
        });

        if (!existingPost) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        if (existingPost.userId !== currentUserId) {
            return NextResponse.json(
                { error: 'You can only edit your own posts' },
                { status: 403 }
            );
        }

        const filteredContent = moderationResult.filteredContent?.trim() || content.trim();

        // Check if content actually changed
        if (existingPost.content === filteredContent) {
            return NextResponse.json(
                { error: 'No changes detected' },
                { status: 400 }
            );
        }

        // Update the post
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                content: filteredContent,
                isEdited: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                username: true,
                                displayName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
                likes: {
                    where: { userId: currentUserId },
                    select: { id: true },
                },
            },
        });

        // Transform the response
        const transformedPost = {
            ...updatedPost,
            isLiked: updatedPost.likes.length > 0,
            likes: undefined,
        };

        return NextResponse.json(transformedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json(
            { error: 'Failed to update post' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/posts/[id]
 * Delete a specific post (only by the author)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const postId = params.id;

        // Check if post exists and user owns it
        const existingPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true },
        });

        if (!existingPost) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        if (existingPost.userId !== currentUserId) {
            return NextResponse.json(
                { error: 'You can only delete your own posts' },
                { status: 403 }
            );
        }

        // Delete the post (cascade will handle related data)
        await prisma.post.delete({
            where: { id: postId },
        });

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
        );
    }
}