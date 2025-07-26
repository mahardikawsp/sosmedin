'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [displayChildren, setDisplayChildren] = useState(children);

    useEffect(() => {
        setIsLoading(true);

        const timer = setTimeout(() => {
            setDisplayChildren(children);
            setIsLoading(false);
        }, 150);

        return () => clearTimeout(timer);
    }, [pathname, children]);

    return (
        <div className="relative">
            <div
                className={`transition-opacity duration-150 ${isLoading ? 'opacity-0' : 'opacity-100'
                    }`}
            >
                {displayChildren}
            </div>

            {isLoading && (
                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
}