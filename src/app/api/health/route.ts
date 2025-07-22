import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/lib/db-utils';

/**
 * Health check endpoint to verify system status
 * GET /api/health
 */
export async function GET() {
    try {
        // Check database connection
        const dbHealth = await getDatabaseHealth();

        return NextResponse.json({
            status: dbHealth.status === 'healthy' ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealth,
            },
        });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                message: 'Health check failed',
                error: (error as Error).message,
            },
            { status: 500 }
        );
    }
}