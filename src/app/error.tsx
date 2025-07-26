'use client';

import { useEffect } from 'react';
import ErrorMessage from '@/components/ui/error-message';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    const getErrorMessage = () => {
        if (error.message.includes('fetch')) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        if (error.message.includes('404')) {
            return 'The requested page could not be found.';
        }
        if (error.message.includes('401') || error.message.includes('403')) {
            return 'You are not authorized to access this page.';
        }
        return 'An unexpected error occurred. Please try again.';
    };

    const getErrorTitle = () => {
        if (error.message.includes('fetch')) {
            return 'Connection Error';
        }
        if (error.message.includes('404')) {
            return 'Page Not Found';
        }
        if (error.message.includes('401') || error.message.includes('403')) {
            return 'Access Denied';
        }
        return 'Something went wrong';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <ErrorMessage
                    title={getErrorTitle()}
                    message={getErrorMessage()}
                    action={{
                        label: 'Try Again',
                        onClick: reset
                    }}
                    variant="error"
                >
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            <summary className="cursor-pointer font-medium">Error Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap text-red-600 dark:text-red-400">
                                {error.toString()}
                            </pre>
                        </details>
                    )}
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                            Go Home
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                            Reload Page
                        </button>
                    </div>
                </ErrorMessage>
            </div>
        </div>
    );
}