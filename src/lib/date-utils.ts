/**
 * Simple date utilities to replace date-fns dependency
 */

/**
 * Format distance to now (similar to date-fns formatDistanceToNow)
 */
export function formatDistanceToNow(date: Date | string): string {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    } else if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
    } else if (diffInMonths < 12) {
        return `${diffInMonths}mo ago`;
    } else {
        return `${diffInYears}y ago`;
    }
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const targetDate = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
        case 'short':
            return targetDate.toLocaleDateString();
        case 'long':
            return targetDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'time':
            return targetDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });
        default:
            return targetDate.toLocaleDateString();
    }
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    return targetDate.toDateString() === today.toDateString();
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return targetDate.toDateString() === yesterday.toDateString();
}

/**
 * Get relative time string (Today, Yesterday, or date)
 */
export function getRelativeTimeString(date: Date | string): string {
    if (isToday(date)) {
        return 'Today';
    } else if (isYesterday(date)) {
        return 'Yesterday';
    } else {
        return formatDate(date, 'short');
    }
}