import { NextResponse } from 'next/server';
import { getConnectionCount, getConnectedUsersCount } from '@/lib/notification-service';

/**
 * GET /api/notifications/debug
 * Debug endpoint to check SSE connection status
 */
export async function GET() {
    return NextResponse.json({
        totalConnections: getConnectionCount(),
        connectedUsers: getConnectedUsersCount(),
        timestamp: new Date().toISOString(),
    });
}