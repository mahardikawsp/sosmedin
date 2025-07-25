import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that require authentication
const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    '/posts/create',
    '/notifications',
    '/messages',
    '/explore',
    '/debug'
];

// Paths that are public (no auth required)
const publicPaths = [
    '/',
    '/login',
    '/register',
    '/api/health',
    '/api/auth/csrf',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/providers',
    '/api/auth/callback'
];

// Paths that should redirect authenticated users to dashboard
const authRedirectPaths = [
    '/login',
    '/register'
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get the token from the request
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!token;

    // Check if the path is protected
    const isProtectedPath = protectedPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Check if the path should redirect authenticated users
    const isAuthRedirectPath = authRedirectPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // If user is authenticated and trying to access login/register pages,
    // redirect them to the dashboard
    if (isAuthenticated && isAuthRedirectPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If the path is protected and user is not authenticated, redirect to login
    if (isProtectedPath && !isAuthenticated) {
        const url = new URL('/login', request.url);
        // Store the original URL as a callback URL to redirect after login
        url.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(url);
    }

    // Add user info to headers for server components
    const response = NextResponse.next();

    if (isAuthenticated && token.sub) {
        // Add user ID to headers for server components
        response.headers.set('x-user-id', token.sub as string);

        // Add username if available
        if (token.username) {
            response.headers.set('x-username', token.username as string);
        }
    }

    return response;
}

// Configure the middleware to run on all paths except static files and api routes that don't need auth
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (public assets)
         * - API routes that handle their own authentication
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};