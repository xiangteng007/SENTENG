/**
 * 合約管理服務層 (ContractService)
 * 處理合約建立、版本控管、履約追蹤
 * 
 * ⚠️ 已整合 Backend API - 資料儲存於 PostgreSQL
 */

import { contractsApi, quotationsApi } from './api';

// ============================================
// 常數定義
// ============================================

// 合約狀態 (對應後端 CTR_*)
export const CONTRACT_STATUS = {
    DRAFT: 'CTR_DRAFT',           // 草稿
    PENDING_SIGN: 'CTR_PENDING',  // 待簽約
    ACTIVE: 'CTR_ACTIVE',         // 履約中
    COMPLETED: 'CTR_COMPLETED',   // 已完工
    WARRANTY: 'CTR_WARRANTY',     // 保固期
    CLOSED: 'CTR_CLOSED',         // 已結案
    TERMINATED: 'CTR_TERMINATED', // 終止
};

export const CONTRACT_STATUS_LABELS = {
    CTR_DRAFT: '草稿',
    CTR_PENDING: '待簽約',
    CTR_ACTIVE: '履約中',
    CTR_COMPLETED: '已完工',
    CTR_WARRANTY: '保固期',
    CTR_CLOSED: '已結案',
    CTR_TERMINATED: '終止',
    // Legacy mapping
    DRAFT: '草稿',
    PENDING_SIGN: '待簽約',
    ACTIVE: '履約中',
    COMPLETED: '已完工',
    WARRANTY: '保固期',
    CLOSED: '已結案',
    TERMINATED: '終止',
};

export const CONTRACT_STATUS_COLORS = {
    CTR_DRAFT: 'bg-gray-100 text-gray-700',
    CTR_PENDING: 'bg-yellow-100 text-yellow-700',
    CTR_ACTIVE: 'bg-blue-100 text-blue-700',
    CTR_COMPLETED: 'bg-green-100 text-green-700',
    CTR_WARRANTY: 'bg-purple-100 text-purple-700',
    CTR_CLOSED: 'bg-gray-200 text-gray-600',
    CTR_TERMINATED: 'bg-red-100 text-red-700',
    // Legacy mapping
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING_SIGN: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    WARRANTY: 'bg-purple-100 text-purple-700',
    CLOSED: 'bg-gray-200 text-gray-600',
    TERMINATED: 'bg-red-100 text-red-700',
};

// 合約類型
export const CONTRACT_TYPES = {
    LUMP_SUM: 'LUMP_SUM',           // 總價承攬
    UNIT_PRICE: 'UNIT_PRICE',       // 單價承攬
    COST_PLUS: 'COST_PLUS',         // 成本加成
    DESIGN_BUILD: 'DESIGN_BUILD',   // 統包
};

export const CONTRACT_TYPE_LABELS = {
    LUMP_SUM: '總價承攬',
    UNIT_PRICE: '單價承攬',
    COST_PLUS: '成本加成',
    DESIGN_BUILD: '統包工程',
};

// 付款條件範本
export const PAYMENT_TERM_TEMPLATES = [
    {
        id: 'standard-3',
        name: '標準三期款',
        terms: [
            { name: '簽約訂金', percentage: 30, trigger: 'SIGNED' },
            { name: '中期款', percentage: 40, trigger: 'PROGRESS_50' },
            { name: '完工尾款', percentage: 30, trigger: 'COMPLETED' },
        ],
    },
    {
        id: 'standard-4',
        name: '標準四期款',
        terms: [
            { name: '簽約訂金', percentage: 30, trigger: 'SIGNED' },
            { name: '第一期', percentage: 30, trigger: 'PROGRESS_30' },
            { name: '第二期', percentage: 30, trigger: 'PROGRESS_70' },
            { name: '完工尾款', percentage: 10, trigger: 'COMPLETED' },
        ],
    },
    {
        id: 'monthly',
        name: '按月請款',
        terms: [
            { name: '簽約訂金', percentage: 10, trigger: 'SIGNED' },
            { name: '月結款', percentage: 80, trigger: 'MONTHLY' },
            { name: '完工尾款', percentage: 10, trigger: 'COMPLETED' },
        ],
    },
];

// ============================================
// 工具函數
// ============================================

/**
 * 生成合約編號
 */
export const generateContractNo = (year, sequence) => {
    return `CTR${year}-${String(sequence).padStart(4, '0')}`;
};

// ============================================
// 合約服務類 - 使用 Backend API
// ============================================

class ContractServiceClass {
    constructor() {
        // No localStorage needed - using backend API
    }

    // 取得所有合約
    async getContracts(filters = {}) {
        try {
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.projectId) params.projectId = filters.projectId;

            const contracts = await contractsApi.getAll(params);
            return contracts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Failed to get contracts:', error);
            return [];
        }
    }

    // 取得單一合約
    async getContract(id) {
        try {
            return await contractsApi.getById(id);
        } catch (error) {
            console.error('Failed to get contract:', error);
            return null;
        }
    }

    // 從估價單建立合約
    async createFromQuotation(quotationId, additionalData = {}) {
        try {
            const payload = {
                quotationId,
                contractNo: additionalData.contractNo,
                paymentTerms: additionalData.paymentTerms || 'PROGRESS',
                retentionRate: additionalData.retentionRate || 5,
                warrantyMonths: additionalData.warrantyMonths || 12,
            };

            return await contractsApi.convertFromQuotation(payload);
        } catch (error) {
            console.error('Failed to create contract from quotation:', error);
            throw error;
        }
    }

    // 建立新合約
    async createContract(data) {
        try {
            const payload = {
                projectId: data.projectId,
                contractNo: data.contractNo,
                title: data.title,
                contractType: data.contractType || 'FIXED_PRICE',
                originalAmount: data.originalAmount || data.amount || 0,
                retentionRate: data.retentionRate || 5,
                paymentTerms: data.paymentTerms || 'PROGRESS',
                warrantyMonths: data.warrantyMonths || 12,
                notes: data.notes,
            };

            return await contractsApi.create(payload);
        } catch (error) {
            console.error('Failed to create contract:', error);
            throw error;
        }
    }

    // 更新合約
    async updateContract(id, data) {
        try {
            return await contractsApi.update(id, data);
        } catch (error) {
            console.error('Failed to update contract:', error);
            throw error;
        }
    }

    // 簽約
    async sign(id, signedDate) {
        try {
            return await contractsApi.sign(id, signedDate);
        } catch (error) {
            console.error('Failed to sign contract:', error);
            throw error;
        }
    }

    // 完工
    async complete(id) {
        try {
            return await contractsApi.complete(id);
        } catch (error) {
            console.error('Failed to complete contract:', error);
            throw error;
        }
    }

    // 結案
    async close(id) {
        try {
            return await contractsApi.close(id);
        } catch (error) {
            console.error('Failed to close contract:', error);
            throw error;
        }
    }

    // 取得合約統計
    async getContractStats() {
        const contracts = await this.getContracts();

        return {
            total: contracts.length,
            active: contracts.filter(c => c.status === CONTRACT_STATUS.ACTIVE).length,
            completed: contracts.filter(c => c.status === CONTRACT_STATUS.COMPLETED).length,
            warranty: contracts.filter(c => c.status === CONTRACT_STATUS.WARRANTY).length,
            totalAmount: contracts.reduce((sum, c) => sum + (Number(c.currentAmount) || 0), 0),
            totalPaid: contracts.reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0),
        };
    }
}

export const ContractService = new ContractServiceClass();
export default ContractService;
