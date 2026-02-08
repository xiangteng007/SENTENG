/**
 * mappers.js — API Response → Frontend Model Mapping Functions
 *
 * Extracted from useApiData.js to improve maintainability.
 * Pure functions that transform backend API responses into
 * the shapes expected by frontend components.
 */

// === CLIENTS ===

export function mapClientFromApi(apiClient) {
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
        lineId: '',
        driveFolder: '',
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

// === PROJECTS ===

export function mapProjectFromApi(apiProject) {
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
        folderUrl: '',
        createdAt: apiProject.createdAt,
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

// === VENDORS ===

export function mapVendorFromApi(apiVendor) {
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
