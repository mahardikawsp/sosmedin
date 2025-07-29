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



export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path is protected
    const isProtectedPath = protectedPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Check if the path is public
    const isPublicPath = publicPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // If it's a public path, allow access
    if (isPublicPath) {
        return NextResponse.next();
    }

    // For protected paths, check for JWT token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!token;

    // If the path is protected and user is not authenticated, redirect to login
    if (isProtectedPath && !isAuthenticated) {
        // Use the request's origin to ensure we redirect to the correct domain
        const loginUrl = new URL('/login', request.nextUrl.origin);
        // Store the original URL as a callback URL to redirect after login
        loginUrl.searchParams.set('callbackUrl', request.nextUrl.href);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
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
         * - uploads folder (uploaded files)
         * - API routes that handle their own authentication
         */
        '/((?!_next/static|_next/image|favicon.ico|public/|uploads/).*)',
    ],
};