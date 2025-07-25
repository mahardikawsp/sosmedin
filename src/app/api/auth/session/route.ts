import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Get the current session
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 200 });
        }

        // Return session data
        return NextResponse.json({
            authenticated: true,
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                username: (session.user as any).username,
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'An error occurred while fetching session' },
            { status: 500 }
        );
    }
}