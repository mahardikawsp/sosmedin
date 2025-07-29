import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrlFromRequest } from '@/lib/url-utils';

export async function GET(request: NextRequest) {
    // Only allow this in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENV) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const correctedBaseUrl = getBaseUrlFromRequest(request);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const suggestedUrl = host ? `${protocol}://${host}` : 'not available';

    const debugInfo = {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
        VERCEL_URL: process.env.VERCEL_URL || 'not set',
        requestUrl: request.url,
        requestOrigin: request.nextUrl.origin,
        correctedBaseUrl,
        suggestedNextAuthUrl: suggestedUrl,
        headers: {
            host: request.headers.get('host'),
            'x-forwarded-host': request.headers.get('x-forwarded-host'),
            'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        },
        recommendation: `Set NEXTAUTH_URL=${suggestedUrl} and NODE_ENV=production in your environment variables`
    };

    return NextResponse.json(debugInfo);
}