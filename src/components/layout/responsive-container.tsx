'use client';

import { ReactNode } from 'react';

interface ResponsiveContainerProps {
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
}

export default function ResponsiveContainer({
    children,
    maxWidth = 'lg',
    padding = 'md',
    className = ''
}: ResponsiveContainerProps) {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
        full: 'max-w-full'
    };

    const paddingClasses = {
        none: '',
        sm: 'px-2 sm:px-4',
        md: 'px-4 sm:px-6',
        lg: 'px-4 sm:px-6 lg:px-8'
    };

    return (
        <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}>
            {children}
        </div>
    );
}