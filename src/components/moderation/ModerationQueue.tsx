'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ModerationQueueItem } from './ModerationQueueItem';

interface QueueItem {
    id: string;
    contentId: string;
    contentType: 'post' | 'reply' | 'profile';
    content: string;
    userId: string;
    flagReason: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    moderationTags: string[];
    createdAt: string;
    status: 'pending' | 'reviewed' | 'escalated';
    automatedResult: {
        shouldFlag: boolean;
        suggestedAction: string;
        confidence: number;
        severity: 'low' | 'medium' | 'high';
        flagReason: string;
        moderationTags: string[];
        details: {
            toxicityScore: number;
            spamScore: number;
            profanityScore: number;
            threatScore: number;
            personalInfoScore: number;
        };
    };
}

interface QueueResponse {
    queue: QueueItem[];
}

export function ModerationQueue() {
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        status: 'all',
        severity: 'all',
        contentType: 'all',
    });

    const fetchQueue = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({ action: 'queue' });

            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.severity !== 'all') params.append('severity', filters.severity);
            if (filters.contentType !== 'all') params.append('contentType', filters.contentType);

            const response = await fetch(`/api/moderation?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch moderation queue');
            }

            const data: QueueResponse = await response.json();
            setQueueItems(data.queue);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch queue');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [filters]);

    const handleModerationDecision = async (queueId: string, decision: 'approve' | 'reject' | 'escalate', reason?: string) => {
        try {
            const response = await fetch('/api/moderation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'decision',
                    queueId,
                    decision,
                    reason,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to process moderation decision');
            }

            // Refresh the queue
            await fetchQueue();
        } catch (err) {
            console.error('Error processing moderation decision:', err);
            // You might want to show a toast notification here
        }
    };

    const getSeverityColor = useCallback((severity: string) => {
        switch (severity) {
            case 'high':
                return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
            case 'medium':
                return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
            case 'low':
                return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
            default:
                return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
        }
    }, []);

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'escalated':
                return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
            case 'pending':
                return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
            case 'reviewed':
                return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
            default:
                return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
        }
    }, []);

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                                Error loading moderation queue
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                {error}
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchQueue}
                                    className="bg-red-100 dark:bg-red-900/40 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/60"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="escalated">Escalated</option>
                        <option value="reviewed">Reviewed</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Severity
                    </label>
                    <select
                        value={filters.severity}
                        onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="all">All Severity</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Content Type
                    </label>
                    <select
                        value={filters.contentType}
                        onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="all">All Types</option>
                        <option value="post">Posts</option>
                        <option value="reply">Replies</option>
                        <option value="profile">Profiles</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={fetchQueue}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Queue Items */}
            {queueItems.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No items in queue</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        All content has been reviewed or no content matches the current filters.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {queueItems.map((item) => (
                        <ModerationQueueItem
                            key={item.id}
                            item={item}
                            onDecision={handleModerationDecision}
                            getSeverityColor={getSeverityColor}
                            getStatusColor={getStatusColor}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}