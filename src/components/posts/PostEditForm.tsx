'use client';

import { useState } from 'react';

interface PostEditFormProps {
    post: {
        id: string;
        content: string;
    };
    onSave: (updatedPost: any) => void;
    onCancel: () => void;
}

export default function PostEditForm({ post, onSave, onCancel }: PostEditFormProps) {
    const [content, setContent] = useState(post.content);
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

        if (content.trim() === post.content) {
            onCancel();
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update post');
            }

            const updatedPost = await response.json();
            onSave(updatedPost);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                maxLength={500}
                disabled={isSubmitting}
                autoFocus
            />

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className={content.length > 450 ? 'text-red-500' : ''}>
                        {content.length}/500
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !content.trim() || content.length > 500}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}
        </form>
    );
}