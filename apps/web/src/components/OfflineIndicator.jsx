/**
 * OfflineIndicator.jsx
 * 
 * Visual indicator for network connectivity status.
 * Shows a banner when offline with pending queue count.
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getQueueStats, processPendingRequests } from '../services/offlineQueue';

export function OfflineIndicator() {
    const { isOnline, offlineDuration } = useNetworkStatus();
    const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0 });
    const [isSyncing, setIsSyncing] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    // Update queue stats periodically
    useEffect(() => {
        const updateStats = async () => {
            try {
                const stats = await getQueueStats();
                setQueueStats(stats);
            } catch (e) {
                // IndexedDB not initialized yet
            }
        };

        updateStats();
        const interval = setInterval(updateStats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Show banner when offline or has pending items
    useEffect(() => {
        setShowBanner(!isOnline || queueStats.pending > 0 || queueStats.failed > 0);
    }, [isOnline, queueStats]);

    // Handle manual sync
    const handleSync = async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            await processPendingRequests((progress) => {
                console.log('[OfflineIndicator] Sync progress:', progress);
            });
            const stats = await getQueueStats();
            setQueueStats(stats);
        } finally {
            setIsSyncing(false);
        }
    };

    if (!showBanner) return null;

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${isOnline
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
        >
            {/* Status Icon */}
            {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
            ) : (
                <WifiOff className="w-5 h-5 text-red-600 animate-pulse" />
            )}

            {/* Status Text */}
            <div className="flex flex-col">
                <span className="font-medium text-sm">
                    {isOnline ? '連線中' : '離線模式'}
                </span>
                {queueStats.pending > 0 && (
                    <span className="text-xs opacity-80">
                        {queueStats.pending} 筆待同步
                    </span>
                )}
                {queueStats.failed > 0 && (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {queueStats.failed} 筆同步失敗
                    </span>
                )}
                {offlineDuration && offlineDuration > 0 && (
                    <span className="text-xs opacity-60">
                        離線 {offlineDuration} 秒
                    </span>
                )}
            </div>

            {/* Sync Button */}
            {isOnline && queueStats.pending > 0 && (
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="ml-2 p-2 rounded-full hover:bg-amber-200 transition-colors disabled:opacity-50"
                    title="手動同步"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                    />
                </button>
            )}

            {/* Close Button */}
            {isOnline && queueStats.pending === 0 && queueStats.failed === 0 && (
                <button
                    onClick={() => setShowBanner(false)}
                    className="ml-2 p-1 rounded hover:bg-amber-200 transition-colors text-xs"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export default OfflineIndicator;
