import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/posts/[id]/like
 * Like a post
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const postId = params.id;

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                userId: true,
                user: {
                    select: {
                        username: true,
                        displayName: true,
                    }
                }
            },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // Check if user already liked this post
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: currentUserId,
                    postId: postId,
                },
            },
        });

        if (existingLike) {
            return NextResponse.json(
                { error: 'Post already liked' },
                { status: 400 }
            );
        }

        // Create the like
        await prisma.like.create({
            data: {
                userId: currentUserId,
                postId: postId,
            },
        });

        // Create notification for the post author (if not liking own post)
        if (post.userId !== currentUserId) {
            await prisma.notification.create({
                data: {
                    userId: post.userId,
                    type: 'like',
                    referenceId: postId,
                },
            });
        }

        return NextResponse.json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error('Error liking post:', error);
        return NextResponse.json(
            { error: 'Failed to like post' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/posts/[id]/like
 * Unlike a post
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

        // Check if like exists
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: currentUserId,
                    postId: postId,
                },
            },
        });

        if (!existingLike) {
            return NextResponse.json(
                { error: 'Like not found' },
                { status: 404 }
            );
        }

        // Delete the like
        await prisma.like.delete({
            where: {
                userId_postId: {
                    userId: currentUserId,
                    postId: postId,
                },
            },
        });

        return NextResponse.json({ message: 'Post unliked successfully' });
    } catch (error) {
        console.error('Error unliking post:', error);
        return NextResponse.json(
            { error: 'Failed to unlike post' },
            { status: 500 }
        );
    }
}