'use client';

import { useState, useEffect } from 'react';

interface ModerationStats {
    total: number;
    automated: number;
    manual: number;
    actionBreakdown: {
        approved: number;
        blocked: number;
        flagged: number;
    };
    severityBreakdown: {
        low: number;
        medium: number;
        high: number;
    };
    queueStats: {
        pending: number;
        escalated: number;
        totalInQueue: number;
    };
    automationRate: number;
}

interface StatsResponse {
    stats: ModerationStats;
}

export function ModerationStats() {
    const [stats, setStats] = useState<ModerationStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState('7'); // days

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                action: 'stats',
                timeframe: timeframe
            });

            const response = await fetch(`/api/moderation?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch moderation statistics');
            }

            const data: StatsResponse = await response.json();
            setStats(data.stats);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [timeframe]);

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
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
                                Error loading statistics
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                {error}
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchStats}
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

    if (!stats) {
        return null;
    }

    const StatCard = ({ title, value, subtitle, color = 'blue' }: {
        title: string;
        value: string | number;
        subtitle?: string;
        color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    }) => {
        const colorClasses = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
            yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
            red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        };

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <div className={`p-2 rounded-md ${colorClasses[color]}`}>
                        <div className="text-2xl font-bold">
                            {value}
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {title}
                        </div>
                        {subtitle && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const ProgressBar = ({ label, value, total, color = 'blue' }: {
        label: string;
        value: number;
        total: number;
        color?: 'blue' | 'green' | 'yellow' | 'red';
    }) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;

        const colorClasses = {
            blue: 'bg-blue-600',
            green: 'bg-green-600',
            yellow: 'bg-yellow-600',
            red: 'bg-red-600',
        };

        return (
            <div className="mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <span>{label}</span>
                    <span>{value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${colorClasses[color]}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            {/* Timeframe Selector */}
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Moderation Statistics
                </h2>
                <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timeframe:
                    </label>
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="block px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                        <option value="1">Last 24 hours</option>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Actions"
                    value={stats.total}
                    subtitle="Moderation actions taken"
                    color="blue"
                />
                <StatCard
                    title="Automation Rate"
                    value={`${stats.automationRate.toFixed(1)}%`}
                    subtitle={`${stats.automated} automated`}
                    color="green"
                />
                <StatCard
                    title="Queue Items"
                    value={stats.queueStats.totalInQueue}
                    subtitle={`${stats.queueStats.escalated} escalated`}
                    color="yellow"
                />
                <StatCard
                    title="Manual Reviews"
                    value={stats.manual}
                    subtitle="Human moderation"
                    color="purple"
                />
            </div>

            {/* Detailed Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Action Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Action Breakdown
                    </h3>
                    <ProgressBar
                        label="Approved"
                        value={stats.actionBreakdown.approved}
                        total={stats.total}
                        color="green"
                    />
                    <ProgressBar
                        label="Blocked"
                        value={stats.actionBreakdown.blocked}
                        total={stats.total}
                        color="red"
                    />
                    <ProgressBar
                        label="Flagged"
                        value={stats.actionBreakdown.flagged}
                        total={stats.total}
                        color="yellow"
                    />
                </div>

                {/* Severity Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Severity Breakdown
                    </h3>
                    <ProgressBar
                        label="High Severity"
                        value={stats.severityBreakdown.high}
                        total={stats.total}
                        color="red"
                    />
                    <ProgressBar
                        label="Medium Severity"
                        value={stats.severityBreakdown.medium}
                        total={stats.total}
                        color="yellow"
                    />
                    <ProgressBar
                        label="Low Severity"
                        value={stats.severityBreakdown.low}
                        total={stats.total}
                        color="green"
                    />
                </div>
            </div>

            {/* Queue Status */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Current Queue Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.queueStats.pending}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Pending Review
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {stats.queueStats.escalated}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Escalated
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                            {stats.queueStats.totalInQueue}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total in Queue
                        </div>
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <div className="mt-6 text-center">
                <button
                    onClick={fetchStats}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Refresh Statistics
                </button>
            </div>
        </div>
    );
}