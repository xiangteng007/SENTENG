// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://erp-api-381507943724.asia-east1.run.app/api/v1';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.token = null; // In-memory only — no localStorage persistence
    }

    setToken(token) {
        this.token = token;
    }

    clearToken() {
        this.token = null;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',  // Required for HttpOnly cookie auth
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // GET request
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PATCH request
    patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiService();

// ===== Auth API =====
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    health: () => api.get('/auth/health'),
};

// ===== Domain APIs (re-exported for backward compatibility) =====
export { projectsApi, contractsApi, changeOrdersApi, paymentsApi } from './api-projects';
export {
    financeApi, invoicesApi, quotationsApi, costEntriesApi,
    inventoryApi, eventsApi, storageApi, usersApi,
} from './api-finance';

export default api;
