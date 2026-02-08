/**
 * MaterialCalculator - 共用工具函數
 * 從 SharedComponents.jsx 提取 (FE-001)
 */

export const formatNumber = (num, decimals = 2) => {
    if (isNaN(num) || num === null) return '-';
    return Number(num).toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
};

export const applyWastage = (value, wastagePercent) => {
    return value * (1 + wastagePercent / 100);
};
