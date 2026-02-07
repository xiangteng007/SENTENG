/**
 * CRM Domain APIs — Partners (backward-compatible shims)
 * 
 * These shim objects delegate to the unified Partners API
 * while preserving the old `clientsApi` / `vendorsApi` export names
 * so existing consumers keep working during migration.
 * 
 * New code should import directly from './partnersApi' instead.
 */
import { api } from './api';

// ===== Clients API (delegates to /partners) =====
export const clientsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/partners/clients${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/partners/${id}`),
    create: (data) => api.post('/partners', { ...data, type: 'CLIENT' }),
    update: (id, data) => api.patch(`/partners/${id}`, data),
    delete: (id) => api.delete(`/partners/${id}`),
};

// ===== Vendors API (delegates to /partners) =====
export const vendorsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/partners/vendors${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/partners/${id}`),
    create: (data) => api.post('/partners', { ...data, type: 'VENDOR' }),
    update: (id, data) => api.patch(`/partners/${id}`, data),
    delete: (id) => api.delete(`/partners/${id}`),
};
