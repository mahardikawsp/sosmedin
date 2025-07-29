'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface User {
    id: string;
    username: string;
    displayName: string | null;
    email: string;
    profileImageUrl: string | null;
    createdAt: string;
    _count: {
        posts: number;
        reportsCreated: number;
        reportsReceived: number;
    };
}

interface Report {
    id: string;
    type: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: string;
    reporter: {
        id: string;
        username: string;
        displayName: string | null;
    };
    reportedPost?: {
        id: string;
        content: string;
        user: {
            id: string;
            username: string;
            displayName: string | null;
        };
    };
    reportedUser?: {
        id: string;
        username: string;
        displayName: string | null;
    };
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'users' | 'reports'>('reports');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/reports?moderation=true');
            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }
            const data = await response.json();
            setReports(data.reports || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch reports');
        }
    };

    const fetchUsers = async () => {
        try {
            // This would need a new API endpoint for user management
            // For now, we'll extract users from reports
            const uniqueUsers = new Map<string, User>();

            reports.forEach(report => {
                if (report.reportedUser) {
                    const user = report.reportedUser;
                    if (!uniqueUsers.has(user.id)) {
                        uniqueUsers.set(user.id, {
                            id: user.id,
                            username: user.username,
                            displayName: user.displayName,
                            email: '', // Would need to fetch from API
                            profileImageUrl: null,
                            createdAt: new Date().toISOString(),
                            _count: {
                                posts: 0,
                                reportsCreated: 0,
                                reportsReceived: reports.filter(r => r.reportedUser?.id === user.id).length,
                            }
                        });
                    }
                }

                if (report.reportedPost?.user) {
                    const user = report.reportedPost.user;
                    if (!uniqueUsers.has(user.id)) {
                        uniqueUsers.set(user.id, {
                            id: user.id,
                            username: user.username,
                            displayName: user.displayName,
                            email: '', // Would need to fetch from API
                            profileImageUrl: null,
                            createdAt: new Date().toISOString(),
                            _count: {
                                posts: 0,
                                reportsCreated: 0,
                                reportsReceived: reports.filter(r => r.reportedPost?.user.id === user.id).length,
                            }
                        });
                    }
                }
            });

            setUsers(Array.from(uniqueUsers.values()));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process user data');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchReports();
            setIsLoading(false);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (reports.length > 0) {
            fetchUsers();
        }
    }, [reports]);

    const filteredReports = useMemo(() => {
        if (!searchTerm) return reports;
        const searchLower = searchTerm.toLowerCase();
        return reports.filter(report => (
            report.reporter.username.toLowerCase().includes(searchLower) ||
            report.reporter.displayName?.toLowerCase().includes(searchLower) ||
            report.reportedUser?.username.toLowerCase().includes(searchLower) ||
            report.reportedUser?.displayName?.toLowerCase().includes(searchLower) ||
            report.reason.toLowerCase().includes(searchLower)
        ));
    }, [reports, searchTerm]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const searchLower = searchTerm.toLowerCase();
        return users.filter(user => (
            user.username.toLowerCase().includes(searchLower) ||
            user.displayName?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        ));
    }, [users, searchTerm]);

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
            case 'reviewed':
                return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
            case 'resolved':
                return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
            case 'dismissed':
                return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
            default:
                return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
        }
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    }, []);

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                Error loading user management data
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    User Management
                </h2>
                <div className="flex items-center space-x-4">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setActiveView('reports')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeView === 'reports'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Reports
                        </button>
                        <button
                            onClick={() => setActiveView('users')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeView === 'users'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Users
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={`Search ${activeView}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeView === 'reports' ? (
                <div className="space-y-4">
                    {filteredReports.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reports found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm ? 'Try adjusting your search terms.' : 'No reports have been submitted yet.'}
                            </p>
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div key={report.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {report.status.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {report.type} report
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(report.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Reporter
                                        </h4>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            @{report.reporter.username}
                                            {report.reporter.displayName && (
                                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                                    ({report.reporter.displayName})
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Reported {report.type}
                                        </h4>
                                        {report.reportedUser ? (
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                @{report.reportedUser.username}
                                                {report.reportedUser.displayName && (
                                                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                                                        ({report.reportedUser.displayName})
                                                    </span>
                                                )}
                                            </p>
                                        ) : report.reportedPost ? (
                                            <div>
                                                <p className="text-sm text-gray-900 dark:text-white mb-1">
                                                    By @{report.reportedPost.user.username}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                    {report.reportedPost.content.length > 100
                                                        ? `${report.reportedPost.content.substring(0, 100)}...`
                                                        : report.reportedPost.content
                                                    }
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Reason: {report.reason}
                                    </h4>
                                    {report.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {report.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm ? 'Try adjusting your search terms.' : 'No users with reports found.'}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                            {user.profileImageUrl ? (
                                                <img
                                                    src={user.profileImageUrl}
                                                    alt={user.displayName || user.username}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            ) : (
                                                <span className="text-gray-600 dark:text-gray-300 font-medium">
                                                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.displayName || user.username}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                @{user.username}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="text-center">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {user._count.reportsReceived}
                                            </div>
                                            <div>Reports</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {user._count.posts}
                                            </div>
                                            <div>Posts</div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    User Details
                                </h2>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                        {selectedUser.profileImageUrl ? (
                                            <img
                                                src={selectedUser.profileImageUrl}
                                                alt={selectedUser.displayName || selectedUser.username}
                                                className="w-16 h-16 rounded-full"
                                            />
                                        ) : (
                                            <span className="text-gray-600 dark:text-gray-300 font-medium text-xl">
                                                {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {selectedUser.displayName || selectedUser.username}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            @{selectedUser.username}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Member since {formatDate(selectedUser.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedUser._count.posts}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {selectedUser._count.reportsReceived}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Reports Received</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {selectedUser._count.reportsCreated}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Reports Created</div>
                                    </div>
                                </div>

                                {/* Action buttons would go here in a real implementation */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                        User management actions would be implemented here based on your moderation policies.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}