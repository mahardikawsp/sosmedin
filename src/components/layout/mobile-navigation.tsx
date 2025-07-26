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
            <nav
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:hidden z-50"
                aria-label="Mobile navigation"
            >
                <ul className="flex justify-around items-center py-2" role="menubar">
                    {navItems.map((item) => (
                        <li key={item.name} role="none">
                            <Link
                                href={item.href}
                                role="menuitem"
                                aria-current={pathname === item.href ? 'page' : undefined}
                                aria-label={`Navigate to ${item.name}`}
                                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${pathname === item.href
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                                <span className="text-xs mt-1">{item.name}</span>
                            </Link>
                        </li>
                    ))}

                    {/* Notifications */}
                    <li role="none">
                        <button
                            type="button"
                            onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                            role="menuitem"
                            aria-expanded={isNotificationCenterOpen}
                            aria-haspopup="dialog"
                            aria-label="Open notifications"
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isNotificationCenterOpen
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <NotificationIndicator showBadgeOnly />
                            <span className="text-xs mt-1">Alerts</span>
                        </button>
                    </li>
                </ul>
            </nav>

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