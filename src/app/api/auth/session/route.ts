import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    try {
        // Get the auth token from cookies
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        // Verify the token
        const decoded = verifyToken(token);

        if (!decoded || !decoded.id) {
            // Clear invalid token
            cookieStore.delete('auth_token');

            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        // Get user data
        const user = await getUserById(decoded.id);

        if (!user) {
            // User not found, clear token
            cookieStore.delete('auth_token');

            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        // Return user session data
        return NextResponse.json({
            authenticated: true,
            user
        });
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'Failed to get session' },
            { status: 500 }
        );
    }
}