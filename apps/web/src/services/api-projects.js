/**
 * Project Domain APIs — Projects, Contracts, Change Orders, Payments
 * Extracted from api.js for maintainability
 */
import { api } from './api';

// ===== Projects API =====
export const projectsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/projects${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/projects/${id}`),
    getSummary: (id) => api.get(`/projects/${id}/summary`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.patch(`/projects/${id}`, data),
};

// ===== Contracts API =====
export const contractsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/contracts${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/contracts/${id}`),
    create: (data) => api.post('/contracts', data),
    convertFromQuotation: (data) => api.post('/contracts/from-quotation', data),
    update: (id, data) => api.patch(`/contracts/${id}`, data),
    sign: (id, signDate) => api.post(`/contracts/${id}/sign`, { signDate }),
    complete: (id) => api.post(`/contracts/${id}/complete`),
    close: (id) => api.post(`/contracts/${id}/close`),
};

// ===== Change Orders API =====
export const changeOrdersApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/change-orders${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/change-orders/${id}`),
    create: (data) => api.post('/change-orders', data),
    update: (id, data) => api.patch(`/change-orders/${id}`, data),
    submit: (id) => api.post(`/change-orders/${id}/submit`),
    approve: (id) => api.post(`/change-orders/${id}/approve`),
    reject: (id, reason) => api.post(`/change-orders/${id}/reject`, { reason }),
};

// ===== Payments API =====
export const paymentsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/payments${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/payments/${id}`),
    getReceipts: (id) => api.get(`/payments/${id}/receipts`),
    create: (data) => api.post('/payments', data),
    addReceipt: (data) => api.post('/payments/receipts', data),
    update: (id, data) => api.patch(`/payments/${id}`, data),
    submit: (id) => api.post(`/payments/${id}/submit`),
    approve: (id) => api.post(`/payments/${id}/approve`),
    reject: (id, reason) => api.post(`/payments/${id}/reject`, { reason }),
};
