/**
 * Utility functions for handling URLs in different environments
 */

/**
 * Gets the correct base URL for the application
 * Works in both server and client environments
 */
export function getBaseUrl(): string {
    // Client-side: use window.location.origin
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // Server-side: try environment variables
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // For Vercel deployments
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // For other cloud platforms
    if (process.env.NODE_ENV === 'production') {
        // You can add other platform-specific URL detection here
        throw new Error('Production base URL not configured. Set NEXTAUTH_URL environment variable.');
    }

    // Development fallback
    return 'http://localhost:3000';
}

/**
 * Creates a proper callback URL with the correct domain
 * @param path - The path to redirect to after authentication
 * @returns A fully qualified URL
 */
export function createCallbackUrl(path: string): string {
    const baseUrl = getBaseUrl();

    // If path is already absolute, return as-is if it matches our domain
    if (path.startsWith('http')) {
        if (path.startsWith(baseUrl)) {
            return path;
        }
        // If it's an external URL, redirect to dashboard instead
        return `${baseUrl}/dashboard`;
    }

    // If path is relative, make it absolute
    if (path.startsWith('/')) {
        return `${baseUrl}${path}`;
    }

    // If path doesn't start with /, add it
    return `${baseUrl}/${path}`;
}

/**
 * Creates a login URL with proper callback
 * @param callbackPath - The path to redirect to after login
 * @returns A login URL with callback parameter
 */
export function createLoginUrl(callbackPath?: string): string {
    const baseUrl = getBaseUrl();
    const loginUrl = `${baseUrl}/login`;

    if (!callbackPath) {
        return loginUrl;
    }

    const callbackUrl = createCallbackUrl(callbackPath);
    return `${loginUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}