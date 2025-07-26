'use client';

import React from 'react';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === 'system') {
            setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
        } else {
            setTheme(theme === 'dark' ? 'light' : 'dark');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {resolvedTheme === 'dark' ? (
                // Sun icon for light mode
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            ) : (
                // Moon icon for dark mode
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            )}
        </button>
    );
}

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme:
            </label>
            <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
            </select>
        </div>
    );
}