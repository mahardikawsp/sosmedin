'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-session';
import { useRealtimeNotifications } from '@/hooks/use-real-time-notifications';

interface NotificationIndicatorProps {
    onClick: () => void;
    className?: string;
}

export default function NotificationIndicator({ onClick, className = '' }: NotificationIndicatorProps) {
    const { data: session, isAuthenticated } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // Use real-time notifications hook
    const {
        isConnected,
        connectionError,
        unreadCount,
        setUnreadCount
    } = useRealtimeNotifications((notification) => {
        console.log('Notification indicator received real-time notification:', notification);
    });

    // Fetch initial unread notification count
    const fetchUnreadCount = async () => {
        if (!isAuthenticated || !session?.user?.id) return;

        try {
            setIsLoading(true);
            const response = await fetch('/api/notifications?unreadOnly=true&pageSize=1');
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch initial unread count on mount and when authentication changes
    useEffect(() => {
        fetchUnreadCount();
    }, [isAuthenticated, session?.user?.id]);

    // Don't render if not authenticated
    if (!isAuthenticated) return null;

    return (
        <button
            onClick={onClick}
            className={`relative p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md ${className}`}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
            {/* Bell icon */}
            <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>

            {/* Unread count badge */}
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}

            {/* Connection status indicator */}
            {!isConnected && !isLoading && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-3 h-3">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" title={connectionError || 'Connecting...'}></span>
                </span>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
            )}
        </button>
    );
}