'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Feed from '@/components/feed/Feed';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/login?callbackUrl=/dashboard');
        }
    }, [status]);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Add refresh logic here if needed
        setTimeout(() => setRefreshing(false), 1000);
    };

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect in the useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                {/* Welcome Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                                Welcome, {session?.user?.name || 'User'}!
                            </h1>
                            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                Stay connected with your network
                            </p>
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <svg
                                    className={`-ml-0.5 mr-2 h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`}
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
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Main Feed - Takes up most space on larger screens */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                            Your Feed
                                        </h2>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Posts from people you follow
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 sm:p-4 lg:p-6">
                                <Feed type="personalized" showPostForm={true} showHeader={false} />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Hidden on mobile */}
                    <div className="hidden lg:block lg:col-span-1 space-y-4 lg:space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Profile
                            </h3>
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    {session?.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || 'User'}
                                            className="h-10 w-10 lg:h-12 lg:w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <span className="text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400">
                                                {session?.user?.name?.[0] || 'U'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {session?.user?.name}
                                    </p>
                                    <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                                        @{(session?.user as any)?.username || 'username'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href={`/profile/${(session?.user as any)?.username || ''}`}
                                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    View Profile
                                </Link>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quick Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Posts</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Following</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Followers</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                                </div>
                            </div>
                        </div>

                        {/* Suggested Users */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Suggested Users
                            </h3>
                            <div className="text-center py-8">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    No suggestions yet
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Start following people to see suggestions
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <Link
                                    href="/explore"
                                    className="w-full inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    Explore
                                </Link>
                                <Link
                                    href="/search"
                                    className="w-full inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    Find People
                                </Link>
                                <Link
                                    href="/settings"
                                    className="w-full inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}