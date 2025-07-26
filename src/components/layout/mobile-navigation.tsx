'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import NotificationIndicator from '@/components/notifications/notification-indicator';
import NotificationCenter from '@/components/notifications/notification-center';

export default function MobileNavigation() {
    const pathname = usePathname();
    const { data: session, isAuthenticated } = useSession();
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

    // Don't show on auth pages
    if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
        return null;
    }

    // Don't show if not authenticated
    if (!isAuthenticated || !session?.user) {
        return null;
    }

    const navItems = [
        {
            name: 'Home',
            href: '/feed',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            name: 'Explore',
            href: '/explore',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        },
        {
            name: 'Search',
            href: '/search',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        },
        {
            name: 'Profile',
            href: `/profile/${session.user.username}`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ];

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:hidden z-50">
                <div className="flex justify-around items-center py-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${pathname === item.href
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            {item.icon}
                            <span className="text-xs mt-1">{item.name}</span>
                        </Link>
                    ))}

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isNotificationCenterOpen
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <NotificationIndicator showBadgeOnly />
                            <span className="text-xs mt-1">Alerts</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Center */}
            <NotificationCenter
                isOpen={isNotificationCenterOpen}
                onClose={() => setIsNotificationCenterOpen(false)}
                isMobile={true}
            />

            {/* Bottom padding to prevent content from being hidden behind the navigation */}
            <div className="h-16 sm:hidden" />
        </>
    );
}