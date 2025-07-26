'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/hooks/use-session';
import { useRealtimeNotifications } from '@/hooks/use-real-time-notifications';
import { formatDistanceToNow } from 'date-fns';
import { useArrowKeyNavigation } from '@/hooks/use-keyboard-shortcuts';

interface Notification {
    id: string;
    type: string;
    referenceId?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean;
}

export default function NotificationCenter({ isOpen, onClose, isMobile = false }: NotificationCenterProps) {
    const { data: session, isAuthenticated } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationListRef = useRef<HTMLDivElement>(null);

    // Use real-time notifications hook
    const { decrementUnreadCount, resetUnreadCount } = useRealtimeNotifications(
        (newNotification) => {
            console.log('Notification center received real-time notification:', newNotification);
            // Always add new notification to the list, regardless of whether center is open
            setNotifications(prev => [
                {
                    id: newNotification.id,
                    type: newNotification.type,
                    referenceId: newNotification.referenceId,
                    isRead: newNotification.isRead,
                    createdAt: newNotification.createdAt,
                },
                ...prev
            ]);
        }
    );

    // Enable arrow key navigation for notifications
    useArrowKeyNavigation(notificationListRef, 'button[data-notification-id]', {
        orientation: 'vertical',
        onSelect: (element) => {
            element.click();
        }
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Fetch notifications
    const fetchNotifications = async (pageNum = 1, append = false) => {
        if (!isAuthenticated || !session?.user?.id) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/notifications?page=${pageNum}&pageSize=10`);
            if (response.ok) {
                const data = await response.json();
                if (append) {
                    setNotifications(prev => [...prev, ...data.notifications]);
                } else {
                    setNotifications(data.notifications);
                }
                setHasMore(data.pagination.page < data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load notifications when opened
    useEffect(() => {
        if (isOpen && isAuthenticated) {
            setPage(1);
            fetchNotifications(1, false);
        }
    }, [isOpen, isAuthenticated]);

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'PUT',
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId ? { ...notif, isRead: true } : notif
                    )
                );
                decrementUnreadCount();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT',
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, isRead: true }))
                );
                resetUnreadCount();
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Load more notifications
    const loadMore = () => {
        if (!isLoading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, true);
        }
    };

    // Get notification message based on type
    const getNotificationMessage = (notification: Notification) => {
        switch (notification.type) {
            case 'like':
                return 'liked your post';
            case 'follow':
                return 'started following you';
            case 'reply':
                return 'replied to your post';
            default:
                return 'interacted with your content';
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'like':
                return (
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                );
            case 'follow':
                return (
                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case 'reply':
                return (
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                );
        }
    };

    if (!isOpen || !isAuthenticated) return null;

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 sm:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-notifications-title">
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-lg max-h-[80vh] flex flex-col">
                    {/* Mobile Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between" role="banner">
                        <h3 id="mobile-notifications-title" className="text-lg font-medium text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        <div className="flex items-center space-x-2">
                            {notifications.some(n => !n.isRead) && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                                    aria-label="Mark all notifications as read"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                aria-label="Close notifications"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Notifications list */}
                    <div className="flex-1 overflow-y-auto" role="main" aria-label="Notifications list">
                        {isLoading && notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center" role="status" aria-live="polite">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" aria-hidden="true"></div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                <div ref={notificationListRef}>
                                    <ul role="list">
                                        {notifications.map((notification) => (
                                            <li key={notification.id}>
                                                <button
                                                    type="button"
                                                    data-notification-id={notification.id}
                                                    className={`w-full px-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                        }`}
                                                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                                                    aria-label={`${getNotificationMessage(notification)} notification from ${formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}${!notification.isRead ? '. Unread' : ''}`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0" aria-hidden="true">
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-900 dark:text-white">
                                                                Someone {getNotificationMessage(notification)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                <time dateTime={notification.createdAt}>
                                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                                </time>
                                                            </p>
                                                        </div>
                                                        {!notification.isRead && (
                                                            <div className="flex-shrink-0" aria-label="Unread notification">
                                                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Load more button */}
                                {hasMore && (
                                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={loadMore}
                                            disabled={isLoading}
                                            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                                            aria-label="Load more notifications"
                                        >
                                            {isLoading ? 'Loading...' : 'Load more'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desktop-notifications-title"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700" role="banner">
                <div className="flex items-center justify-between">
                    <h3 id="desktop-notifications-title" className="text-lg font-medium text-gray-900 dark:text-white">
                        Notifications
                    </h3>
                    {notifications.some(n => !n.isRead) && (
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                            aria-label="Mark all notifications as read"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto" role="main" aria-label="Notifications list">
                {isLoading && notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center" role="status" aria-live="polite">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" aria-hidden="true"></div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                    </div>
                ) : (
                    <>
                        <div ref={notificationListRef}>
                            <ul role="list">
                                {notifications.map((notification) => (
                                    <li key={notification.id}>
                                        <button
                                            type="button"
                                            data-notification-id={notification.id}
                                            className={`w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                }`}
                                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                                            aria-label={`${getNotificationMessage(notification)} notification from ${formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}${!notification.isRead ? '. Unread' : ''}`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0" aria-hidden="true">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                        Someone {getNotificationMessage(notification)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        <time dateTime={notification.createdAt}>
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </time>
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="flex-shrink-0" aria-label="Unread notification">
                                                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Load more button */}
                        {hasMore && (
                            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                                    aria-label="Load more notifications"
                                >
                                    {isLoading ? 'Loading...' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}