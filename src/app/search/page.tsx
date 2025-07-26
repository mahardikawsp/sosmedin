'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchInput from '@/components/search/SearchInput';
import SearchResults from '@/components/search/SearchResults';

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

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [type, setType] = useState<'all' | 'users' | 'posts'>((searchParams.get('type') as any) || 'all');
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const performSearch = useCallback(async (searchQuery: string, searchType: 'all' | 'users' | 'posts' = 'all', cursor?: string) => {
        if (!searchQuery.trim()) {
            setUsers([]);
            setPosts([]);
            setHasMore(false);
            setNextCursor(null);
            return;
        }

        setLoading(true);

        try {
            const params = new URLSearchParams({
                q: searchQuery.trim(),
                type: searchType,
            });

            if (cursor) {
                params.append('cursor', cursor);
            }

            const response = await fetch(`/api/search?${params}`);

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();

            if (cursor) {
                // Append to existing results for pagination
                if (data.users) {
                    setUsers(prev => [...prev, ...data.users]);
                }
                if (data.posts) {
                    setPosts(prev => [...prev, ...data.posts]);
                }
            } else {
                // Replace results for new search
                setUsers(data.users || []);
                setPosts(data.posts || []);
            }

            setHasMore(data.hasMore || false);
            setNextCursor(data.nextCursor || null);

            // Update URL
            const newParams = new URLSearchParams();
            newParams.set('q', searchQuery.trim());
            if (searchType !== 'all') {
                newParams.set('type', searchType);
            }

            router.replace(`/search?${newParams}`, { scroll: false });

        } catch (error) {
            console.error('Search error:', error);
            setUsers([]);
            setPosts([]);
            setHasMore(false);
            setNextCursor(null);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handleSearch = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        performSearch(searchQuery, type);
    }, [performSearch, type]);

    const handleTypeChange = useCallback((newType: 'all' | 'users' | 'posts') => {
        setType(newType);
        if (query) {
            performSearch(query, newType);
        }
    }, [query, performSearch]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && nextCursor && !loading) {
            performSearch(query, type, nextCursor);
        }
    }, [hasMore, nextCursor, loading, query, type, performSearch]);

    // Perform initial search if query is in URL
    useEffect(() => {
        const urlQuery = searchParams.get('q');
        const urlType = (searchParams.get('type') as 'all' | 'users' | 'posts') || 'all';

        if (urlQuery) {
            setQuery(urlQuery);
            setType(urlType);
            performSearch(urlQuery, urlType);
        }
    }, [searchParams, performSearch]);

    return (
        <div className="max-w-2xl mx-auto py-4 sm:py-6 px-4">
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Search
                </h1>

                <SearchInput
                    onSearch={handleSearch}
                    placeholder="Search users and posts..."
                    autoFocus={!query}
                />
            </div>

            <SearchResults
                query={query}
                users={users}
                posts={posts}
                type={type}
                loading={loading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                onTypeChange={handleTypeChange}
            />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="max-w-2xl mx-auto py-4 sm:py-6 px-4">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Search
                    </h1>
                    <div className="animate-pulse">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}