import type { Metadata } from 'next';
import NotificationSettingsForm from '@/components/notifications/notification-settings';
import { ThemeSelector } from '@/components/ui/theme-toggle';

export const metadata: Metadata = {
    title: 'Settings - Sosmedin',
    description: 'Manage your account and notification settings',
};

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your account preferences and notification settings
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings navigation */}
                    <div className="lg:col-span-1">
                        <nav className="space-y-1">
                            <a
                                href="#appearance"
                                className="bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 group border-l-4 px-3 py-2 flex items-center text-sm font-medium"
                            >
                                <svg
                                    className="text-blue-500 mr-3 h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                                    />
                                </svg>
                                Appearance
                            </a>
                            <a
                                href="#notifications"
                                className="border-transparent text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group border-l-4 px-3 py-2 flex items-center text-sm font-medium"
                            >
                                <svg
                                    className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                Notifications
                            </a>
                            <a
                                href="#account"
                                className="border-transparent text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group border-l-4 px-3 py-2 flex items-center text-sm font-medium"
                            >
                                <svg
                                    className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5"
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
                                Account
                            </a>
                            <a
                                href="#privacy"
                                className="border-transparent text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white group border-l-4 px-3 py-2 flex items-center text-sm font-medium"
                            >
                                <svg
                                    className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                                Privacy
                            </a>
                        </nav>
                    </div>

                    {/* Settings content */}
                    <div className="lg:col-span-2">
                        <div id="appearance" className="bg-white dark:bg-gray-800 shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Appearance
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Customize how Sosmedin looks and feels
                                </p>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-base font-medium text-gray-900 dark:text-white">
                                            Theme
                                        </label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Choose your preferred theme or use system setting
                                        </p>
                                        <div className="mt-4">
                                            <ThemeSelector />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="notifications" className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Notification Settings
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Choose what notifications you want to receive
                                </p>
                            </div>
                            <div className="p-6">
                                <NotificationSettingsForm />
                            </div>
                        </div>

                        {/* Placeholder for other settings sections */}
                        <div id="account" className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Account Settings
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Manage your account information
                                </p>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Account settings coming soon...
                                </p>
                            </div>
                        </div>

                        <div id="privacy" className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Privacy Settings
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Control your privacy preferences
                                </p>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Privacy settings coming soon...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}