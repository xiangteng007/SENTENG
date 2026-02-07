/**
 * Finance & Operations Domain APIs — Finance, Invoices, Quotations,
 * Cost Entries, Inventory, Events, Storage, Users
 * Extracted from api.js for maintainability
 */
import { api } from './api';

// ===== Finance API =====
export const financeApi = {
    // Accounts
    getAccounts: () => api.get('/finance/accounts'),
    createAccount: (data) => api.post('/finance/accounts', data),
    updateAccount: (id, data) => api.patch(`/finance/accounts/${id}`, data),
    deleteAccount: (id) => api.delete(`/finance/accounts/${id}`),
    // Transactions
    getTransactions: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/finance/transactions${query ? `?${query}` : ''}`);
    },
    createTransaction: (data) => api.post('/finance/transactions', data),
    updateTransaction: (id, data) => api.patch(`/finance/transactions/${id}`, data),
    deleteTransaction: (id) => api.delete(`/finance/transactions/${id}`),
    // Loans
    getLoans: () => api.get('/finance/loans'),
    createLoan: (data) => api.post('/finance/loans', data),
    updateLoan: (id, data) => api.patch(`/finance/loans/${id}`, data),
    deleteLoan: (id) => api.delete(`/finance/loans/${id}`),
    addLoanPayment: (id, data) => api.post(`/finance/loans/${id}/payment`, data),
};

// ===== Invoices API =====
export const invoicesApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/invoices${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post('/invoices', data),
    update: (id, data) => api.patch(`/invoices/${id}`, data),
    issue: (id) => api.post(`/invoices/${id}/issue`),
    recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
    void: (id, reason) => api.post(`/invoices/${id}/void`, { reason }),
};

// ===== Quotations API =====
export const quotationsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/quotations${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/quotations/${id}`),
    getVersions: (id) => api.get(`/quotations/${id}/versions`),
    create: (data) => api.post('/quotations', data),
    update: (id, data) => api.patch(`/quotations/${id}`, data),
    submit: (id) => api.post(`/quotations/${id}/submit`),
    approve: (id) => api.post(`/quotations/${id}/approve`),
    reject: (id, reason) => api.post(`/quotations/${id}/reject`, { reason }),
    createNewVersion: (id) => api.post(`/quotations/${id}/new-version`),
};

// ===== Cost Entries API =====
export const costEntriesApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/cost-entries${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/cost-entries/${id}`),
    getSummary: (projectId) => api.get(`/cost-entries/summary/${projectId}`),
    create: (data) => api.post('/cost-entries', data),
    update: (id, data) => api.patch(`/cost-entries/${id}`, data),
    markPaid: (id, data = {}) => api.post(`/cost-entries/${id}/mark-paid`, data),
    delete: (id) => api.delete(`/cost-entries/${id}`),
};

// ===== Inventory API =====
export const inventoryApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/inventory${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/inventory/${id}`),
    create: (data) => api.post('/inventory', data),
    update: (id, data) => api.patch(`/inventory/${id}`, data),
    addStock: (id, data) => api.post(`/inventory/${id}/add-stock`, data),
    removeStock: (id, data) => api.post(`/inventory/${id}/remove-stock`, data),
    transferStock: (id, data) => api.post(`/inventory/${id}/transfer`, data),
    delete: (id) => api.delete(`/inventory/${id}`),
};

// ===== Events API =====
export const eventsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/events${query ? `?${query}` : ''}`);
    },
    getById: (id) => api.get(`/events/${id}`),
    getToday: () => api.get('/events/today'),
    getUpcoming: (days = 7) => api.get(`/events/upcoming?days=${days}`),
    getByProject: (projectId) => api.get(`/events/project/${projectId}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.patch(`/events/${id}`, data),
    complete: (id) => api.post(`/events/${id}/complete`),
    cancel: (id) => api.post(`/events/${id}/cancel`),
    delete: (id) => api.delete(`/events/${id}`),
};

// ===== Storage API =====
export const storageApi = {
    getStatus: () => api.get('/storage/status'),
    upload: async (file, destination = 'uploads') => {
        const formData = new FormData();
        formData.append('file', file);
        const url = `${api.baseUrl}/storage/upload?destination=${encodeURIComponent(destination)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(api.token && { Authorization: `Bearer ${api.token}` }),
            },
            credentials: 'include',
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },
    getSignedUrl: (fileName, expiresInDays = 7) =>
        api.post('/storage/signed-url', { fileName, expiresInDays }),
    delete: (fileName) => {
        const encodedFileName = btoa(fileName);
        return api.delete(`/storage/${encodedFileName}`);
    },
};

// ===== Users API =====
export const usersApi = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
};
