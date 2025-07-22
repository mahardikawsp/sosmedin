import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth-utils';
import { z } from 'zod';
import { cookies } from 'next/headers';

// Validation schema for login
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request data
        const validationResult = loginSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { email, password } = validationResult.data;

        // Authenticate user
        const { user, token } = await authenticateUser(email, password);

        // Set authentication cookie
        const cookieStore = cookies();
        cookieStore.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        // Return success response
        return NextResponse.json({
            message: 'Login successful',
            user
        });
    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && error.message === 'Invalid email or password') {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Handle unexpected errors
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Failed to authenticate user' },
            { status: 500 }
        );
    }
}