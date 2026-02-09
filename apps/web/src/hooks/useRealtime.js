/**
 * useRealtime.js
 * 
 * React hook for WebSocket real-time subscriptions.
 * Connects to the /realtime namespace and handles sync status updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Debounce utility function
 * Prevents rapid-fire updates from causing UI flickering
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Hook for real-time subscriptions with debounce support
 */
export function useRealtime(token, options = {}) {
    const { debounceMs = 300 } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const socketRef = useRef(null);
    const listenersRef = useRef(new Map());
    const debouncedSettersRef = useRef(new Map());

    // Create debounced event setter
    const getDebouncedSetter = useCallback((event) => {
        if (!debouncedSettersRef.current.has(event)) {
            debouncedSettersRef.current.set(
                event,
                debounce((payload) => {
                    setLastEvent({ event, payload, timestamp: new Date() });

                    // Notify all listeners for this event
                    const listeners = listenersRef.current.get(event) || [];
                    listeners.forEach(callback => callback(payload));
                }, debounceMs)
            );
        }
        return debouncedSettersRef.current.get(event);
    }, [debounceMs]);

    // Connect to WebSocket
    useEffect(() => {
        if (!token) return;

        const socket = io(`${SOCKET_URL}/realtime`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.warn('[Realtime] Connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.warn('[Realtime] Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[Realtime] Connection error:', error.message);
        });

        // Handle all realtime events with debouncing
        ['sync:status', 'sync:complete', 'sync:error', 'data:update', 'notification'].forEach(event => {
            socket.on(event, (payload) => {
                // Use debounced handler for data:update to prevent UI flickering
                if (event === 'data:update') {
                    getDebouncedSetter(event)(payload);
                } else {
                    // Immediate handling for critical events
                    setLastEvent({ event, payload, timestamp: new Date() });
                    const listeners = listenersRef.current.get(event) || [];
                    listeners.forEach(callback => callback(payload));
                }
            });
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    /**
     * Subscribe to entity updates
     */
    const subscribe = useCallback((entityType, entityId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('subscribe', { entityType, entityId });
        }
    }, []);

    /**
     * Unsubscribe from entity updates
     */
    const unsubscribe = useCallback((entityType, entityId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('unsubscribe', { entityType, entityId });
        }
    }, []);

    /**
     * Add event listener
     */
    const on = useCallback((event, callback) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, []);
        }
        listenersRef.current.get(event).push(callback);

        // Return cleanup function
        return () => {
            const listeners = listenersRef.current.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []);

    return {
        isConnected,
        lastEvent,
        subscribe,
        unsubscribe,
        on,
    };
}

/**
 * Hook for sync status subscription  
 */
export function useSyncStatus(entityType, entityId) {
    const [syncStatus, setSyncStatus] = useState(null);
    const { isConnected, subscribe, unsubscribe, on } = useRealtime(
        api.token
    );

    useEffect(() => {
        if (isConnected && entityType) {
            subscribe(entityType, entityId);

            const cleanup = on('sync:status', (payload) => {
                if (payload.entityType === entityType &&
                    (!entityId || payload.entityId === entityId)) {
                    setSyncStatus(payload.data);
                }
            });

            return () => {
                unsubscribe(entityType, entityId);
                cleanup();
            };
        }
    }, [isConnected, entityType, entityId, subscribe, unsubscribe, on]);

    return syncStatus;
}
