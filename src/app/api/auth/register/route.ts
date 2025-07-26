import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth-utils';
import { z } from 'zod';

// Define validation schema for registration
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    displayName: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request body
        const validationResult = registerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, username, password, displayName } = validationResult.data;

        // Create user
        const user = await createUser({
            email,
            username,
            password,
            displayName,
        });

        // Return success response
        return NextResponse.json(
            {
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.displayName,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        // Handle known errors
        if (error.message === 'Email already in use' || error.message === 'Username already taken') {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        // Log unexpected errors
        console.error('Registration error:', error);

        // Return generic error
        return NextResponse.json(
            { error: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}