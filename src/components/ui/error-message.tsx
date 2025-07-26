'use client';

import { ReactNode } from 'react';

interface ErrorMessageProps {
    title?: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'error' | 'warning' | 'info';
    className?: string;
    children?: ReactNode;
}

export default function ErrorMessage({
    title = 'Error',
    message,
    action,
    variant = 'error',
    className = '',
    children
}: ErrorMessageProps) {
    const variantStyles = {
        error: {
            container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
            icon: 'text-red-500',
            title: 'text-red-800 dark:text-red-200',
            message: 'text-red-700 dark:text-red-300',
            button: 'bg-red-600 hover:bg-red-700 text-white'
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
            icon: 'text-yellow-500',
            title: 'text-yellow-800 dark:text-yellow-200',
            message: 'text-yellow-700 dark:text-yellow-300',
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        },
        info: {
            container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
            icon: 'text-blue-500',
            title: 'text-blue-800 dark:text-blue-200',
            message: 'text-blue-700 dark:text-blue-300',
            button: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    };

    const styles = variantStyles[variant];

    const getIcon = () => {
        switch (variant) {
            case 'error':
                return (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <div className={`border rounded-lg p-4 ${styles.container} ${className}`}>
            <div className="flex">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                    {getIcon()}
                </div>
                <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${styles.title}`}>
                        {title}
                    </h3>
                    <div className={`mt-1 text-sm ${styles.message}`}>
                        <p>{message}</p>
                        {children}
                    </div>
                    {action && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={action.onClick}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${styles.button}`}
                            >
                                {action.label}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Specific error message components
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
    return (
        <ErrorMessage
            title="Connection Error"
            message="Unable to connect to the server. Please check your internet connection and try again."
            action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
            variant="error"
        />
    );
}

export function NotFoundError({ message = "The requested content could not be found." }: { message?: string }) {
    return (
        <ErrorMessage
            title="Not Found"
            message={message}
            variant="warning"
        />
    );
}

export function UnauthorizedError({ onLogin }: { onLogin?: () => void }) {
    return (
        <ErrorMessage
            title="Authentication Required"
            message="You need to be signed in to access this content."
            action={onLogin ? { label: 'Sign In', onClick: onLogin } : undefined}
            variant="warning"
        />
    );
}

export function ValidationError({ errors }: { errors: string[] }) {
    return (
        <ErrorMessage
            title="Validation Error"
            message="Please correct the following errors:"
            variant="error"
        >
            <ul className="mt-2 list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                ))}
            </ul>
        </ErrorMessage>
    );
}