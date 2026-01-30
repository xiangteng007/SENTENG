/**
 * contactsSyncApi.js
 * 
 * Contacts 同步 API 封裝
 */

import { api } from './api';

/**
 * 同步單一聯絡人到 Google Contacts
 * @param {string} contactId 
 * @returns {Promise<{success: boolean, syncedAt: string, googleId?: string, error?: string}>}
 */
export async function syncContactToGoogle(contactId) {
    return api.post(`/integrations/google/contacts/sync/contact/${contactId}`);
}

/**
 * 同步客戶所有聯絡人
 * @param {string} clientId 
 * @returns {Promise<{total: number, synced: number, failed: number, errors: Array}>}
 */
export async function syncClientContactsToGoogle(clientId) {
    return api.post(`/integrations/google/contacts/sync/client/${clientId}`);
}

/**
 * 同步廠商所有聯絡人
 * @param {string} vendorId 
 * @returns {Promise<{total: number, synced: number, failed: number, errors: Array}>}
 */
export async function syncVendorContactsToGoogle(vendorId) {
    return api.post(`/integrations/google/contacts/sync/vendor/${vendorId}`);
}

export default {
    syncContactToGoogle,
    syncClientContactsToGoogle,
    syncVendorContactsToGoogle,
};
