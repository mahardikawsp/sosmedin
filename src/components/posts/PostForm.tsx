'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface PostFormProps {
    onPostCreated?: (post: any) => void;
    parentId?: string;
    placeholder?: string;
    buttonText?: string;
}

export default function PostForm({
    onPostCreated,
    parentId,
    placeholder = "What's happening?",
    buttonText = "Post"
}: PostFormProps) {
    const { data: session } = useSession();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            setError('Content cannot be empty');
            return;
        }

        if (content.length > 500) {
            setError('Content cannot exceed 500 characters');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content.trim(),
                    parentId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create post');
            }

            const newPost = await response.json();
            setContent('');
            onPostCreated?.(newPost);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!session) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-600 dark:text-gray-400">Please sign in to create posts</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    {session.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            className="w-10 h-10 rounded-full"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={placeholder}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                        maxLength={500}
                        disabled={isSubmitting}
                    />

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className={content.length > 450 ? 'text-red-500' : ''}>
                                {content.length}/500
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !content.trim() || content.length > 500}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Posting...' : buttonText}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}