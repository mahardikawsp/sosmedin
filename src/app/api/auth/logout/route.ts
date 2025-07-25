import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Get the current session
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'No active session' }, { status: 200 });
        }

        // Return success response
        // Note: The actual session destruction happens in the client using signOut()
        return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'An error occurred during logout' },
            { status: 500 }
        );
    }
}