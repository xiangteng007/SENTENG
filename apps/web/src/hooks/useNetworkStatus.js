/**
 * useNetworkStatus.js
 * 
 * Hook for monitoring network connectivity status.
 * Provides real-time online/offline status with debouncing.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for network status monitoring
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [lastOnlineTime, setLastOnlineTime] = useState(null);
    const [lastOfflineTime, setLastOfflineTime] = useState(null);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setLastOnlineTime(new Date());
        };

        const handleOffline = () => {
            setIsOnline(false);
            setLastOfflineTime(new Date());
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Calculate offline duration when back online
    const offlineDuration = useCallback(() => {
        if (!lastOfflineTime || !lastOnlineTime) return null;
        if (lastOnlineTime < lastOfflineTime) return null;
        return Math.round((lastOnlineTime - lastOfflineTime) / 1000);
    }, [lastOnlineTime, lastOfflineTime]);

    return {
        isOnline,
        lastOnlineTime,
        lastOfflineTime,
        offlineDuration: offlineDuration(),
    };
}

export default useNetworkStatus;
