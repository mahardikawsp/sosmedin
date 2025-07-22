import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        // Get the cookie store
        const cookieStore = cookies();

        // Delete the auth token cookie
        cookieStore.delete('auth_token');

        // Return success response
        return NextResponse.json(
            { message: 'Logout successful' },
            { status: 200 }
        );
    } catch (error) {
        // Handle unexpected errors
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        );
    }
}