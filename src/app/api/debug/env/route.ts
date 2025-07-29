import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Only allow this in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENV) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const debugInfo = {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
        VERCEL_URL: process.env.VERCEL_URL || 'not set',
        requestUrl: request.url,
        requestOrigin: request.nextUrl.origin,
        headers: {
            host: request.headers.get('host'),
            'x-forwarded-host': request.headers.get('x-forwarded-host'),
            'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        }
    };

    return NextResponse.json(debugInfo);
}