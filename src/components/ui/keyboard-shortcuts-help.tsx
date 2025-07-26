'use client';

import { useState, useRef, useEffect } from 'react';
import { keyboardNavigationManager } from '@/lib/keyboard-navigation';
import { useFocusTrap } from '@/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
    const [shortcuts, setShortcuts] = useState(keyboardNavigationManager.getShortcuts());
    const dialogRef = useRef<HTMLDivElement>(null);

    // Use focus trap when dialog is open
    useFocusTrap(isOpen, dialogRef);

    // Update shortcuts when they change
    useEffect(() => {
        if (isOpen) {
            setShortcuts(keyboardNavigationManager.getShortcuts());
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formatShortcut = (shortcut: any) => {
        const keys = [];
        if (shortcut.ctrlKey) keys.push('Ctrl');
        if (shortcut.altKey) keys.push('Alt');
        if (shortcut.shiftKey) keys.push('Shift');
        if (shortcut.metaKey) keys.push('Cmd');
        keys.push(shortcut.key.toUpperCase());
        return keys.join(' + ');
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
        >
            <div
                ref={dialogRef}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
                <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 id="shortcuts-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                            Keyboard Shortcuts
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label="Close keyboard shortcuts help"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="px-6 py-4">
                    {shortcuts.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            No keyboard shortcuts are currently available.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Use these keyboard shortcuts to navigate the application more efficiently:
                            </div>

                            <dl className="space-y-3">
                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <dt className="text-sm text-gray-900 dark:text-white">
                                            {shortcut.description}
                                        </dt>
                                        <dd className="ml-4">
                                            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                                                {formatShortcut(shortcut)}
                                            </kbd>
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    General Navigation
                                </h3>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Navigate between elements</dt>
                                        <dd>
                                            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                                                Tab
                                            </kbd>
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Navigate backwards</dt>
                                        <dd>
                                            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                                                Shift + Tab
                                            </kbd>
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Activate button/link</dt>
                                        <dd>
                                            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                                                Enter
                                            </kbd>
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Close dialog/menu</dt>
                                        <dd>
                                            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                                                Escape
                                            </kbd>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}