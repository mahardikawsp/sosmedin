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

    // Server-side: try environment variables in order of preference

    // 1. Explicit NEXTAUTH_URL (highest priority)
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // 2. Vercel deployment URL
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // 3. Railway deployment URL
    if (process.env.RAILWAY_STATIC_URL) {
        return `https://${process.env.RAILWAY_STATIC_URL}`;
    }

    // 4. Netlify deployment URL
    if (process.env.URL) {
        return process.env.URL;
    }

    // 5. Generic deployment URL patterns
    if (process.env.DEPLOY_URL) {
        return process.env.DEPLOY_URL;
    }

    // 6. Fallback to hardcoded domain for nginx proxy
    if (process.env.NODE_ENV === 'production') {
        return 'https://avvhvzvndubd.ap-southeast-1.clawcloudrun.com';
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
 * Gets the base URL from request headers (server-side only)
 * @param request - The NextRequest object
 * @returns The base URL constructed from request headers
 */
export function getBaseUrlFromRequest(request?: any): string {
    if (!request) {
        return getBaseUrl();
    }

    // Try to get the URL from request headers (prioritize forwarded headers)
    const host = request.headers?.get?.('x-forwarded-host') ||
        request.headers?.get?.('host') ||
        request.headers?.host ||
        request.headers?.['x-forwarded-host'];

    const protocol = request.headers?.get?.('x-forwarded-proto') ||
        request.headers?.['x-forwarded-proto'] ||
        (host?.includes('localhost') ? 'http' : 'https');

    // If we have a valid host and it's not localhost, use it
    if (host && !host.includes('localhost')) {
        return `${protocol}://${host}`;
    }

    return getBaseUrl();
}

/**
 * Creates a proper callback URL with the correct domain
 * @param path - The path to redirect to after authentication
 * @param request - Optional request object for server-side URL detection
 * @returns A fully qualified URL
 */
export function createCallbackUrlFromRequest(path: string, request?: any): string {
    const baseUrl = getBaseUrlFromRequest(request);

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