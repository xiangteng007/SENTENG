/**
 * useGoogleIntegrationStatus.js
 * 
 * Google Integration 狀態快取 Hook
 * 避免每個 row 都重複呼叫 API
 */

import { useEffect, useState, useCallback } from 'react';
import { integrationsApi } from '../services/integrationsApi';

/**
 * @typedef {Object} GoogleIntegrationStatus
 * @property {boolean} connected
 * @property {string|null} googleAccountEmail
 * @property {string|null} calendarId
 * @property {string|null} contactsLabel
 * @property {boolean} autoSyncEvents
 * @property {boolean} autoSyncContacts
 * @property {string|null} lastSyncedAt
 * @property {string|null} lastSyncError
 */

/**
 * 取得 Google 整合狀態並快取
 * @returns {{data: GoogleIntegrationStatus|null, loading: boolean, error: string|null, refetch: Function}}
 */
export function useGoogleIntegrationStatus() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const status = await integrationsApi.getStatus();
            setData(status);
        } catch (e) {
            setError(e?.message || 'Failed to load Google integration status');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, loading, error, refetch };
}

export default useGoogleIntegrationStatus;
