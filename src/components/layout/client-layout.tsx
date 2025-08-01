'use client';

import { usePathname } from 'next/navigation';
import Navigation from './navigation';
import MobileNavigation from './mobile-navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex flex-col">
            {/* Only show navigation on non-auth pages */}
            {!pathname?.startsWith('/login') && !pathname?.startsWith('/register') && (
                <header role="banner">
                    <Navigation />
                </header>
            )}
            <main
                id="main-content"
                className="flex-grow pb-16 sm:pb-0"
                role="main"
                tabIndex={-1}
            >
                {children}
            </main>
            <footer
                className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 hidden sm:block"
                role="contentinfo"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} Sosmedin. All rights reserved.
                    </p>
                </div>
            </footer>
            {/* Mobile Navigation */}
            <MobileNavigation />
        </div>
    );
}