'use client';

import { useState } from 'react';
import { PostCard } from '@/components/posts';
import Link from 'next/link';
import { SearchSkeleton } from '@/components/ui/loading-skeleton';
import FadeIn from '@/components/ui/fade-in';

interface User {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    profileImageUrl: string | null;
    _count: {
        posts: number;
        followedBy: number;
        following: number;
    };
    isFollowing: boolean;
}

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

interface SearchResultsProps {
    query: string;
    users?: User[];
    posts?: Post[];
    type: 'all' | 'users' | 'posts';
    loading: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onTypeChange: (type: 'all' | 'users' | 'posts') => void;
}

export default function SearchResults({
    query,
    users = [],
    posts = [],
    type,
    loading,
    hasMore = false,
    onLoadMore,
    onTypeChange,
}: SearchResultsProps) {
    const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

    const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
        try {
            const response = await fetch(`/api/users/${userId}/follow`, {
                method: isCurrentlyFollowing ? 'DELETE' : 'POST',
            });

            if (response.ok) {
                setFollowingUsers(prev => {
                    const newSet = new Set(prev);
                    if (isCurrentlyFollowing) {
                        newSet.delete(userId);
                    } else {
                        newSet.add(userId);
                    }
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error following/unfollowing user:', error);
        }
    };

    const UserCard = ({ user }: { user: User }) => {
        const isFollowing = followingUsers.has(user.id) || user.isFollowing;

        return (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <Link href={`/profile/${user.username}`}>
                        <div className="flex-shrink-0">
                            {user.profileImageUrl ? (
                                <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={user.profileImageUrl}
                                    alt={user.displayName}
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                        <Link href={`/profile/${user.username}`}>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                                    {user.displayName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @{user.username}
                                </p>
                                {user.bio && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                        {user.bio}
                                    </p>
                                )}
                                <div className="flex space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{user._count.posts} posts</span>
                                    <span>{user._count.followedBy} followers</span>
                                    <span>{user._count.following} following</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleFollow(user.id, isFollowing)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isFollowing
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                        }`}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>
        );
    };

    if (!query) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium">Search for users and posts</h3>
                <p className="mt-1 text-sm">Start typing to find people and content</p>
            </div>
        );
    }

    return (
        <div>
            {/* Search Type Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: 'all', label: 'All', count: (users?.length || 0) + (posts?.length || 0) },
                        { key: 'users', label: 'Users', count: users?.length || 0 },
                        { key: 'posts', label: 'Posts', count: posts?.length || 0 },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTypeChange(tab.key as 'all' | 'users' | 'posts')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${type === tab.key
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Loading State */}
            {loading && (users?.length === 0 && posts?.length === 0) && (
                <SearchSkeleton />
            )}

            {/* Results */}
            {!loading && (users?.length === 0 && posts?.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium">No results found</h3>
                    <p className="mt-1 text-sm">Try searching for something else</p>
                </div>
            )}

            {/* Users Results */}
            {(type === 'all' || type === 'users') && users && users.length > 0 && (
                <div className="mt-4">
                    {type === 'all' && (
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Users</h3>
                    )}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        {users.map((user, index) => (
                            <FadeIn key={user.id} delay={index * 50}>
                                <UserCard user={user} />
                            </FadeIn>
                        ))}
                    </div>
                </div>
            )}

            {/* Posts Results */}
            {(type === 'all' || type === 'posts') && posts && posts.length > 0 && (
                <div className="mt-4">
                    {type === 'all' && (
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Posts</h3>
                    )}
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {posts.map((post, index) => {
                            // Transform post to match expected types
                            const transformedPost = {
                                ...post,
                                user: {
                                    ...post.user,
                                    profileImageUrl: post.user.profileImageUrl || undefined
                                }
                            };

                            return (
                                <FadeIn key={post.id} delay={index * 50}>
                                    <PostCard post={transformedPost} />
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Load More Button */}
            {hasMore && onLoadMore && (
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={onLoadMore}
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
        </div>
    );
}