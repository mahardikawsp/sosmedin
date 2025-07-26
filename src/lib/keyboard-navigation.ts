/**
 * Keyboard navigation utilities for accessibility
 */

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    description: string;
    action: () => void;
}

export class KeyboardNavigationManager {
    private shortcuts: Map<string, KeyboardShortcut> = new Map();
    private isEnabled = true;

    constructor() {
        this.handleKeyDown = this.handleKeyDown.bind(this);
        if (typeof window !== 'undefined') {
            document.addEventListener('keydown', this.handleKeyDown);
        }
    }

    /**
     * Register a keyboard shortcut
     */
    registerShortcut(shortcut: KeyboardShortcut): void {
        const key = this.getShortcutKey(shortcut);
        this.shortcuts.set(key, shortcut);
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregisterShortcut(shortcut: Omit<KeyboardShortcut, 'description' | 'action'>): void {
        const key = this.getShortcutKey(shortcut);
        this.shortcuts.delete(key);
    }

    /**
     * Enable or disable keyboard navigation
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Get all registered shortcuts
     */
    getShortcuts(): KeyboardShortcut[] {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Clean up event listeners
     */
    destroy(): void {
        if (typeof window !== 'undefined') {
            document.removeEventListener('keydown', this.handleKeyDown);
        }
        this.shortcuts.clear();
    }

    private getShortcutKey(shortcut: Omit<KeyboardShortcut, 'description' | 'action'>): string {
        const modifiers = [];
        if (shortcut.ctrlKey) modifiers.push('ctrl');
        if (shortcut.altKey) modifiers.push('alt');
        if (shortcut.shiftKey) modifiers.push('shift');
        if (shortcut.metaKey) modifiers.push('meta');

        return [...modifiers, shortcut.key.toLowerCase()].join('+');
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.isEnabled) return;

        // Don't handle shortcuts when user is typing in form elements
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        const shortcutKey = this.getShortcutKey({
            key: event.key,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
        });

        const shortcut = this.shortcuts.get(shortcutKey);
        if (shortcut) {
            event.preventDefault();
            shortcut.action();
        }
    }
}

/**
 * Focus management utilities
 */
export class FocusManager {
    private focusStack: HTMLElement[] = [];

    /**
     * Trap focus within a container
     */
    trapFocus(container: HTMLElement): void {
        const focusableElements = this.getFocusableElements(container);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

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

        container.addEventListener('keydown', handleKeyDown);

        // Store cleanup function
        (container as any).__focusTrapCleanup = () => {
            container.removeEventListener('keydown', handleKeyDown);
        };

        // Focus first element
        firstElement.focus();
    }

    /**
     * Remove focus trap from container
     */
    removeFocusTrap(container: HTMLElement): void {
        const cleanup = (container as any).__focusTrapCleanup;
        if (cleanup) {
            cleanup();
            delete (container as any).__focusTrapCleanup;
        }
    }

    /**
     * Save current focus and focus a new element
     */
    pushFocus(element: HTMLElement): void {
        const currentFocus = document.activeElement as HTMLElement;
        if (currentFocus && currentFocus !== document.body) {
            this.focusStack.push(currentFocus);
        }
        element.focus();
    }

    /**
     * Restore previous focus
     */
    popFocus(): void {
        const previousFocus = this.focusStack.pop();
        if (previousFocus) {
            previousFocus.focus();
        }
    }

    /**
     * Get all focusable elements within a container
     */
    getFocusableElements(container: HTMLElement): HTMLElement[] {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');

        return Array.from(container.querySelectorAll(focusableSelectors))
            .filter((element) => {
                const el = element as HTMLElement;
                return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.hidden;
            }) as HTMLElement[];
    }

    /**
     * Move focus to next focusable element
     */
    focusNext(container?: HTMLElement): void {
        const focusableElements = this.getFocusableElements(container || document.body);
        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex]?.focus();
    }

    /**
     * Move focus to previous focusable element
     */
    focusPrevious(container?: HTMLElement): void {
        const focusableElements = this.getFocusableElements(container || document.body);
        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        const previousIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[previousIndex]?.focus();
    }
}

// Global instances
export const keyboardNavigationManager = new KeyboardNavigationManager();
export const focusManager = new FocusManager();

/**
 * Hook for using keyboard navigation in React components
 */
export function useKeyboardNavigation() {
    return {
        registerShortcut: keyboardNavigationManager.registerShortcut.bind(keyboardNavigationManager),
        unregisterShortcut: keyboardNavigationManager.unregisterShortcut.bind(keyboardNavigationManager),
        getShortcuts: keyboardNavigationManager.getShortcuts.bind(keyboardNavigationManager),
        trapFocus: focusManager.trapFocus.bind(focusManager),
        removeFocusTrap: focusManager.removeFocusTrap.bind(focusManager),
        pushFocus: focusManager.pushFocus.bind(focusManager),
        popFocus: focusManager.popFocus.bind(focusManager),
        focusNext: focusManager.focusNext.bind(focusManager),
        focusPrevious: focusManager.focusPrevious.bind(focusManager),
    };
}