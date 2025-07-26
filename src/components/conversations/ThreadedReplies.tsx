'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/posts/PostCard';
import ReplyForm from '@/components/interactions/ReplyForm';

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
    replies?: Reply[];
}

interface ThreadedRepliesProps {
    postId: string;
    initialReplies?: Reply[];
    maxDepth?: number;
    showReplyForm?: boolean;
}

export default function ThreadedReplies({
    postId,
    initialReplies = [],
    maxDepth = 3,
    showReplyForm = true
}: ThreadedRepliesProps) {
    const [replies, setReplies] = useState<Reply[]>(initialReplies);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    // Load replies if not provided initially
    useEffect(() => {
        if (initialReplies.length === 0) {
            loadReplies();
        }
    }, [postId]);

    const loadReplies = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/posts/${postId}/reply`);
            if (!response.ok) {
                throw new Error('Failed to load replies');
            }

            const data = await response.json();
            setReplies(data.replies || []);
        } catch (err) {
            console.error('Error loading replies:', err);
            setError('Failed to load replies');
        } finally {
            setLoading(false);
        }
    };

    const handleReplySubmitted = (newReply: Reply) => {
        setReplies(prev => [newReply, ...prev]);
    };

    const handleNestedReplySubmitted = (parentId: string, newReply: Reply) => {
        const updateReplies = (replies: Reply[]): Reply[] => {
            return replies.map(reply => {
                if (reply.id === parentId) {
                    return {
                        ...reply,
                        replies: [newReply, ...(reply.replies || [])],
                        _count: {
                            ...reply._count,
                            replies: reply._count.replies + 1,
                        },
                    };
                }
                if (reply.replies) {
                    return {
                        ...reply,
                        replies: updateReplies(reply.replies),
                    };
                }
                return reply;
            });
        };

        setReplies(prev => updateReplies(prev));
        setExpandedReplies(prev => new Set(Array.from(prev).concat([parentId])));
    };

    const handleReplyUpdated = (updatedReply: Reply) => {
        const updateReplies = (replies: Reply[]): Reply[] => {
            return replies.map(reply => {
                if (reply.id === updatedReply.id) {
                    return updatedReply;
                }
                if (reply.replies) {
                    return {
                        ...reply,
                        replies: updateReplies(reply.replies),
                    };
                }
                return reply;
            });
        };

        setReplies(prev => updateReplies(prev));
    };

    const handleReplyDeleted = (deletedReplyId: string) => {
        const removeReply = (replies: Reply[]): Reply[] => {
            return replies.filter(reply => {
                if (reply.id === deletedReplyId) {
                    return false;
                }
                if (reply.replies) {
                    reply.replies = removeReply(reply.replies);
                }
                return true;
            });
        };

        setReplies(prev => removeReply(prev));
    };

    const toggleReplyExpansion = (replyId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(replyId)) {
                newSet.delete(replyId);
            } else {
                newSet.add(replyId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main reply form */}
            {showReplyForm && (
                <ReplyForm
                    postId={postId}
                    onReplySubmitted={handleReplySubmitted}
                    placeholder="Write a reply..."
                />
            )}

            {/* Replies */}
            {replies.length > 0 ? (
                <div className="space-y-2">
                    {replies.map((reply) => (
                        <ThreadedReplyItem
                            key={reply.id}
                            reply={reply}
                            depth={0}
                            maxDepth={maxDepth}
                            isExpanded={expandedReplies.has(reply.id)}
                            onToggleExpansion={() => toggleReplyExpansion(reply.id)}
                            onReplySubmitted={(newReply) => handleNestedReplySubmitted(reply.id, newReply)}
                            onReplyUpdated={handleReplyUpdated}
                            onReplyDeleted={handleReplyDeleted}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No replies yet. Be the first to reply!
                </div>
            )}
        </div>
    );
}

interface ThreadedReplyItemProps {
    reply: Reply;
    depth: number;
    maxDepth: number;
    isExpanded: boolean;
    onToggleExpansion: () => void;
    onReplySubmitted: (reply: Reply) => void;
    onReplyUpdated: (reply: Reply) => void;
    onReplyDeleted: (replyId: string) => void;
}

function ThreadedReplyItem({
    reply,
    depth,
    maxDepth,
    isExpanded,
    onToggleExpansion,
    onReplySubmitted,
    onReplyUpdated,
    onReplyDeleted
}: ThreadedReplyItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const hasReplies = reply.replies && reply.replies.length > 0;
    const canNest = depth < maxDepth;

    const marginLeft = depth * 24; // 24px per depth level

    return (
        <div className="border-l-2 border-gray-100 dark:border-gray-700" style={{ marginLeft: `${marginLeft}px` }}>
            <div className="pl-4">
                <PostCard
                    post={reply}
                    onPostUpdated={onReplyUpdated}
                    onPostDeleted={onReplyDeleted}
                    showReplies={false}
                />

                {/* Reply actions */}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {canNest && (
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="hover:text-blue-500 transition-colors"
                        >
                            Reply
                        </button>
                    )}

                    {hasReplies && (
                        <button
                            onClick={onToggleExpansion}
                            className="hover:text-blue-500 transition-colors flex items-center gap-1"
                        >
                            <svg
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {isExpanded ? 'Hide' : 'Show'} {reply._count.replies} {reply._count.replies === 1 ? 'reply' : 'replies'}
                        </button>
                    )}
                </div>

                {/* Nested reply form */}
                {showReplyForm && canNest && (
                    <div className="mt-3">
                        <ReplyForm
                            postId={reply.id}
                            onReplySubmitted={(newReply) => {
                                onReplySubmitted(newReply);
                                setShowReplyForm(false);
                            }}
                            placeholder={`Reply to ${reply.user.displayName}...`}
                            autoFocus
                            showAvatar={false}
                        />
                    </div>
                )}

                {/* Nested replies */}
                {hasReplies && isExpanded && canNest && (
                    <div className="mt-4 space-y-2">
                        {reply.replies!.map((nestedReply) => (
                            <ThreadedReplyItem
                                key={nestedReply.id}
                                reply={nestedReply}
                                depth={depth + 1}
                                maxDepth={maxDepth}
                                isExpanded={false}
                                onToggleExpansion={() => { }}
                                onReplySubmitted={onReplySubmitted}
                                onReplyUpdated={onReplyUpdated}
                                onReplyDeleted={onReplyDeleted}
                            />
                        ))}
                    </div>
                )}

                {/* Show "Continue thread" link if max depth reached */}
                {hasReplies && !canNest && (
                    <div className="mt-3">
                        <button
                            onClick={() => window.location.href = `/posts/${reply.id}`}
                            className="text-blue-500 hover:underline text-sm"
                        >
                            Continue this thread →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}