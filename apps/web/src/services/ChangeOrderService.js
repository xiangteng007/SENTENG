/**
 * 工程變更單服務層 (ChangeOrderService)
 * 處理追加減項、變更追蹤、金額計算
 * 
 * ⚠️ 已整合 Backend API - 資料儲存於 PostgreSQL
 */

import { changeOrdersApi } from './api';
import { calculateLineAmount } from './QuotationService';

// ============================================
// 常數定義
// ============================================

// 變更單狀態 (對應後端 CHG_*)
export const CHANGE_ORDER_STATUS = {
    DRAFT: 'CHG_DRAFT',           // 草稿
    PENDING: 'CHG_PENDING',       // 待審核
    CLIENT_CONFIRM: 'CHG_CLIENT_CONFIRM', // 待客戶確認
    APPROVED: 'CHG_APPROVED',     // 已核准
    REJECTED: 'CHG_REJECTED',     // 已拒絕
    VOIDED: 'CHG_VOIDED',         // 作廢
};

export const CHANGE_ORDER_STATUS_LABELS = {
    CHG_DRAFT: '草稿',
    CHG_PENDING: '待審核',
    CHG_CLIENT_CONFIRM: '待客戶確認',
    CHG_APPROVED: '已核准',
    CHG_REJECTED: '已拒絕',
    CHG_VOIDED: '作廢',
    // Legacy mapping
    DRAFT: '草稿',
    PENDING: '待審核',
    CLIENT_CONFIRM: '待客戶確認',
    APPROVED: '已核准',
    REJECTED: '已拒絕',
    VOIDED: '作廢',
};

export const CHANGE_ORDER_STATUS_COLORS = {
    CHG_DRAFT: 'bg-gray-100 text-gray-700',
    CHG_PENDING: 'bg-yellow-100 text-yellow-700',
    CHG_CLIENT_CONFIRM: 'bg-blue-100 text-blue-700',
    CHG_APPROVED: 'bg-green-100 text-green-700',
    CHG_REJECTED: 'bg-red-100 text-red-700',
    CHG_VOIDED: 'bg-gray-200 text-gray-500',
    // Legacy mapping
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CLIENT_CONFIRM: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    VOIDED: 'bg-gray-200 text-gray-500',
};

// 變更類型
export const CHANGE_TYPES = {
    ADD: 'ADD',         // 追加
    DEDUCT: 'DEDUCT',   // 減項
    REPLACE: 'REPLACE', // 替換
    MODIFY: 'MODIFY',   // 數量/單價修改
};

export const CHANGE_TYPE_LABELS = {
    ADD: '追加',
    DEDUCT: '減項',
    REPLACE: '替換',
    MODIFY: '變更',
};

export const CHANGE_TYPE_COLORS = {
    ADD: 'bg-green-100 text-green-700',
    DEDUCT: 'bg-red-100 text-red-700',
    REPLACE: 'bg-purple-100 text-purple-700',
    MODIFY: 'bg-blue-100 text-blue-700',
};

// 變更原因分類
export const CHANGE_REASONS = [
    { id: 'client_request', label: '客戶需求變更', icon: '👤' },
    { id: 'design_change', label: '設計變更', icon: '📐' },
    { id: 'site_condition', label: '現場狀況', icon: '🏗️' },
    { id: 'material_change', label: '材料變更', icon: '🧱' },
    { id: 'regulation', label: '法規要求', icon: '📋' },
    { id: 'error_correction', label: '錯誤修正', icon: '⚠️' },
    { id: 'other', label: '其他', icon: '📝' },
];

// ============================================
// 工具函數
// ============================================

/**
 * 生成變更單編號
 */
export const generateChangeOrderNo = (quotationNo, sequence) => {
    return `${quotationNo}-CO${String(sequence).padStart(2, '0')}`;
};

/**
 * 計算變更單金額彙總
 */
export const calculateChangeOrderTotals = (items) => {
    let totalAdded = 0;
    let totalDeducted = 0;

    items.forEach(item => {
        const amount = calculateLineAmount(item.quantity, item.unitPrice);
        if (item.changeType === CHANGE_TYPES.ADD || item.changeType === CHANGE_TYPES.REPLACE) {
            totalAdded += amount;
        } else if (item.changeType === CHANGE_TYPES.DEDUCT) {
            totalDeducted += amount;
        } else if (item.changeType === CHANGE_TYPES.MODIFY) {
            const originalAmount = calculateLineAmount(item.originalQuantity, item.originalUnitPrice);
            const diff = amount - originalAmount;
            if (diff > 0) {
                totalAdded += diff;
            } else {
                totalDeducted += Math.abs(diff);
            }
        }
    });

    return {
        totalAdded,
        totalDeducted,
        netChange: totalAdded - totalDeducted,
    };
};

// ============================================
// 變更單服務類 - 使用 Backend API
// ============================================

class ChangeOrderServiceClass {
    constructor() {
        // No localStorage needed - using backend API
    }

    // 取得所有變更單
    async getChangeOrders(filters = {}) {
        try {
            const params = {};
            if (filters.contractId) params.contractId = filters.contractId;
            if (filters.projectId) params.projectId = filters.projectId;
            if (filters.status) params.status = filters.status;

            return await changeOrdersApi.getAll(params);
        } catch (error) {
            console.error('Failed to get change orders:', error);
            return [];
        }
    }

    // 取得單一變更單
    async getChangeOrder(id) {
        try {
            return await changeOrdersApi.getById(id);
        } catch (error) {
            console.error('Failed to get change order:', error);
            return null;
        }
    }

    // 新增變更單
    async createChangeOrder(data) {
        try {
            const payload = {
                contractId: data.contractId,
                projectId: data.projectId,
                title: data.title || '工程變更',
                reason: data.reason || 'client_request',
                items: data.items || [],
                notes: data.description || data.notes || '',
            };

            return await changeOrdersApi.create(payload);
        } catch (error) {
            console.error('Failed to create change order:', error);
            throw error;
        }
    }

    // 更新變更單
    async updateChangeOrder(id, data) {
        try {
            return await changeOrdersApi.update(id, data);
        } catch (error) {
            console.error('Failed to update change order:', error);
            throw error;
        }
    }

    // 提交審核
    async submitForReview(id) {
        try {
            return await changeOrdersApi.submit(id);
        } catch (error) {
            console.error('Failed to submit change order:', error);
            throw error;
        }
    }

    // 核准
    async approve(id) {
        try {
            return await changeOrdersApi.approve(id);
        } catch (error) {
            console.error('Failed to approve change order:', error);
            throw error;
        }
    }

    // 拒絕
    async reject(id, reason) {
        try {
            return await changeOrdersApi.reject(id, reason);
        } catch (error) {
            console.error('Failed to reject change order:', error);
            throw error;
        }
    }

    // 從估價單工項建立變更項目
    createChangeItemFromQuotation(quotationItem, changeType) {
        return {
            id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            changeType,
            originalItemId: quotationItem.id,
            originalItemCode: quotationItem.itemCode,
            name: quotationItem.name,
            specification: quotationItem.specification || '',
            unit: quotationItem.unit,
            originalQuantity: quotationItem.quantity,
            originalUnitPrice: quotationItem.unitPrice,
            quantity: changeType === CHANGE_TYPES.DEDUCT ? quotationItem.quantity : 0,
            unitPrice: quotationItem.unitPrice,
            reason: '',
            remark: '',
        };
    }

    // 建立新增項目
    createNewChangeItem() {
        return {
            id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            changeType: CHANGE_TYPES.ADD,
            originalItemId: null,
            originalItemCode: null,
            name: '',
            specification: '',
            unit: '式',
            originalQuantity: 0,
            originalUnitPrice: 0,
            quantity: 0,
            unitPrice: 0,
            reason: '',
            remark: '',
        };
    }

    // 取得累計變更金額
    async getCumulativeChanges(contractId) {
        const orders = await this.getChangeOrders({ contractId });
        const approvedOrders = orders.filter(o =>
            o.status === CHANGE_ORDER_STATUS.APPROVED ||
            o.status === 'CHG_APPROVED'
        );

        return approvedOrders.reduce((acc, order) => ({
            totalAdded: acc.totalAdded + (Number(order.totalAdded) || 0),
            totalDeducted: acc.totalDeducted + (Number(order.totalDeducted) || 0),
            netChange: acc.netChange + (Number(order.netChange) || 0),
            count: acc.count + 1,
        }), { totalAdded: 0, totalDeducted: 0, netChange: 0, count: 0 });
    }
}

export const ChangeOrderService = new ChangeOrderServiceClass();
export default ChangeOrderService;
