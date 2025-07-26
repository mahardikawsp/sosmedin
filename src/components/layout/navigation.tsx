'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from '@/hooks/use-session';
import NotificationIndicator from '@/components/notifications/notification-indicator';
import NotificationCenter from '@/components/notifications/notification-center';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Navigation() {
    const pathname = usePathname();
    const { data: session, isAuthenticated, isLoading } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSignOut = async () => {
        setIsMenuOpen(false); // Close menu immediately
        try {
            // Clear any local storage or session storage
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
            }

            await signOut({
                callbackUrl: '/',
                redirect: false // Don't redirect automatically
            });

            // Force navigation to home page
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out error:', error);
            // Force page refresh as fallback
            window.location.href = '/';
        }
    };

    // Don't render authenticated content if loading or not authenticated
    const showAuthenticatedContent = isAuthenticated && !isLoading && session?.user && session.user.id;

    // Close menu when authentication state changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [isAuthenticated]);



    const navItems = [
        { name: 'Feed', href: '/feed', requiresAuth: true },
        { name: 'Explore', href: '/explore', requiresAuth: true },
        { name: 'Search', href: '/search', requiresAuth: true },
        { name: 'Profile', href: `/profile/${session?.user?.username || ''}`, requiresAuth: true },
    ];

    return (
        <nav
            key={`nav-${isAuthenticated}-${session?.user?.id || 'anonymous'}`}
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                Sosmedin
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map((item) => {
                                if (!showAuthenticatedContent && item.requiresAuth) return null;

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`${pathname === item.href
                                            ? 'border-blue-500 text-gray-900 dark:text-white'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                                            } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {showAuthenticatedContent ? (
                            <div className="flex items-center space-x-4">
                                {/* Theme toggle */}
                                <ThemeToggle />

                                {/* Notification indicator */}
                                <div className="relative">
                                    <NotificationIndicator
                                        onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                                    />
                                    <NotificationCenter
                                        isOpen={isNotificationCenterOpen}
                                        onClose={() => setIsNotificationCenterOpen(false)}
                                    />
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        className="flex rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        id="user-menu-button"
                                        aria-expanded={isMenuOpen}
                                        aria-haspopup="true"
                                        onClick={toggleMenu}
                                    >
                                        <span className="sr-only">Open user menu</span>
                                        {session?.user?.image ? (
                                            <img
                                                className="h-8 w-8 rounded-full"
                                                src={session.user.image}
                                                alt={session.user.name || 'User'}
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                <span className="text-blue-600 dark:text-blue-300 font-medium">
                                                    {session?.user?.name?.[0] || 'U'}
                                                </span>
                                            </div>
                                        )}
                                    </button>

                                    {isMenuOpen && (
                                        <div
                                            className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                            role="menu"
                                            aria-orientation="vertical"
                                            aria-labelledby="user-menu-button"
                                            tabIndex={-1}
                                        >
                                            <Link
                                                href={`/profile/${session?.user?.username || ''}`}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                role="menuitem"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Your Profile
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                role="menuitem"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Settings
                                            </Link>
                                            <button
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                role="menuitem"
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    handleSignOut();
                                                }}
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : !isLoading ? (
                            <div className="flex items-center space-x-4">
                                {/* Theme toggle for non-authenticated users */}
                                <ThemeToggle />

                                <Link
                                    href="/login"
                                    className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Sign up
                                </Link>
                            </div>
                        ) : null}
                    </div>
                    {/* Only show mobile menu button if there's content to show */}
                    {(showAuthenticatedContent || (!isLoading && !isAuthenticated)) && (
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-200 hover:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                aria-controls="mobile-menu"
                                aria-expanded={isMenuOpen}
                                onClick={toggleMenu}
                            >
                                <span className="sr-only">Open main menu</span>
                                {!isMenuOpen ? (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isMenuOpen && (
                <div className="sm:hidden" id="mobile-menu">
                    <div className="pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            if (!showAuthenticatedContent && item.requiresAuth) return null;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${pathname === item.href
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                                        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                        {showAuthenticatedContent ? (
                            <>
                                <div className="flex items-center px-4">
                                    {session?.user?.image ? (
                                        <div className="flex-shrink-0">
                                            <img
                                                className="h-10 w-10 rounded-full"
                                                src={session.user.image}
                                                alt={session.user.name || 'User'}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <span className="text-blue-600 dark:text-blue-300 font-medium">
                                                {session?.user?.name?.[0] || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800 dark:text-white">
                                            {session?.user?.name}
                                        </div>
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {session?.user?.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <Link
                                        href={`/profile/${session?.user?.username || ''}`}
                                        className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Your Profile
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                    <div className="flex items-center justify-between px-4 py-2">
                                        <span className="text-base font-medium text-gray-500 dark:text-gray-300">Theme</span>
                                        <ThemeToggle />
                                    </div>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            handleSignOut();
                                        }}
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </>
                        ) : !isLoading ? (
                            <div className="mt-3 space-y-1">
                                <Link
                                    href="/login"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/register"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign up
                                </Link>
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-base font-medium text-gray-500 dark:text-gray-300">Theme</span>
                                    <ThemeToggle />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </nav>
    );
}