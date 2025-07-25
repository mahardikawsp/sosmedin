'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
    const { data: session, status } = useSession();
    
    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/login?callbackUrl=/dashboard');
        }
    }, [status]);

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect in the useEffect
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Welcome, {session?.user?.name || 'User'}!</h1>
                <p className="text-gray-600 dark:text-gray-400">This is your dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Your Feed</h2>
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Your feed will appear here once you start following people.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Profile</h2>
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                {session?.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="h-12 w-12 rounded-full"
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {session?.user?.name?.[0] || 'U'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="font-medium">{session?.user?.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    @{(session?.user as any)?.username || 'username'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Suggested Users</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Suggestions will appear here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}