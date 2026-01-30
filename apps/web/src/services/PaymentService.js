/**
 * 請款管理服務層 (PaymentService)
 * 處理請款申請、審核、收款追蹤
 * 
 * ⚠️ 已整合 Backend API - 資料儲存於 PostgreSQL
 */

import { paymentsApi } from './api';

// ============================================
// 常數定義
// ============================================

// 請款單狀態 (對應後端 PAY_*)
export const PAYMENT_STATUS = {
    DRAFT: 'PAY_DRAFT',           // 草稿
    PENDING: 'PAY_PENDING',       // 待審核
    APPROVED: 'PAY_APPROVED',     // 已核准
    INVOICED: 'PAY_INVOICED',     // 已開立發票
    PARTIAL: 'PAY_PARTIAL',       // 部分收款
    PAID: 'PAY_PAID',             // 已收款
    OVERDUE: 'PAY_OVERDUE',       // 逾期
    CANCELLED: 'PAY_CANCELLED',   // 已取消
};

export const PAYMENT_STATUS_LABELS = {
    PAY_DRAFT: '草稿',
    PAY_PENDING: '待審核',
    PAY_APPROVED: '已核准',
    PAY_INVOICED: '已開票',
    PAY_PARTIAL: '部分收款',
    PAY_PAID: '已收款',
    PAY_OVERDUE: '逾期',
    PAY_CANCELLED: '已取消',
    // Legacy mapping
    DRAFT: '草稿',
    PENDING: '待審核',
    APPROVED: '已核准',
    INVOICED: '已開票',
    PARTIAL: '部分收款',
    PAID: '已收款',
    OVERDUE: '逾期',
    CANCELLED: '已取消',
};

export const PAYMENT_STATUS_COLORS = {
    PAY_DRAFT: 'bg-gray-100 text-gray-700',
    PAY_PENDING: 'bg-yellow-100 text-yellow-700',
    PAY_APPROVED: 'bg-blue-100 text-blue-700',
    PAY_INVOICED: 'bg-purple-100 text-purple-700',
    PAY_PARTIAL: 'bg-orange-100 text-orange-700',
    PAY_PAID: 'bg-green-100 text-green-700',
    PAY_OVERDUE: 'bg-red-100 text-red-700',
    PAY_CANCELLED: 'bg-gray-200 text-gray-500',
    // Legacy mapping
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    INVOICED: 'bg-purple-100 text-purple-700',
    PARTIAL: 'bg-orange-100 text-orange-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-200 text-gray-500',
};

// 請款類型
export const PAYMENT_TYPES = {
    DEPOSIT: 'DEPOSIT',       // 訂金
    PROGRESS: 'PROGRESS',     // 工程進度款
    MILESTONE: 'MILESTONE',   // 里程碑款
    FINAL: 'FINAL',           // 尾款
    RETENTION: 'RETENTION',   // 保留款
    CHANGE_ORDER: 'CHANGE_ORDER', // 變更單款項
};

export const PAYMENT_TYPE_LABELS = {
    DEPOSIT: '訂金',
    PROGRESS: '進度款',
    MILESTONE: '里程碑款',
    FINAL: '尾款',
    RETENTION: '保留款',
    CHANGE_ORDER: '變更單款項',
};

// 預設付款條件
export const DEFAULT_PAYMENT_TERMS = [
    { id: 'deposit', type: 'DEPOSIT', name: '簽約訂金', percentage: 30, daysAfterSign: 0 },
    { id: 'progress1', type: 'PROGRESS', name: '第一期款', percentage: 30, daysAfterSign: 30 },
    { id: 'progress2', type: 'PROGRESS', name: '第二期款', percentage: 30, daysAfterSign: 60 },
    { id: 'final', type: 'FINAL', name: '完工尾款', percentage: 10, daysAfterSign: 90 },
];

// 保留款設定
export const RETENTION_SETTINGS = {
    rate: 5, // 5%
    releaseAfterMonths: 12, // 12個月後釋放
};

// ============================================
// 工具函數
// ============================================

/**
 * 生成請款單編號
 */
export const generatePaymentNo = (projectCode, sequence) => {
    const year = new Date().getFullYear();
    return `PAY${year}-${projectCode || 'XX'}-${String(sequence).padStart(2, '0')}`;
};

/**
 * 計算保留款
 */
export const calculateRetention = (amount, rate = RETENTION_SETTINGS.rate) => {
    return Math.round(amount * (rate / 100));
};

/**
 * 計算可請款金額
 */
export const calculatePayableAmount = (amount, retentionRate = RETENTION_SETTINGS.rate) => {
    const retention = calculateRetention(amount, retentionRate);
    return amount - retention;
};

// ============================================
// 請款服務類 - 使用 Backend API
// ============================================

class PaymentServiceClass {
    constructor() {
        // No localStorage needed - using backend API
    }

    // 取得所有請款單
    async getPayments(filters = {}) {
        try {
            const params = {};
            if (filters.projectId) params.projectId = filters.projectId;
            if (filters.contractId) params.contractId = filters.contractId;
            if (filters.status) params.status = filters.status;

            const payments = await paymentsApi.getAll(params);

            // 排序：最新的在前
            return payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Failed to get payments:', error);
            return [];
        }
    }

    // 取得單一請款單
    async getPayment(id) {
        try {
            return await paymentsApi.getById(id);
        } catch (error) {
            console.error('Failed to get payment:', error);
            return null;
        }
    }

    // 取得請款單的收款記錄
    async getReceipts(paymentId) {
        try {
            return await paymentsApi.getReceipts(paymentId);
        } catch (error) {
            console.error('Failed to get receipts:', error);
            return [];
        }
    }

    // 新增請款單
    async createPayment(data) {
        try {
            // 計算金額
            const requestAmount = data.requestAmount || 0;
            const retentionRate = data.retentionRate || RETENTION_SETTINGS.rate;
            const retentionAmount = calculateRetention(requestAmount, retentionRate);
            const netAmount = requestAmount - retentionAmount;

            const payload = {
                contractId: data.contractId,
                projectId: data.projectId,
                periodNo: data.periodNo || 1,
                applicationDate: data.applicationDate || new Date().toISOString().split('T')[0],
                progressPercent: data.progressPercent || 0,
                cumulativePercent: data.cumulativePercent || 0,
                requestAmount,
                retentionAmount,
                netAmount,
                notes: data.notes || data.description || '',
            };

            return await paymentsApi.create(payload);
        } catch (error) {
            console.error('Failed to create payment:', error);
            throw error;
        }
    }

    // 更新請款單
    async updatePayment(id, data) {
        try {
            // 重新計算金額 if needed
            if (data.requestAmount !== undefined || data.retentionRate !== undefined) {
                const requestAmount = data.requestAmount || 0;
                const retentionRate = data.retentionRate || RETENTION_SETTINGS.rate;
                data.retentionAmount = calculateRetention(requestAmount, retentionRate);
                data.netAmount = requestAmount - data.retentionAmount;
            }

            return await paymentsApi.update(id, data);
        } catch (error) {
            console.error('Failed to update payment:', error);
            throw error;
        }
    }

    // 提交審核
    async submitForReview(id) {
        try {
            return await paymentsApi.submit(id);
        } catch (error) {
            console.error('Failed to submit payment:', error);
            throw error;
        }
    }

    // 核准
    async approve(id) {
        try {
            return await paymentsApi.approve(id);
        } catch (error) {
            console.error('Failed to approve payment:', error);
            throw error;
        }
    }

    // 駁回
    async reject(id, reason) {
        try {
            return await paymentsApi.reject(id, reason);
        } catch (error) {
            console.error('Failed to reject payment:', error);
            throw error;
        }
    }

    // 記錄收款
    async recordReceipt(id, amount, receiptDate, paymentMethod = 'BANK_TRANSFER', referenceNo = '') {
        try {
            return await paymentsApi.addReceipt({
                applicationId: id,
                amount,
                receiptDate: receiptDate || new Date().toISOString().split('T')[0],
                paymentMethod,
                referenceNo,
            });
        } catch (error) {
            console.error('Failed to record receipt:', error);
            throw error;
        }
    }

    // 取得專案請款統計
    async getProjectPaymentStats(projectId) {
        const payments = await this.getPayments({ projectId });

        return {
            totalPayments: payments.length,
            totalRequested: payments.reduce((sum, p) => sum + (Number(p.requestAmount) || 0), 0),
            totalReceived: payments.reduce((sum, p) => sum + (Number(p.receivedAmount) || 0), 0),
            totalRetention: payments.reduce((sum, p) => sum + (Number(p.retentionAmount) || 0), 0),
            pendingCount: payments.filter(p => p.status === PAYMENT_STATUS.PENDING).length,
            overdueCount: payments.filter(p => p.status === PAYMENT_STATUS.OVERDUE).length,
        };
    }

    // 取得逾期請款單
    async getOverduePayments() {
        const payments = await this.getPayments();
        const today = new Date();

        return payments.filter(p => {
            if (p.status === PAYMENT_STATUS.PAID || p.status === PAYMENT_STATUS.CANCELLED) {
                return false;
            }
            if (!p.dueDate) return false;
            return new Date(p.dueDate) < today;
        });
    }
}

export const PaymentService = new PaymentServiceClass();
export default PaymentService;
