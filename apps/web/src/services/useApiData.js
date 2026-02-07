import { useState, useEffect, useCallback } from 'react';
import { projectsApi, inventoryApi, financeApi } from './api';
import { getClients, getVendors, createPartner, deletePartner } from './partnersApi';
import { GoogleService } from './GoogleService';
import { MOCK_DB } from './MockData';

/**
 * Custom hook for loading and managing data from API with Google Sheets fallback
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 */
export const useApiData = (isAuthenticated = false) => {
    const [data, setData] = useState(MOCK_DB);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load all data from API (only when authenticated)
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log('📥 Loading data from API...', { isAuthenticated });

        try {
            let clientsResult, projectsResult, vendorsResult;

            // Only load from API if authenticated
            if (isAuthenticated) {
                [clientsResult, projectsResult, vendorsResult] = await Promise.allSettled([
                    getClients(),
                    projectsApi.getAll(),
                    getVendors(),
                ]);
            } else {
                // Not authenticated - use mock data
                console.log('⚠️ Not authenticated, using mock data');
                setLoading(false);
                return;
            }

            // Load inventory and finance from backend API
            const [inventoryResult, accountsResult, loansResult, transactionsResult] =
                await Promise.allSettled([
                    inventoryApi.getAll(),
                    financeApi.getAccounts(),
                    financeApi.getLoans(),
                    financeApi.getTransactions(),
                ]);

            setData(prev => {
                const newData = { ...prev };

                // Clients from API
                if (clientsResult.status === 'fulfilled' && clientsResult.value) {
                    const clients = Array.isArray(clientsResult.value)
                        ? clientsResult.value
                        : (clientsResult.value.items || []);
                    newData.clients = clients.map(mapClientFromApi);
                    console.log('✅ Clients loaded from Partners API:', newData.clients.length);
                }

                // Projects from API
                if (projectsResult.status === 'fulfilled' && projectsResult.value) {
                    const projects = Array.isArray(projectsResult.value) ? projectsResult.value : [];
                    newData.projects = projects.map(mapProjectFromApi);
                    console.log('✅ Projects loaded from API:', newData.projects.length);
                }

                // Vendors from API
                if (vendorsResult.status === 'fulfilled' && vendorsResult.value) {
                    const vendors = Array.isArray(vendorsResult.value)
                        ? vendorsResult.value
                        : (vendorsResult.value.items || []);
                    newData.vendors = vendors.map(mapVendorFromApi);
                    console.log('✅ Vendors loaded from Partners API:', newData.vendors.length);
                }

                // Inventory from API
                if (inventoryResult.status === 'fulfilled' && inventoryResult.value) {
                    const inventory = Array.isArray(inventoryResult.value)
                        ? inventoryResult.value
                        : (inventoryResult.value.items || []);
                    newData.inventory = inventory;
                    console.log('✅ Inventory loaded from API:', newData.inventory.length);
                }

                // Finance from API
                newData.finance = {
                    ...prev.finance,
                    accounts: accountsResult.status === 'fulfilled' && accountsResult.value
                        ? (Array.isArray(accountsResult.value) ? accountsResult.value : (accountsResult.value.items || []))
                        : prev.finance.accounts,
                    loans: loansResult.status === 'fulfilled' && loansResult.value
                        ? (Array.isArray(loansResult.value) ? loansResult.value : (loansResult.value.items || []))
                        : prev.finance.loans,
                    transactions: transactionsResult.status === 'fulfilled' && transactionsResult.value
                        ? (Array.isArray(transactionsResult.value) ? transactionsResult.value : (transactionsResult.value.items || []))
                        : prev.finance.transactions,
                };
                console.log('✅ Finance loaded from API');

                return newData;
            });

            console.log('✅ Data loaded successfully');
        } catch (err) {
            console.error('❌ Failed to load data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial load - only when auth state changes
    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, loadData]);

    // === CLIENTS ===
    const updateClients = async (newClients) => {
        setData(prev => ({ ...prev, clients: newClients }));
        await GoogleService.syncToSheet('clients', newClients);
    };

    const createClient = async (clientData) => {
        try {
            const result = await createPartner({ ...clientData, type: 'CLIENT' });
            const mapped = mapClientFromApi(result);
            setData(prev => ({ ...prev, clients: [...prev.clients, mapped] }));
            return { success: true, data: mapped };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const deleteClient = async (id) => {
        try {
            await deletePartner(id);
            setData(prev => ({
                ...prev,
                clients: prev.clients.filter(c => c.id !== id)
            }));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // === PROJECTS ===
    const createProject = async (projectData) => {
        try {
            const result = await projectsApi.create(projectData);
            const mapped = mapProjectFromApi(result);
            setData(prev => ({ ...prev, projects: [...prev.projects, mapped] }));
            return { success: true, data: mapped };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const updateProject = async (id, projectData) => {
        try {
            const result = await projectsApi.update(id, projectData);
            const mapped = mapProjectFromApi(result);
            setData(prev => ({
                ...prev,
                projects: prev.projects.map(p => p.id === id ? mapped : p)
            }));
            return { success: true, data: mapped };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // === GENERIC UPDATE (for non-API data) ===
    const handleUpdate = (key, newData) => {
        setData(prev => ({ ...prev, [key]: newData }));
    };

    const handleFinanceUpdate = (financeKey, newData) => {
        setData(prev => ({
            ...prev,
            finance: { ...prev.finance, [financeKey]: newData }
        }));
    };

    return {
        data,
        loading,
        error,
        reload: loadData,
        // Update methods
        handleUpdate,
        handleFinanceUpdate,
        updateClients,
        // API methods
        createClient,
        deleteClient,
        createProject,
        updateProject,
    };
};

// === Mapping Functions ===

function mapClientFromApi(apiClient) {
    return {
        id: apiClient.id,
        name: apiClient.name,
        phone: apiClient.phone || '',
        email: apiClient.email || '',
        address: apiClient.address || '',
        status: mapClientStatus(apiClient.status),
        type: apiClient.type || 'INDIVIDUAL',
        taxId: apiClient.taxId || '',
        contactPerson: apiClient.contactPerson || '',
        lineId: '', // Not in API
        driveFolder: '', // Will be created separately
        createdAt: apiClient.createdAt,
        customFields: [],
        contactLogs: [],
    };
}

function mapClientStatus(apiStatus) {
    const statusMap = {
        'ACTIVE': '洽談中',
        'VIP': '已簽約',
        'NORMAL': '洽談中',
        'INACTIVE': '暫緩',
    };
    return statusMap[apiStatus] || '洽談中';
}

function mapProjectFromApi(apiProject) {
    return {
        id: apiProject.id,
        name: apiProject.name,
        client: apiProject.client?.name || '',
        clientId: apiProject.clientId,
        status: mapProjectStatus(apiProject.status),
        startDate: apiProject.startDate || '',
        endDate: apiProject.endDate || '',
        budget: Number(apiProject.contractAmount) || 0,
        description: apiProject.description || '',
        folderUrl: '', // Will be set separately
        createdAt: apiProject.createdAt,
        // Financial data
        originalAmount: Number(apiProject.originalAmount) || 0,
        currentAmount: Number(apiProject.currentAmount) || 0,
        costBudget: Number(apiProject.costBudget) || 0,
        costActual: Number(apiProject.costActual) || 0,
    };
}

function mapProjectStatus(apiStatus) {
    const statusMap = {
        'PLANNING': '規劃中',
        'QUOTED': '報價中',
        'IN_PROGRESS': '進行中',
        'COMPLETED': '已完工',
        'ON_HOLD': '暫緩',
        'CANCELLED': '已取消',
    };
    return statusMap[apiStatus] || '規劃中';
}

function mapVendorFromApi(apiVendor) {
    return {
        id: apiVendor.id,
        name: apiVendor.name,
        type: mapVendorType(apiVendor.type),
        taxId: apiVendor.taxId || '',
        contactPerson: apiVendor.contactPerson || '',
        phone: apiVendor.phone || '',
        email: apiVendor.email || '',
        address: apiVendor.address || '',
        bankName: apiVendor.bankName || '',
        bankAccount: apiVendor.bankAccount || '',
        paymentTerms: apiVendor.paymentTerms || 30,
        status: mapVendorStatus(apiVendor.status),
        rating: apiVendor.rating || 0,
        notes: apiVendor.notes || '',
        createdAt: apiVendor.createdAt,
    };
}

function mapVendorType(apiType) {
    const typeMap = {
        'SUPPLIER': '材料商',
        'SUBCONTRACTOR': '承包商',
        'SERVICE': '服務商',
        'OTHER': '其他',
    };
    return typeMap[apiType] || '其他';
}

function mapVendorStatus(apiStatus) {
    const statusMap = {
        'ACTIVE': '合作中',
        'INACTIVE': '暫停',
        'BLACKLISTED': '黑名單',
    };
    return statusMap[apiStatus] || '合作中';
}

export default useApiData;

