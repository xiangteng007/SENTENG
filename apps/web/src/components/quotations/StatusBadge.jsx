/**
 * 狀態標籤元件
 */

import React from 'react';
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_COLORS } from '../../services/QuotationService';

const StatusBadge = ({ status }) => {
    const colorClass = QUOTATION_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
    const label = QUOTATION_STATUS_LABELS[status] || status;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
