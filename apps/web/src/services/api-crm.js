/**
 * CRM Domain APIs — Clients, Vendors, Contacts
 * Extracted from api.js for maintainability
 */
import { api } from './api';

// ===== Clients API =====
export const clientsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/clients${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.patch(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
};

// ===== Vendors API =====
export const vendorsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/vendors${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/vendors/${id}`),
    create: (data) => api.post('/vendors', data),
    update: (id, data) => api.patch(`/vendors/${id}`, data),
    updateRating: (id, rating) => api.patch(`/vendors/${id}/rating`, { rating }),
    blacklist: (id, reason) => api.post(`/vendors/${id}/blacklist`, { reason }),
    activate: (id) => api.post(`/vendors/${id}/activate`),
    delete: (id) => api.delete(`/vendors/${id}`),
};
