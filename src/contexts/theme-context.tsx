'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'sosmedin-theme',
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const stored = localStorage.getItem(storageKey) as Theme;
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            setThemeState(stored);
        }
    }, [storageKey]);

    // Update resolved theme based on current theme and system preference
    useEffect(() => {
        const updateResolvedTheme = () => {
            if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                setResolvedTheme(systemTheme);
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();

        // Listen for system theme changes when using system theme
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => updateResolvedTheme();

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove previous theme classes
        root.classList.remove('light', 'dark');

        // Add current theme class
        root.classList.add(resolvedTheme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#111827' : '#ffffff');
        }
    }, [resolvedTheme]);

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        setThemeState(newTheme);
    };

    const value = {
        theme,
        setTheme,
        resolvedTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}