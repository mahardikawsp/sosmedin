import { lazy } from 'react';
import { LoadingSkeleton } from '../ui/loading-skeleton';

// Lazy load heavy components
export const LazyNotificationCenter = lazy(() =>
    import('../notifications/notification-center')
);

export const LazyNotificationSettings = lazy(() =>
    import('../notifications/notification-settings')
);

export const LazyThreadedReplies = lazy(() =>
    import('../conversations/ThreadedReplies')
);

export const LazyReplyChain = lazy(() =>
    import('../conversations/ReplyChain')
);

// Default loading component for lazy components
export const LazyComponentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-[100px]">
        {children}
    </div>
);

// Fallback component for lazy loading
export const LazyLoadingFallback = () => (
    <div className="space-y-4">
        <LoadingSkeleton className="h-8 w-full" />
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
    </div>
);