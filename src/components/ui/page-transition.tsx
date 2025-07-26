'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { usePathname } from 'next/navigation';
import { performanceMonitor } from '@/lib/performance-utils';

interface PageTransitionProps {
    children: React.ReactNode;
}

const PageTransition = memo<PageTransitionProps>(({ children }) => {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [displayChildren, setDisplayChildren] = useState(children);

    const handleTransition = useCallback(() => {
        performanceMonitor.startTiming('page-transition');
        setIsLoading(true);

        // Use requestAnimationFrame for smoother transitions
        const animationFrame = requestAnimationFrame(() => {
            setDisplayChildren(children);

            // Use a shorter timeout for better perceived performance
            const timer = setTimeout(() => {
                setIsLoading(false);
                performanceMonitor.endTiming('page-transition');
            }, 100);

            return () => clearTimeout(timer);
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [children]);

    useEffect(() => {
        const cleanup = handleTransition();
        return cleanup;
    }, [handleTransition]);

    return (
        <div className="relative min-h-screen">
            <div
                className={`transition-all duration-200 ease-out ${isLoading
                        ? 'opacity-0 transform translate-y-1'
                        : 'opacity-100 transform translate-y-0'
                    }`}
                style={{
                    willChange: isLoading ? 'opacity, transform' : 'auto'
                }}
            >
                {displayChildren}
            </div>

            {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;