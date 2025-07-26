'use client';

import { ReactNode } from 'react';

interface LoadingSkeletonProps {
    className?: string;
    children?: ReactNode;
}

export function LoadingSkeleton({ className = '', children }: LoadingSkeletonProps) {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
            {children}
        </div>
    );
}

export function PostSkeleton() {
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                    <LoadingSkeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <LoadingSkeleton className="h-4 w-24" />
                        <LoadingSkeleton className="h-4 w-16" />
                        <LoadingSkeleton className="h-4 w-12" />
                    </div>
                    <div className="space-y-1">
                        <LoadingSkeleton className="h-4 w-full" />
                        <LoadingSkeleton className="h-4 w-3/4" />
                        <LoadingSkeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                        <LoadingSkeleton className="h-4 w-12" />
                        <LoadingSkeleton className="h-4 w-12" />
                        <LoadingSkeleton className="h-4 w-12" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function UserSkeleton() {
    return (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <LoadingSkeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <LoadingSkeleton className="h-4 w-32" />
                    <LoadingSkeleton className="h-3 w-24" />
                    <LoadingSkeleton className="h-3 w-48" />
                </div>
                <LoadingSkeleton className="h-8 w-20 rounded-md" />
            </div>
        </div>
    );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-0">
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} />
            ))}
        </div>
    );
}

export function SearchSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-4 mb-6">
                <LoadingSkeleton className="h-8 w-16 rounded-md" />
                <LoadingSkeleton className="h-8 w-16 rounded-md" />
                <LoadingSkeleton className="h-8 w-16 rounded-md" />
            </div>
            <div className="space-y-0">
                {Array.from({ length: 3 }).map((_, i) => (
                    <UserSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}