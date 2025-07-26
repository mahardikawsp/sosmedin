'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ModerationQueue } from '@/components/moderation/ModerationQueue';
import { ModerationStats } from '@/components/moderation/ModerationStats';
import { ModerationSettings } from '@/components/moderation/ModerationSettings';
import { UserManagement } from '@/components/moderation/UserManagement';

type TabType = 'queue' | 'stats' | 'settings' | 'users';

export default function ModerationDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('queue');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/login');
            return;
        }

        // In a real app, you'd check if the user has moderation permissions
        // For now, we'll allow any authenticated user to access the moderation dashboard
        setIsLoading(false);
    }, [session, status, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const tabs = [
        { id: 'queue' as TabType, label: 'Moderation Queue', icon: '📋' },
        { id: 'stats' as TabType, label: 'Statistics', icon: '📊' },
        { id: 'users' as TabType, label: 'User Management', icon: '👥' },
        { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Moderation Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage content moderation, user reports, and community safety
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    {activeTab === 'queue' && <ModerationQueue />}
                    {activeTab === 'stats' && <ModerationStats />}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'settings' && <ModerationSettings />}
                </div>
            </div>
        </div>
    );
}