'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function DebugPage() {
    const { data: session, status } = useSession();
    const [sessionData, setSessionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSessionData() {
            try {
                const response = await fetch('/api/auth/session');
                const data = await response.json();
                setSessionData(data);
            } catch (err) {
                setError('Failed to fetch session data');
                console.error(err);
            }
        }

        fetchSessionData();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Session Status</h2>
                <p className="mb-2">Current status: <span className="font-mono">{status}</span></p>
                {session ? (
                    <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Session Data:</h3>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs">
                            {JSON.stringify(session, null, 2)}
                        </pre>
                    </div>
                ) : (
                    <p className="text-yellow-600 dark:text-yellow-400">No active session</p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">API Session Endpoint</h2>
                {error ? (
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                ) : sessionData ? (
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs">
                        {JSON.stringify(sessionData, null, 2)}
                    </pre>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">Loading session data...</p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Environment</h2>
                <p className="mb-2">NEXTAUTH_URL: <span className="font-mono">{process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set'}</span></p>
                <p className="mb-2">NODE_ENV: <span className="font-mono">{process.env.NODE_ENV}</span></p>
            </div>
        </div>
    );
}
