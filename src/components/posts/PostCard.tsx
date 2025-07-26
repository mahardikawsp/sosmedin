'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import PostEditForm from './PostEditForm';
import LikeButton from '@/components/interactions/LikeButton';

interface PostCardProps {
    post: {
        id: string;
        content: string;
        createdAt: string;
        isEdited?: boolean;
        user: {
            id: string;
            username: string;
            displayName: string;
            profileImageUrl?: string;
        };
        parent?: {
            id: string;
            content: string;
            user: {
                username: string;
                displayName: string;
            };
        };
        _count: {
            likes: number;
            replies: number;
        };
        isLiked?: boolean;
    };
    onPostUpdated?: (updatedPost: any) => void;
    onPostDeleted?: (postId: string) => void;
    showReplies?: boolean;
}

export default function PostCard({
    post,
    onPostUpdated,
    onPostDeleted,
    showReplies = true
}: PostCardProps) {
    const { data: session } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [localPost, setLocalPost] = useState(post);

    const isOwner = session?.user?.id === post.user.id;

    const handleLikeChange = (liked: boolean, newCount: number) => {
        setLocalPost(prev => ({
            ...prev,
            isLiked: liked,
            _count: {
                ...prev._count,
                likes: newCount,
            },
        }));
    };

    const handleDelete = async () => {
        if (!isOwner || isDeleting) return;

        if (!confirm('Are you sure you want to delete this post?')) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                onPostDeleted?.(post.id);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditComplete = (updatedPost: any) => {
        setLocalPost(updatedPost);
        setIsEditing(false);
        onPostUpdated?.(updatedPost);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes}m`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {/* Parent post preview (for replies) */}
            {localPost.parent && (
                <div className="mb-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-gray-300 dark:border-gray-600">
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Replying to <Link href={`/${localPost.parent.user.username}`} className="text-blue-500 hover:underline">
                            @{localPost.parent.user.username}
                        </Link>
                    </div>
                    <p className="text-xs sm:text-sm mt-1 text-gray-700 dark:text-gray-300">
                        {localPost.parent.content.length > 100
                            ? `${localPost.parent.content.substring(0, 100)}...`
                            : localPost.parent.content
                        }
                    </p>
                </div>
            )}

            <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                    <Link href={`/${localPost.user.username}`}>
                        {localPost.user.profileImageUrl ? (
                            <Image
                                src={localPost.user.profileImageUrl}
                                alt={localPost.user.displayName}
                                width={36}
                                height={36}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">
                                    {localPost.user.displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </Link>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <Link href={`/${localPost.user.username}`} className="font-bold hover:underline text-sm sm:text-base truncate">
                            {localPost.user.displayName}
                        </Link>
                        <Link href={`/${localPost.user.username}`} className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm hover:underline truncate">
                            @{localPost.user.username}
                        </Link>
                        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">·</span>
                        <Link href={`/posts/${localPost.id}`} className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm hover:underline">
                            {formatDate(localPost.createdAt)}
                        </Link>
                        {localPost.isEdited && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">· edited</span>
                        )}
                    </div>

                    {isEditing ? (
                        <PostEditForm
                            post={localPost}
                            onSave={handleEditComplete}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <div className="mt-1">
                            <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{localPost.content}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 sm:gap-6 mt-3 text-gray-500 dark:text-gray-400">
                        {/* Like button */}
                        <LikeButton
                            postId={localPost.id}
                            initialLiked={localPost.isLiked || false}
                            initialCount={localPost._count.likes}
                            onLikeChange={handleLikeChange}
                        />

                        {/* Reply button */}
                        {showReplies && (
                            <Link
                                href={`/posts/${localPost.id}`}
                                className="flex items-center gap-1 text-xs sm:text-sm hover:text-blue-500 transition-colors"
                            >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{localPost._count.replies}</span>
                            </Link>
                        )}

                        {/* Edit/Delete buttons for post owner */}
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs sm:text-sm hover:text-blue-500 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="text-xs sm:text-sm hover:text-red-500 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}