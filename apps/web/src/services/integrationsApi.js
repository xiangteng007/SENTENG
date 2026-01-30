/**
 * integrationsApi.js
 * 
 * Google Integrations API 封裝
 */

import { api } from './api';

/**
 * Google 整合狀態
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
 * 同步結果
 * @typedef {Object} SyncResult
 * @property {boolean} success
 * @property {string} syncedAt
 * @property {string} [googleId]
 * @property {string} [error]
 */

/**
 * 批量同步結果
 * @typedef {Object} BulkSyncResult
 * @property {number} total
 * @property {number} synced
 * @property {number} failed
 * @property {Array<{id: string, error: string}>} errors
 */

// ===== Google Integrations API =====
export const integrationsApi = {
    // OAuth 管理
    getStatus: () => api.get('/integrations/google/status'),
    connect: () => api.post('/integrations/google/connect'),
    disconnect: () => api.post('/integrations/google/disconnect'),
    configure: (config) => api.post('/integrations/google/configure', config),

    // Calendar Sync
    syncEvent: (eventId) => api.post(`/integrations/google/calendar/sync/events/${eventId}`),
    syncCalendarBulk: () => api.post('/integrations/google/calendar/sync/bulk'),
    retryCalendarSync: () => api.post('/integrations/google/calendar/retry'),

    // Contacts Sync
    syncContact: (contactId) => api.post(`/integrations/google/contacts/sync/contact/${contactId}`),
    syncClientContacts: (clientId) => api.post(`/integrations/google/contacts/sync/client/${clientId}`),
    syncVendorContacts: (vendorId) => api.post(`/integrations/google/contacts/sync/vendor/${vendorId}`),
};

export default integrationsApi;
