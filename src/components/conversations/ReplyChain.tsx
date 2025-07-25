'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-session';

interface Reply {
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
    _count: {
        likes: number;
        replies: number;
    };
    isLiked?: boolean;
}

interface ReplyChainProps {
    postId: string;
    limit?: number;
    onReplyCountChange?: (count: number) => void;
}

export default function ReplyChain({
    postId,
    limit = 20,
    onReplyCountChange
}: ReplyChainProps) {
    const { data: session } = useSession();
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);

    useEffect(() => {
        loadReplies();
    }, [postId]);

    const loadReplies = async (loadMore = false) => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                limit: limit.toString(),
            });

            if (loadMore && cursor) {
                params.append('cursor', cursor);
            }

            const response = await fetch(`/api/posts/${postId}/reply?${params}`);

            if (!response.ok) {
                throw new Error('Failed to load replies');
            }

            const data = await response.json();

            if (loadMore) {
                setReplies(prev => [...prev, ...data.replies]);
            } else {
                setReplies(data.replies);
                onReplyCountChange?.(data.replies.length);
            }

            setHasMore(data.hasMore);
            setCursor(data.nextCursor);
        } catch (err) {
            console.error('Error loading replies:', err);
            setError('Failed to load replies');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreReplies = () => {
        if (!loading && hasMore) {
            loadReplies(true);
        }
    };

    const handleReplyUpdate = (updatedReply: Reply) => {
        setReplies(prev => prev.map(reply =>
            reply.id === updatedReply.id ? updatedReply : reply
        ));
    };

    const handleReplyDelete = (deletedReplyId: string) => {
        setReplies(prev => prev.filter(reply => reply.id !== deletedReplyId));
        onReplyCountChange?.(replies.length - 1);
    };

    const handleLikeChange = (replyId: string, liked: boolean, newCount: number) => {
        setReplies(prev => prev.map(reply =>
            reply.id === replyId
                ? { ...reply, isLiked: liked, _count: { ...reply._count, likes: newCount } }
                : reply
        ));
    };

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
                <button
                    onClick={() => loadReplies()}
                    className="ml-2 underline hover:no-underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {replies.map((reply, index) => (
                <ReplyItem
                    key={reply.id}
                    reply={reply}
                    isLast={index === replies.length - 1}
                    onUpdate={handleReplyUpdate}
                    onDelete={handleReplyDelete}
                    onLikeChange={handleLikeChange}
                />
            ))}

            {loading && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {hasMore && !loading && (
                <div className="text-center py-4">
                    <button
                        onClick={loadMoreReplies}
                        className="text-blue-500 hover:underline text-sm"
                    >
                        Load more replies
                    </button>
                </div>
            )}

            {replies.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    No replies yet
                </div>
            )}
        </div>
    );
}

interface ReplyItemProps {
    reply: Reply;
    isLast: boolean;
    onUpdate: (reply: Reply) => void;
    onDelete: (replyId: string) => void;
    onLikeChange: (replyId: string, liked: boolean, newCount: number) => void;
}

function ReplyItem({ reply, isLast, onUpdate, onDelete, onLikeChange }: ReplyItemProps) {
    const { data: session, isAuthenticated } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = session?.user?.id === reply.user.id;

    const handleDelete = async () => {
        if (!isOwner || isDeleting) return;

        if (!confirm('Are you sure you want to delete this reply?')) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/posts/${reply.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                onDelete(reply.id);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to delete reply');
            }
        } catch (error) {
            console.error('Error deleting reply:', error);
            alert('Failed to delete reply');
        } finally {
            setIsDeleting(false);
        }
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
        <div className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {reply.user.profileImageUrl ? (
                        <img
                            src={reply.user.profileImageUrl}
                            alt={reply.user.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                {reply.user.displayName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                            {reply.user.displayName}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                            @{reply.user.username}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">·</span>
                        <span className="text-gray-500 dark:text-gray-400">
                            {formatDate(reply.createdAt)}
                        </span>
                        {reply.isEdited && (
                            <span className="text-gray-500 dark:text-gray-400">· edited</span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="mt-1">
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words text-sm">
                            {reply.content}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {/* Like button */}
                        <button
                            onClick={async () => {
                                if (!isAuthenticated) return;

                                try {
                                    const response = await fetch(`/api/posts/${reply.id}/like`, {
                                        method: reply.isLiked ? 'DELETE' : 'POST',
                                    });

                                    if (response.ok) {
                                        const newLiked = !reply.isLiked;
                                        const newCount = reply.isLiked ? reply._count.likes - 1 : reply._count.likes + 1;
                                        onLikeChange(reply.id, newLiked, newCount);
                                    }
                                } catch (error) {
                                    console.error('Error toggling like:', error);
                                }
                            }}
                            disabled={!isAuthenticated}
                            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${reply.isLiked ? 'text-red-500' : ''
                                } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <svg className="w-3 h-3" fill={reply.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{reply._count.likes}</span>
                        </button>

                        {/* Owner actions */}
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="hover:text-red-500 transition-colors disabled:opacity-50"
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