'use client';

import { useState, useEffect } from 'react';

interface ModerationSettings {
    enableToxicityDetection: boolean;
    enableSpamDetection: boolean;
    enableProfanityFilter: boolean;
    enableThreatDetection: boolean;
    enablePersonalInfoDetection: boolean;
    flagThreshold: number;
}

interface SettingsResponse {
    settings: ModerationSettings;
}

export function ModerationSettings() {
    const [settings, setSettings] = useState<ModerationSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/moderation?action=settings');

            if (!response.ok) {
                throw new Error('Failed to fetch moderation settings');
            }

            const data: SettingsResponse = await response.json();
            setSettings(data.settings);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch settings');
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!settings) return;

        try {
            setIsSaving(true);
            const response = await fetch('/api/moderation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update-settings',
                    settings,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            setSuccessMessage('Settings saved successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const cleanupOldItems = async () => {
        try {
            const response = await fetch('/api/moderation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'cleanup',
                    olderThanDays: 30,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to cleanup old items');
            }

            const data = await response.json();
            setSuccessMessage(`Cleaned up ${data.cleanedCount} old queue items`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cleanup old items');
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSettingChange = (key: keyof ModerationSettings, value: boolean | number) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error && !settings) {
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
                                Error loading settings
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                {error}
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchSettings}
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

    if (!settings) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="max-w-2xl">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Moderation Settings
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Configure automated content moderation parameters and thresholds.
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                    {successMessage}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detection Settings */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Detection Features
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Toxicity Detection
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Detect toxic, offensive, or harmful language
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableToxicityDetection}
                                    onChange={(e) => handleSettingChange('enableToxicityDetection', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Spam Detection
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Identify repetitive or promotional content
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableSpamDetection}
                                    onChange={(e) => handleSettingChange('enableSpamDetection', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Profanity Filter
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Filter out profane or inappropriate language
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableProfanityFilter}
                                    onChange={(e) => handleSettingChange('enableProfanityFilter', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Threat Detection
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Detect threats, violence, or dangerous content
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableThreatDetection}
                                    onChange={(e) => handleSettingChange('enableThreatDetection', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Personal Information Detection
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Detect sharing of personal information (PII)
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enablePersonalInfoDetection}
                                    onChange={(e) => handleSettingChange('enablePersonalInfoDetection', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Threshold Settings */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Detection Threshold
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Flag Threshold: {Math.round(settings.flagThreshold * 100)}%
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Content with confidence scores above this threshold will be flagged for review.
                            Lower values = more sensitive detection.
                        </p>
                        <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={settings.flagThreshold}
                            onChange={(e) => handleSettingChange('flagThreshold', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>More Sensitive (10%)</span>
                            <span>Less Sensitive (100%)</span>
                        </div>
                    </div>
                </div>

                {/* Maintenance */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Maintenance
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Cleanup Old Queue Items
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Remove reviewed queue items older than 30 days
                            </p>
                        </div>
                        <button
                            onClick={cleanupOldItems}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                            Cleanup Now
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSaving && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}