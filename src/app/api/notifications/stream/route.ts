import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addConnection, removeConnection } from '@/lib/notification-service';

/**
 * OPTIONS /api/notifications/stream
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Cache-Control, Authorization, Cookie',
            'Access-Control-Allow-Credentials': 'true',
        },
    });
}

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        console.log('SSE Stream - Session check:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            hasUserId: !!session?.user?.id
        });

        if (!session?.user?.id) {
            console.log('SSE Stream - Authentication failed');
            return new Response('Unauthorized', { status: 401 });
        }

        const userId = session.user.id;
        const encoder = new TextEncoder();
        let heartbeatInterval: NodeJS.Timeout | null = null;

        // Create SSE response stream
        const stream = new ReadableStream({
            start(controller) {
                // Send initial connection message
                controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

                // Create connection object to track this stream
                const connection = {
                    userId,
                    controller,
                    send: (data: string) => {
                        try {
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        } catch {
                            // Connection closed, ignore error
                        }
                    }
                };

                // Add connection to our tracking
                addConnection(userId, connection);

                // Handle connection cleanup
                const cleanup = () => {
                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval);
                        heartbeatInterval = null;
                    }
                    removeConnection(userId, connection);
                    try {
                        controller.close();
                    } catch {
                        // Connection already closed
                    }
                };

                // Clean up on abort
                request.signal.addEventListener('abort', cleanup);

                // Send periodic heartbeat to keep connection alive
                heartbeatInterval = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'));
                    } catch {
                        // Connection closed, clean up
                        cleanup();
                    }
                }, 30000); // Every 30 seconds
            },
            cancel() {
                // Clean up when stream is cancelled
                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    } catch (error) {
        console.error('Error setting up SSE connection:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}