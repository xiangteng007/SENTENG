/**
 * eventsSyncApi.js
 * 
 * Events 同步 API 封裝
 */

import { api } from './api';

/**
 * 同步事件到 Google Calendar
 * @param {string} eventId 
 * @returns {Promise<{success: boolean, syncedAt: string, googleId?: string, error?: string}>}
 */
export async function syncEventToGoogle(eventId) {
    return api.post(`/integrations/google/calendar/sync/events/${eventId}`);
}

/**
 * 批量同步事件
 * @returns {Promise<{total: number, synced: number, failed: number, errors: Array}>}
 */
export async function syncCalendarBulk() {
    return api.post('/integrations/google/calendar/sync/bulk');
}

/**
 * 重試失敗的同步
 * @returns {Promise<{total: number, synced: number, failed: number, errors: Array}>}
 */
export async function retryCalendarSync() {
    return api.post('/integrations/google/calendar/retry');
}

export default {
    syncEventToGoogle,
    syncCalendarBulk,
    retryCalendarSync,
};
