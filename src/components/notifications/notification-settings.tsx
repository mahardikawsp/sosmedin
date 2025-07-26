'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-session';

interface NotificationSettings {
    likes: boolean;
    follows: boolean;
    replies: boolean;
}

interface NotificationSettingsFormProps {
    onClose?: () => void;
}

export default function NotificationSettingsForm({ onClose }: NotificationSettingsFormProps) {
    const { data: session, isAuthenticated } = useSession();
    const [settings, setSettings] = useState<NotificationSettings>({
        likes: true,
        follows: true,
        replies: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch current settings
    const fetchSettings = async () => {
        if (!isAuthenticated || !session?.user?.id) return;

        try {
            setIsLoading(true);
            const response = await fetch('/api/notifications/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
            } else {
                throw new Error('Failed to fetch settings');
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error);
            setMessage({ type: 'error', text: 'Failed to load notification settings' });
        } finally {
            setIsLoading(false);
        }
    };

    // Load settings on mount
    useEffect(() => {
        fetchSettings();
    }, [isAuthenticated, session?.user?.id]);

    // Handle setting change
    const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Save settings
    const saveSettings = async () => {
        if (!isAuthenticated || !session?.user?.id) return;

        try {
            setIsSaving(true);
            setMessage(null);

            const response = await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ settings }),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
                setMessage({ type: 'success', text: 'Settings saved successfully!' });

                // Auto-hide success message after 3 seconds
                setTimeout(() => setMessage(null), 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving notification settings:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to save settings'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveSettings();
    };

    if (!isAuthenticated) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Please log in to manage notification settings.</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Notification Settings
                </h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-md ${message.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                    }`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {message.type === 'success' ? (
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{message.text}</p>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading settings...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Like notifications
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Get notified when someone likes your posts
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.likes}
                                    onChange={(e) => handleSettingChange('likes', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Follow notifications
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Get notified when someone follows you
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.follows}
                                    onChange={(e) => handleSettingChange('follows', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white">
                                    Reply notifications
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Get notified when someone replies to your posts
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.replies}
                                    onChange={(e) => handleSettingChange('replies', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}