'use client';

import { useRef, useState } from 'react';
import { PostForm, PostList } from '@/components/posts';

interface FeedProps {
    type?: 'personalized' | 'explore' | 'trending';
    showPostForm?: boolean;
    showHeader?: boolean;
}

export default function Feed({ type = 'personalized', showPostForm = true, showHeader = true }: FeedProps) {
    const postListRef = useRef<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const handlePostCreated = (newPost: any) => {
        // Add new post to the top of the feed
        if (postListRef.current && postListRef.current.handlePostCreated) {
            postListRef.current.handlePostCreated(newPost);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            if (postListRef.current && postListRef.current.refresh) {
                await postListRef.current.refresh();
            }
        } finally {
            setRefreshing(false);
        }
    };

    const getFeedTitle = () => {
        switch (type) {
            case 'explore':
                return 'Explore';
            case 'trending':
                return 'Trending';
            default:
                return 'Home Feed';
        }
    };

    const getFeedDescription = () => {
        switch (type) {
            case 'explore':
                return 'Discover new posts and users';
            case 'trending':
                return 'Popular posts from the last 24 hours';
            default:
                return 'Posts from people you follow';
        }
    };

    return (
        <div className={showHeader ? "max-w-2xl mx-auto py-6 px-4" : ""}>
            {/* Feed Header */}
            {showHeader && (
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {getFeedTitle()}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {getFeedDescription()}
                            </p>
                        </div>

                        {/* Refresh Button */}
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className={`p-2 rounded-full transition-colors ${refreshing
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'
                                }`}
                            title="Refresh feed"
                            aria-label="Refresh feed"
                        >
                            <svg
                                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Post Form */}
            {showPostForm && type === 'personalized' && (
                <div className={showHeader ? "mt-6" : "mb-6"}>
                    <PostForm onPostCreated={handlePostCreated} />
                </div>
            )}

            {/* Feed Content */}
            <div className={showHeader ? "mt-6" : ""}>
                <PostList
                    ref={postListRef}
                    type={type}
                    enableInfiniteScroll={true}
                />
            </div>
        </div>
    );
}