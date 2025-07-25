'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import PostCard from './PostCard';

interface Post {
    id: string;
    content: string;
    userId: string;
    parentId: string | null;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        displayName: string;
        profileImageUrl: string | null;
    };
    _count: {
        likes: number;
        replies: number;
    };
    isLiked: boolean;
}

interface PostListProps {
    type?: 'personalized' | 'explore' | 'trending' | 'user';
    username?: string;
    initialPosts?: Post[];
    enableInfiniteScroll?: boolean;
}

interface PostListRef {
    handlePostCreated: (newPost: Post) => void;
    refresh: () => void;
}

const PostList = forwardRef<PostListRef, PostListProps>(function PostList({
    type = 'personalized',
    username,
    initialPosts = [],
    enableInfiniteScroll = true
}, ref) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const fetchPosts = useCallback(async (cursor?: string, isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            let url: string;
            const params = new URLSearchParams();

            if (type === 'user' && username) {
                url = `/api/users/${username}/posts`;
            } else {
                url = '/api/feed';
                if (type !== 'personalized') {
                    params.append('type', type);
                }
            }

            if (cursor && !isRefresh) {
                params.append('cursor', cursor);
            }

            const queryString = params.toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;

            const response = await fetch(fullUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            const data = await response.json();

            if (type === 'user') {
                // User posts API has different structure
                if (cursor && !isRefresh) {
                    setPosts(prev => [...prev, ...data.posts]);
                } else {
                    setPosts(data.posts);
                }
                setHasMore(data.pagination?.page < data.pagination?.pages);
            } else {
                // Feed API structure
                if (cursor && !isRefresh) {
                    setPosts(prev => [...prev, ...data.posts]);
                } else {
                    setPosts(data.posts);
                }
                setHasMore(data.hasMore);
                setNextCursor(data.nextCursor);
            }
        } catch (err) {
            setError('Failed to load posts');
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [type, username]);

    // Initial load
    useEffect(() => {
        if (initialPosts.length === 0) {
            fetchPosts();
        }
    }, [fetchPosts, initialPosts.length]);

    // Set up infinite scroll observer
    useEffect(() => {
        if (!enableInfiniteScroll || !loadMoreRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !loading && !refreshing) {
                    loadMore();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px',
            }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, loading, refreshing, enableInfiniteScroll]);

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    const loadMore = useCallback(() => {
        if (!loading && !refreshing && hasMore) {
            if (type === 'user') {
                // For user posts, we need to calculate the next page
                const currentPage = Math.ceil(posts.length / 10) + 1;
                fetchPosts(currentPage.toString());
            } else {
                fetchPosts(nextCursor || undefined);
            }
        }
    }, [loading, refreshing, hasMore, type, posts.length, nextCursor, fetchPosts]);

    const handlePostUpdated = useCallback((updatedPost: Post) => {
        setPosts(prev => prev.map(post =>
            post.id === updatedPost.id ? updatedPost : post
        ));
    }, []);

    const handlePostDeleted = useCallback((postId: string) => {
        setPosts(prev => prev.filter(post => post.id !== postId));
    }, []);

    const handlePostCreated = useCallback((newPost: Post) => {
        setPosts(prev => [newPost, ...prev]);
    }, []);

    const refresh = useCallback(() => {
        fetchPosts(undefined, true);
    }, [fetchPosts]);

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
        handlePostCreated,
        refresh,
    }), [handlePostCreated, refresh]);

    if (loading && posts.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error && posts.length === 0) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                <button
                    type="button"
                    onClick={() => fetchPosts()}
                    className="mt-2 text-sm underline hover:no-underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {type === 'user' ? 'No posts yet.' : 'No posts to show.'}
            </div>
        );
    }

    return (
        <div>
            {/* Refresh indicator */}
            {refreshing && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Refreshing...</span>
                </div>
            )}

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={handlePostDeleted}
                    />
                ))}
            </div>

            {/* Infinite scroll trigger */}
            {enableInfiniteScroll && hasMore && (
                <div
                    ref={loadMoreRef}
                    className="flex justify-center items-center py-8"
                >
                    {loading && (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
                        </>
                    )}
                </div>
            )}

            {/* Manual load more button (fallback or when infinite scroll is disabled) */}
            {!enableInfiniteScroll && hasMore && (
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={loadMore}
                        disabled={loading}
                        className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${loading
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600'
                            }`}
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}

            {error && posts.length > 0 && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={refresh}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
})
export
    default PostList;