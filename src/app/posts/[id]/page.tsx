'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PostCard } from '@/components/posts';
import ThreadedReplies from '@/components/conversations/ThreadedReplies';
import Link from 'next/link';

export default function PostDetailPage() {
    const params = useParams();
    const postId = params.id as string;

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/posts/${postId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch post');
                }

                const data = await response.json();
                setPost(data);
            } catch (err) {
                setError('Failed to load post');
                console.error('Error fetching post:', err);
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId]);

    const handlePostUpdated = (updatedPost: any) => {
        setPost(updatedPost);
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-6 px-4">
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-2xl mx-auto py-6 px-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error || 'Post not found'}</p>
                    <Link href="/feed" className="text-sm underline hover:no-underline mt-2 inline-block">
                        ← Back to feed
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            {/* Back navigation */}
            <div className="mb-4">
                <Link
                    href="/feed"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to feed
                </Link>
            </div>

            {/* Main post */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <PostCard
                    post={post}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={() => {
                        // Redirect to feed after deletion
                        window.location.href = '/feed';
                    }}
                    showReplies={false}
                />
            </div>

            {/* Threaded Replies */}
            <div>
                <h2 className="text-lg font-semibold mb-4">
                    Replies ({post._count.replies})
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <ThreadedReplies
                        postId={post.id}
                        initialReplies={post.replies || []}
                        maxDepth={3}
                        showReplyForm={true}
                    />
                </div>
            </div>
        </div>
    );
}