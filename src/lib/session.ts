import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';
import { Session } from 'next-auth';

/**
 * Gets the current session on the server side
 * @returns The session object or null if not authenticated
 */
export async function getSession() {
    return await getServerSession(authOptions);
}

/**
 * Validates that a user is authenticated on the server side
 * Redirects to login if not authenticated
 * @param redirectTo Optional path to redirect to after login
 * @returns The session object
 */
export async function validateSession(redirectTo?: string): Promise<Session> {
    const session = await getSession();

    if (!session?.user) {
        const redirectPath = redirectTo ? `/login?callbackUrl=${encodeURIComponent(redirectTo)}` : '/login';
        redirect(redirectPath);
    }

    return session;
}

/**
 * Checks if a user is authenticated on the server side without redirecting
 * @returns Boolean indicating if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return !!session?.user;
}

/**
 * Gets the current user ID from the session
 * @returns The user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
    const session = await getSession();
    return session?.user?.id || null;
}

/**
 * Validates that the current user has access to a specific resource
 * @param resourceUserId The user ID associated with the resource
 * @param allowAdmin Whether to allow admin users access regardless of ownership
 * @returns Boolean indicating if the user has access
 */
export async function validateResourceAccess(
    resourceUserId: string,
    allowAdmin: boolean = false
): Promise<boolean> {
    const session = await getSession();

    if (!session?.user) {
        return false;
    }

    // Check if the resource belongs to the current user
    if (session.user.id === resourceUserId) {
        return true;
    }

    // Check for admin access if allowed
    if (allowAdmin && (session.user as any).role === 'ADMIN') {
        return true;
    }

    return false;
}