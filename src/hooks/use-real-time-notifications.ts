'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from './use-session';

interface RealtimeNotification {
    id: string;
    type: string;
    referenceId?: string;
    isRead: boolean;
    createdAt: string;
    message: string;
}

interface UseRealtimeNotificationsReturn {
    isConnected: boolean;
    connectionError: string | null;
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    incrementUnreadCount: () => void;
    decrementUnreadCount: () => void;
    resetUnreadCount: () => void;
}

export function useRealtimeNotifications(
    onNotification?: (notification: RealtimeNotification) => void
): UseRealtimeNotificationsReturn {
    const { isAuthenticated, isLoading } = useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [unreadCount, setUnreadCountState] = useState(0);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const setUnreadCount = useCallback((count: number) => {
        setUnreadCountState(Math.max(0, count));
    }, []);

    const incrementUnreadCount = useCallback(() => {
        setUnreadCountState(prev => prev + 1);
    }, []);

    const decrementUnreadCount = useCallback(() => {
        setUnreadCountState(prev => Math.max(0, prev - 1));
    }, []);

    const resetUnreadCount = useCallback(() => {
        setUnreadCountState(0);
    }, []);

    const connect = useCallback(() => {
        if (isLoading || !isAuthenticated || eventSourceRef.current) {
            console.log('SSE Connect - Skipping:', {
                isLoading,
                isAuthenticated,
                hasExistingConnection: !!eventSourceRef.current
            });
            return;
        }

        console.log('SSE Connect - Attempting to connect...');
        try {
            const eventSource = new EventSource('/api/notifications/stream', {
                withCredentials: true
            });
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('SSE connection opened');
                setIsConnected(true);
                setConnectionError(null);
                reconnectAttempts.current = 0;
            };

            eventSource.onmessage = (event) => {
                try {
                    console.log('SSE message received:', event.data);
                    const data = JSON.parse(event.data);

                    if (data.type === 'connected') {
                        console.log('SSE connection established');
                    } else if (data.type === 'heartbeat') {
                        console.log('SSE heartbeat received');
                    } else if (data.type && data.id) {
                        console.log('SSE notification received:', data);
                        // This is a notification
                        setUnreadCountState(prev => prev + 1);
                        onNotification?.(data as RealtimeNotification);
                    } else {
                        console.log('SSE unknown message type:', data);
                    }
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);
                setIsConnected(false);
                setConnectionError('Connection error');

                // Close the current connection
                eventSource.close();
                eventSourceRef.current = null;

                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    reconnectAttempts.current++;

                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log(`Attempting to reconnect (attempt ${reconnectAttempts.current})`);
                        connect();
                    }, delay);
                } else {
                    setConnectionError('Failed to connect after multiple attempts');
                }
            };
        } catch (error) {
            console.error('Error creating SSE connection:', error);
            setConnectionError('Failed to create connection');
        }
    }, [isLoading, isAuthenticated, onNotification]);

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        setIsConnected(false);
        setConnectionError(null);
        reconnectAttempts.current = 0;
    }, []);

    // Connect when authenticated, disconnect when not
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            // Small delay to ensure session is fully established
            const timer = setTimeout(() => {
                connect();
            }, 100);
            return () => clearTimeout(timer);
        } else if (!isLoading && !isAuthenticated) {
            disconnect();
        }

        return disconnect;
    }, [isLoading, isAuthenticated]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, []);

    return {
        isConnected,
        connectionError,
        unreadCount,
        setUnreadCount,
        incrementUnreadCount,
        decrementUnreadCount,
        resetUnreadCount,
    };
}