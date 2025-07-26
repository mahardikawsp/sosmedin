import { useEffect, useRef } from 'react';
import { keyboardNavigationManager, type KeyboardShortcut } from '@/lib/keyboard-navigation';

/**
 * Hook for registering keyboard shortcuts in React components
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const shortcutsRef = useRef<KeyboardShortcut[]>([]);

    useEffect(() => {
        // Register new shortcuts
        shortcuts.forEach(shortcut => {
            keyboardNavigationManager.registerShortcut(shortcut);
        });

        // Store current shortcuts for cleanup
        shortcutsRef.current = shortcuts;

        // Cleanup function
        return () => {
            shortcutsRef.current.forEach(shortcut => {
                keyboardNavigationManager.unregisterShortcut(shortcut);
            });
        };
    }, [shortcuts]);
}

/**
 * Hook for managing focus trapping in modals/dialogs
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;

        // Get focusable elements
        const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        // Store the previously focused element
        const previouslyFocused = document.activeElement as HTMLElement;

        // Focus the first element
        firstElement.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                // This should be handled by the component that uses this hook
                // by listening for escape key and closing the modal
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleEscape);

        // Cleanup
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keydown', handleEscape);

            // Restore focus to previously focused element
            if (previouslyFocused && previouslyFocused.focus) {
                previouslyFocused.focus();
            }
        };
    }, [isActive, containerRef]);
}

/**
 * Hook for handling arrow key navigation in lists
 */
export function useArrowKeyNavigation(
    containerRef: React.RefObject<HTMLElement>,
    itemSelector: string,
    options: {
        loop?: boolean;
        orientation?: 'vertical' | 'horizontal' | 'both';
        onSelect?: (element: HTMLElement) => void;
    } = {}
) {
    const { loop = true, orientation = 'vertical', onSelect } = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
            if (items.length === 0) return;

            const currentIndex = items.indexOf(document.activeElement as HTMLElement);
            let nextIndex = currentIndex;

            switch (event.key) {
                case 'ArrowDown':
                    if (orientation === 'vertical' || orientation === 'both') {
                        event.preventDefault();
                        nextIndex = currentIndex + 1;
                        if (nextIndex >= items.length) {
                            nextIndex = loop ? 0 : items.length - 1;
                        }
                    }
                    break;

                case 'ArrowUp':
                    if (orientation === 'vertical' || orientation === 'both') {
                        event.preventDefault();
                        nextIndex = currentIndex - 1;
                        if (nextIndex < 0) {
                            nextIndex = loop ? items.length - 1 : 0;
                        }
                    }
                    break;

                case 'ArrowRight':
                    if (orientation === 'horizontal' || orientation === 'both') {
                        event.preventDefault();
                        nextIndex = currentIndex + 1;
                        if (nextIndex >= items.length) {
                            nextIndex = loop ? 0 : items.length - 1;
                        }
                    }
                    break;

                case 'ArrowLeft':
                    if (orientation === 'horizontal' || orientation === 'both') {
                        event.preventDefault();
                        nextIndex = currentIndex - 1;
                        if (nextIndex < 0) {
                            nextIndex = loop ? items.length - 1 : 0;
                        }
                    }
                    break;

                case 'Home':
                    event.preventDefault();
                    nextIndex = 0;
                    break;

                case 'End':
                    event.preventDefault();
                    nextIndex = items.length - 1;
                    break;

                case 'Enter':
                case ' ':
                    if (onSelect && document.activeElement) {
                        event.preventDefault();
                        onSelect(document.activeElement as HTMLElement);
                    }
                    break;

                default:
                    return;
            }

            if (nextIndex !== currentIndex && items[nextIndex]) {
                items[nextIndex].focus();
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [containerRef, itemSelector, loop, orientation, onSelect]);
}