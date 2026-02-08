/**
 * Shared utility functions for contract components
 */

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW');
};
