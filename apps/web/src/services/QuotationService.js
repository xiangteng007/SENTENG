/**
 * 估價單系統服務層 (QuotationService)
 * 處理估價單的 CRUD、版本管理、審批流程
 * 
 * ⚠️ 已整合 Backend API - 資料儲存於 PostgreSQL
 * 常數與工項庫資料已提取至 quotation-constants.js
 */

import { quotationsApi } from './api';

// Re-export constants for backward compatibility
export {
    QUOTATION_STATUS,
    QUOTATION_STATUS_LABELS,
    QUOTATION_STATUS_COLORS,
    ITEM_TYPES,
    SUPPLY_TYPES,
    TAX_TYPES,
    DEFAULT_SETTINGS,
    CATALOG_CATEGORIES,
    DEFAULT_CATALOG_ITEMS,
    QUOTATION_TEMPLATES,
} from './quotation-constants';

// Import for local use
import {
    ITEM_TYPES,
    SUPPLY_TYPES,
    TAX_TYPES,
    DEFAULT_SETTINGS,
    DEFAULT_CATALOG_ITEMS,
} from './quotation-constants';

// ============================================
// 工具函數
// ============================================

/**
 * 生成估價單編號
 */
export const generateQuotationNo = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `Q${year}-${random}`;
};

/**
 * 生成項次編號
 */
export const generateItemCode = (parentCode, index) => {
    if (!parentCode) return `${index + 1}`;
    return `${parentCode}.${index + 1}`;
};

/**
 * 計算單行複價
 */
export const calculateLineAmount = (quantity, unitPrice) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return Math.round(qty * price);
};

/**
 * 計算估價單總金額
 */
export const calculateQuotationTotals = (items, settings = {}) => {
    const {
        discountRate = 0,
        discountAmount = 0,
        managementFeeRate = DEFAULT_SETTINGS.managementFee,
        profitRate = DEFAULT_SETTINGS.profitRate,
        taxRate = DEFAULT_SETTINGS.taxRate,
        taxType = TAX_TYPES.INCLUSIVE,
    } = settings;

    // 計算工項小計
    const subtotal = items
        .filter(item => item.type === ITEM_TYPES.ITEM && item.supplyType !== SUPPLY_TYPES.OWNER)
        .reduce((sum, item) => sum + calculateLineAmount(item.quantity, item.unitPrice), 0);

    // 計算成本總計
    const costTotal = items
        .filter(item => item.type === ITEM_TYPES.ITEM && item.supplyType !== SUPPLY_TYPES.OWNER)
        .reduce((sum, item) => sum + calculateLineAmount(item.quantity, item.costPrice || 0), 0);

    // 折扣
    const discountAmt = discountAmount || Math.round(subtotal * discountRate / 100);
    const afterDiscount = subtotal - discountAmt;

    // 管理費
    const managementFee = Math.round(afterDiscount * managementFeeRate / 100);

    // 利潤
    const profitAmount = Math.round((afterDiscount + managementFee) * profitRate / 100);

    // 稅前總計
    const beforeTax = afterDiscount + managementFee + profitAmount;

    // 稅額
    let taxAmount = 0;
    let totalAmount = beforeTax;

    if (taxType === TAX_TYPES.EXCLUSIVE) {
        taxAmount = Math.round(beforeTax * taxRate / 100);
        totalAmount = beforeTax + taxAmount;
    } else {
        // 含稅 - 反算稅額
        taxAmount = Math.round(beforeTax * taxRate / (100 + taxRate));
    }

    // 毛利率
    const profitRateActual = costTotal > 0 ? ((totalAmount - costTotal) / totalAmount * 100) : 0;

    return {
        subtotal,
        costTotal,
        discountAmount: discountAmt,
        afterDiscount,
        managementFee,
        profitAmount,
        beforeTax,
        taxAmount,
        totalAmount,
        profitRate: profitRateActual.toFixed(1),
    };
};

/**
 * 套用模板生成工項
 */
export const applyTemplate = (template) => {
    const items = [];
    let itemId = 1;

    const processItems = (templateItems, parentId = null, parentCode = '') => {
        templateItems.forEach((tplItem, index) => {
            const code = generateItemCode(parentCode, index);
            const item = {
                id: `item-${itemId++}`,
                parentId,
                itemCode: code,
                type: tplItem.type,
                name: tplItem.name,
                specification: tplItem.specification || '',
                unit: tplItem.unit || '',
                quantity: tplItem.quantity || 0,
                unitPrice: tplItem.unitPrice || 0,
                costPrice: tplItem.costPrice || Math.round(tplItem.unitPrice * 0.8),
                amount: 0,
                supplyType: SUPPLY_TYPES.CONTRACTOR,
                isOptional: false,
                remark: '',
                sortOrder: items.length,
            };
            items.push(item);

            if (tplItem.children && tplItem.children.length > 0) {
                processItems(tplItem.children, item.id, code);
            }
        });
    };

    processItems(template.items);
    return items;
};

// ============================================
// 估價單服務類 - 使用 Backend API
// ============================================

class QuotationServiceClass {
    constructor() {
        this.catalogKey = 'senteng_catalog'; // 工項庫暫存本機
    }

    // 取得所有估價單
    async getQuotations(filters = {}) {
        try {
            const params = {};
            if (filters.projectId) params.projectId = filters.projectId;
            if (filters.status) params.status = filters.status;

            return await quotationsApi.getAll(params);
        } catch (error) {
            console.error('Failed to get quotations:', error);
            return [];
        }
    }

    // 取得單一估價單
    async getQuotation(id) {
        try {
            return await quotationsApi.getById(id);
        } catch (error) {
            console.error('Failed to get quotation:', error);
            return null;
        }
    }

    // 取得版本歷史
    async getVersions(id) {
        try {
            return await quotationsApi.getVersions(id);
        } catch (error) {
            console.error('Failed to get versions:', error);
            return [];
        }
    }

    // 新增估價單
    async createQuotation(data) {
        try {
            // Transform items to backend-compatible format
            const transformedItems = (data.items || [])
                .filter(item => item.type === 'ITEM' || !item.type) // Only send actual items, not chapters
                .map((item, index) => ({
                    itemOrder: index + 1,
                    category: item.category || '',
                    itemName: item.name || item.itemName || '未命名工項',
                    spec: item.specification || item.spec || '',
                    unit: item.unit || '式',
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                    amount: item.amount || (item.quantity || 1) * (item.unitPrice || 0),
                    remark: item.remark || '',
                }));

            const payload = {
                projectId: data.projectId,
                title: data.title || '新估價單',
                currency: data.currency || DEFAULT_SETTINGS.currency,
                isTaxIncluded: data.taxType !== TAX_TYPES.EXCLUSIVE,
                taxRate: data.taxRate || DEFAULT_SETTINGS.taxRate,
                validUntil: data.validUntil || new Date(Date.now() + DEFAULT_SETTINGS.validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: data.description || data.notes || '',
                items: transformedItems,
            };

            return await quotationsApi.create(payload);
        } catch (error) {
            console.error('Failed to create quotation:', error);
            throw error;
        }
    }

    // 更新估價單
    async updateQuotation(id, data) {
        try {
            return await quotationsApi.update(id, data);
        } catch (error) {
            console.error('Failed to update quotation:', error);
            throw error;
        }
    }

    // 提交審核
    async submitForReview(id) {
        try {
            return await quotationsApi.submit(id);
        } catch (error) {
            console.error('Failed to submit quotation:', error);
            throw error;
        }
    }

    // 核准
    async approve(id) {
        try {
            return await quotationsApi.approve(id);
        } catch (error) {
            console.error('Failed to approve quotation:', error);
            throw error;
        }
    }

    // 駁回
    async reject(id, reason) {
        try {
            return await quotationsApi.reject(id, reason);
        } catch (error) {
            console.error('Failed to reject quotation:', error);
            throw error;
        }
    }

    // 建立新版本
    async createNewVersion(id) {
        try {
            return await quotationsApi.createNewVersion(id);
        } catch (error) {
            console.error('Failed to create new version:', error);
            throw error;
        }
    }

    // 變更狀態 (通用)
    async changeStatus(id, newStatus, note = '') {
        return this.updateQuotation(id, {
            status: newStatus,
            notes: note,
        });
    }

    // 取得工項庫 (仍使用 localStorage 作為快取)
    async getCatalogItems() {
        try {
            const data = localStorage.getItem(this.catalogKey);
            return data ? JSON.parse(data) : DEFAULT_CATALOG_ITEMS;
        } catch {
            return DEFAULT_CATALOG_ITEMS;
        }
    }

    // 搜尋工項庫
    async searchCatalog(keyword, category = null) {
        const items = await this.getCatalogItems();
        return items.filter(item => {
            const matchKeyword = !keyword ||
                item.name.includes(keyword) ||
                item.id.includes(keyword);
            const matchCategory = !category || item.category === category;
            return matchKeyword && matchCategory;
        });
    }
}

export const QuotationService = new QuotationServiceClass();
export default QuotationService;
