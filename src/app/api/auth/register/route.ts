import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth-utils';
import { z } from 'zod';

// Validation schema for registration
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    displayName: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request data
        const validationResult = registerSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { email, password, username, displayName } = validationResult.data;

        // Create user
        const user = await createUser({
            email,
            password,
            username,
            displayName,
        });

        // Return success response
        return NextResponse.json(
            {
                message: 'User registered successfully',
                user
            },
            { status: 201 }
        );
    } catch (error) {
        // Handle specific errors
        if (error instanceof Error) {
            if (error.message === 'Email already in use' || error.message === 'Username already taken') {
                return NextResponse.json(
                    { error: error.message },
                    { status: 409 } // Conflict
                );
            }
        }

        // Handle unexpected errors
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Failed to register user' },
            { status: 500 }
        );
    }
}