'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import Image from 'next/image';

interface ReplyFormProps {
    postId: string;
    onReplySubmitted?: (reply: any) => void;
    placeholder?: string;
    autoFocus?: boolean;
    showAvatar?: boolean;
}

export default function ReplyForm({
    postId,
    onReplySubmitted,
    placeholder = "Write a reply...",
    autoFocus = false,
    showAvatar = true
}: ReplyFormProps) {
    const { data: session, isAuthenticated } = useSession();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated || !content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/posts/${postId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: content.trim() }),
            });

            if (response.ok) {
                const reply = await response.json();
                setContent('');
                onReplySubmitted?.(reply);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to post reply');
            }
        } catch (error) {
            console.error('Error posting reply:', error);
            setError('Failed to post reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p>Sign in to reply to this post</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
            {error && (
                <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                {showAvatar && (
                    <div className="flex-shrink-0">
                        {session.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    {(session.user?.name || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                        maxLength={500}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                        disabled={isSubmitting}
                    />

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {content.length}/500 characters
                        </span>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Cmd+Enter to post
                            </span>
                            <button
                                type="submit"
                                disabled={!content.trim() || isSubmitting || !isAuthenticated}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!content.trim() || isSubmitting || !isAuthenticated
                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {isSubmitting ? 'Posting...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}