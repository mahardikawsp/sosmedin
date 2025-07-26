import { createNotification } from './notification-utils';

/**
 * Notification service for generating and broadcasting notifications
 */

// Connection interface
interface SSEConnection {
    userId: string;
    controller: ReadableStreamDefaultController;
    send: (data: string) => void;
}

// In-memory store for SSE connections
const connections = new Map<string, Set<SSEConnection>>();

/**
 * Add SSE connection for a user
 */
export function addConnection(userId: string, connection: SSEConnection) {
    if (!connections.has(userId)) {
        connections.set(userId, new Set());
    }
    const userConnections = connections.get(userId);
    if (userConnections) {
        userConnections.add(connection);
        console.log(`SSE Connection added for user ${userId}. Total connections: ${userConnections.size}`);
    }
}

/**
 * Remove SSE connection for a user
 */
export function removeConnection(userId: string, connection: SSEConnection) {
    const userConnections = connections.get(userId);
    if (userConnections) {
        userConnections.delete(connection);
        if (userConnections.size === 0) {
            connections.delete(userId);
        }
    }
}

/**
 * Send notification to user via SSE
 */
function sendNotificationToUser(userId: string, notification: Record<string, unknown>) {
    const userConnections = connections.get(userId);
    console.log(`Attempting to send notification to user ${userId}. Connections found: ${userConnections?.size || 0}`);

    if (userConnections) {
        const data = JSON.stringify(notification);
        console.log(`Sending notification data:`, data);

        // Send to all connections for this user
        userConnections.forEach((connection) => {
            try {
                connection.send(data);
                console.log(`Successfully sent notification to connection for user ${userId}`);
            } catch (error) {
                console.error('Error sending SSE message:', error);
                // Remove failed connection
                userConnections.delete(connection);
            }
        });
    } else {
        console.log(`No active connections found for user ${userId}`);
    }
}

/**
 * Generate and broadcast a like notification
 */
export async function generateLikeNotification(postId: string, postAuthorId: string, likerId: string) {
    try {
        console.log(`Generating like notification: postId=${postId}, postAuthorId=${postAuthorId}, likerId=${likerId}`);

        // Don't notify if user likes their own post
        if (postAuthorId === likerId) {
            console.log('Skipping notification - user liked their own post');
            return;
        }

        // Create notification in database
        const notification = await createNotification({
            type: 'like',
            userId: postAuthorId,
            referenceId: postId,
        });

        console.log('Created notification in database:', notification.id);

        // Send real-time notification
        sendNotificationToUser(postAuthorId, {
            id: notification.id,
            type: 'like',
            referenceId: postId,
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
            message: 'Someone liked your post',
        });

        return notification;
    } catch (error) {
        console.error('Error generating like notification:', error);
        throw error;
    }
}

/**
 * Generate and broadcast a follow notification
 */
export async function generateFollowNotification(followerId: string, followingId: string) {
    try {
        // Create notification in database
        const notification = await createNotification({
            type: 'follow',
            userId: followingId,
            referenceId: followerId,
        });

        // Send real-time notification
        sendNotificationToUser(followingId, {
            id: notification.id,
            type: 'follow',
            referenceId: followerId,
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
            message: 'Someone started following you',
        });

        return notification;
    } catch (error) {
        console.error('Error generating follow notification:', error);
        throw error;
    }
}

/**
 * Generate and broadcast a reply notification
 */
export async function generateReplyNotification(postId: string, postAuthorId: string, replierId: string) {
    try {
        // Don't notify if user replies to their own post
        if (postAuthorId === replierId) {
            return;
        }

        // Create notification in database
        const notification = await createNotification({
            type: 'reply',
            userId: postAuthorId,
            referenceId: postId,
        });

        // Send real-time notification
        sendNotificationToUser(postAuthorId, {
            id: notification.id,
            type: 'reply',
            referenceId: postId,
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
            message: 'Someone replied to your post',
        });

        return notification;
    } catch (error) {
        console.error('Error generating reply notification:', error);
        throw error;
    }
}

/**
 * Get active connection count for debugging
 */
export function getConnectionCount(): number {
    let total = 0;
    connections.forEach((userConnections) => {
        total += userConnections.size;
    });
    return total;
}

/**
 * Get connected users count for debugging
 */
export function getConnectedUsersCount(): number {
    return connections.size;
}