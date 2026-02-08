/**
 * 估價單卡片元件
 */

import { useState } from 'react';
import { MoreVertical, Eye, Edit2, Copy, Trash2, Users, Building2, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

const QuotationCard = ({ quotation, onView, onEdit, onCopy, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-TW');
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all group">
            {/* 頂部 */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">{quotation.quotationNo}</span>
                    <StatusBadge status={quotation.status} />
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[140px]">
                                <button
                                    onClick={() => { onView?.(quotation); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Eye size={16} /> 檢視
                                </button>
                                <button
                                    onClick={() => { onEdit?.(quotation); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit2 size={16} /> 編輯
                                </button>
                                <button
                                    onClick={() => { onCopy?.(quotation); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Copy size={16} /> 複製
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                    onClick={() => { onDelete?.(quotation); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> 刪除
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 標題 */}
            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">{quotation.title}</h3>

            {/* 資訊 */}
            <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                {quotation.customerName && (
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        {quotation.customerName}
                    </div>
                )}
                {quotation.projectName && (
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-400" />
                        {quotation.projectName}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    有效期限：{formatDate(quotation.validUntil)}
                </div>
            </div>

            {/* 金額 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">報價金額</span>
                <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(quotation.totalAmount)}
                </span>
            </div>

            {/* 快速動作 */}
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit?.(quotation)}
                    className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-1"
                >
                    <Edit2 size={14} /> 編輯
                </button>
                <button
                    onClick={() => onView?.(quotation)}
                    className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                >
                    <Eye size={14} /> 檢視
                </button>
            </div>
        </div>
    );
};

export default QuotationCard;
