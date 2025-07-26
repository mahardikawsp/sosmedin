'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
    id: string;
    title?: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((message: string, title?: string) => {
        addToast({ type: 'success', message, title });
    }, [addToast]);

    const error = useCallback((message: string, title?: string) => {
        addToast({ type: 'error', message, title, duration: 7000 });
    }, [addToast]);

    const warning = useCallback((message: string, title?: string) => {
        addToast({ type: 'warning', message, title });
    }, [addToast]);

    const info = useCallback((message: string, title?: string) => {
        addToast({ type: 'info', message, title });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{
            toasts,
            addToast,
            removeToast,
            success,
            error,
            warning,
            info
        }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const typeStyles = {
        success: {
            container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
            icon: 'text-green-500',
            title: 'text-green-800 dark:text-green-200',
            message: 'text-green-700 dark:text-green-300'
        },
        error: {
            container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
            icon: 'text-red-500',
            title: 'text-red-800 dark:text-red-200',
            message: 'text-red-700 dark:text-red-300'
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
            icon: 'text-yellow-500',
            title: 'text-yellow-800 dark:text-yellow-200',
            message: 'text-yellow-700 dark:text-yellow-300'
        },
        info: {
            container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
            icon: 'text-blue-500',
            title: 'text-blue-800 dark:text-blue-200',
            message: 'text-blue-700 dark:text-blue-300'
        }
    };

    const styles = typeStyles[toast.type];

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        <div className={`border rounded-lg p-4 shadow-lg animate-slide-in-down ${styles.container}`}>
            <div className="flex">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                    {getIcon()}
                </div>
                <div className="ml-3 flex-1">
                    {toast.title && (
                        <h3 className={`text-sm font-medium ${styles.title}`}>
                            {toast.title}
                        </h3>
                    )}
                    <p className={`text-sm ${toast.title ? 'mt-1' : ''} ${styles.message}`}>
                        {toast.message}
                    </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`inline-flex rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${styles.icon}`}
                    >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}