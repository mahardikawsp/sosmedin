'use client';

import { useSession } from 'next-auth/react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { status } = useSession();

    // Show loading state while checking session
    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Render children regardless of authentication status
    // The pages themselves will handle redirects if needed
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {children}
        </div>
    );
}