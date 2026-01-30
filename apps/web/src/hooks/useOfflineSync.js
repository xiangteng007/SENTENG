/**
 * useOfflineSync.js
 * 
 * React hook for offline-aware API calls.
 * Automatically queues mutations when offline and syncs when back online.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    initOfflineQueue,
    queueRequest,
    getQueueStats,
    processPendingRequests
} from '../services/offlineQueue';

/**
 * Hook for offline-aware mutations
 */
export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queueStats, setQueueStats] = useState({ total: 0, pending: 0, failed: 0 });
    const [isSyncing, setIsSyncing] = useState(false);

    // Initialize offline queue and track online status
    useEffect(() => {
        initOfflineQueue();

        const handleOnline = () => {
            setIsOnline(true);
            syncPending();
        };

        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial stats load
        loadStats();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadStats = async () => {
        const stats = await getQueueStats();
        setQueueStats(stats);
    };

    /**
     * Make an offline-aware fetch request
     * If online: normal fetch
     * If offline: queue for later
     */
    const offlineFetch = useCallback(async (url, options = {}) => {
        if (navigator.onLine) {
            // Online - try normal fetch
            try {
                const response = await fetch(url, options);
                return response;
            } catch (error) {
                // Network error - queue if mutation
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase())) {
                    await queueRequest({
                        method: options.method,
                        url,
                        headers: options.headers,
                        body: options.body
                    });
                    await loadStats();
                    return {
                        ok: false,
                        queued: true,
                        message: '已加入離線佇列，將在恢復連線後自動送出'
                    };
                }
                throw error;
            }
        } else {
            // Offline - queue mutations, reject reads
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase())) {
                await queueRequest({
                    method: options.method,
                    url,
                    headers: options.headers,
                    body: options.body
                });
                await loadStats();
                return {
                    ok: false,
                    queued: true,
                    message: '已加入離線佇列，將在恢復連線後自動送出'
                };
            }
            throw new Error('目前離線中，無法取得資料');
        }
    }, []);

    /**
     * Manually sync pending requests
     */
    const syncPending = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;

        setIsSyncing(true);
        try {
            const results = await processPendingRequests((progress) => {
                setQueueStats(prev => ({
                    ...prev,
                    pending: prev.pending - progress.success
                }));
            });
            await loadStats();
            return results;
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    return {
        isOnline,
        queueStats,
        isSyncing,
        offlineFetch,
        syncPending,
        refreshStats: loadStats
    };
}

/**
 * Conflict resolution: Server wins
 * Returns the server version with a notification
 */
export function resolveConflict(localData, serverData, onConflict) {
    if (localData.updatedAt && serverData.updatedAt) {
        const localTime = new Date(localData.updatedAt).getTime();
        const serverTime = new Date(serverData.updatedAt).getTime();

        if (serverTime > localTime) {
            // Server wins
            if (onConflict) {
                onConflict({
                    type: 'server_wins',
                    message: '資料已被其他使用者更新，顯示最新版本',
                    localData,
                    serverData
                });
            }
            return serverData;
        }
    }
    return localData;
}
