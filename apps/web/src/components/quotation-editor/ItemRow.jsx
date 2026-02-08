/**
 * 工項列元件
 * 提供類 Excel 表格列編輯
 */

import { useState } from 'react';
import {
    Plus, Copy, Trash2, ChevronDown, ChevronUp, GripVertical,
} from 'lucide-react';
import { ITEM_TYPES, calculateLineAmount } from '../../services/QuotationService';

const ItemRow = ({
    item,
    index,
    level = 0,
    isEditing,
    onUpdate,
    onDelete,
    onAddChild,
    onDuplicate,
    isSelected,
    onSelect,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = item.type === ITEM_TYPES.CHAPTER || item.type === ITEM_TYPES.SECTION;

    const handleChange = (field, value) => {
        const updates = { [field]: value };

        // 自動計算複價
        if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? value : item.quantity;
            const price = field === 'unitPrice' ? value : item.unitPrice;
            updates.amount = calculateLineAmount(qty, price);
        }

        onUpdate(item.id, updates);
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        return new Intl.NumberFormat('zh-TW').format(num);
    };

    const isChapter = item.type === ITEM_TYPES.CHAPTER;
    const isSection = item.type === ITEM_TYPES.SECTION;
    const isItem = item.type === ITEM_TYPES.ITEM;

    return (
        <tr
            className={`
                group border-b border-gray-100 transition-all
                ${isChapter ? 'bg-gray-800 text-white font-semibold' : ''}
                ${isSection ? 'bg-gray-100 font-medium' : ''}
                ${isItem ? 'hover:bg-orange-50/50' : ''}
                ${isSelected ? 'bg-orange-100' : ''}
            `}
            onClick={() => onSelect?.(item.id)}
        >
            {/* 項次 */}
            <td className={`px-2 py-2 text-center text-sm w-20 ${isChapter ? 'text-white' : 'text-gray-600'}`}>
                <div className="flex items-center gap-1">
                    <GripVertical size={14} className="opacity-30 cursor-grab" />
                    <span>{item.itemCode}</span>
                </div>
            </td>

            {/* 名稱 */}
            <td className={`px-2 py-2 ${isChapter ? '' : ''}`} style={{ paddingLeft: `${level * 16 + 8}px` }}>
                <div className="flex items-center gap-2">
                    {hasChildren && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className={`p-0.5 rounded ${isChapter ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>
                    )}
                    {isEditing ? (
                        <input
                            type="text"
                            value={item.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`flex-1 px-2 py-1 rounded border text-sm ${isChapter ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="flex-1 text-sm">{item.name}</span>
                    )}
                </div>
            </td>

            {/* 規格 (只有明細項顯示) */}
            <td className={`px-2 py-2 text-sm ${isChapter || isSection ? 'opacity-30' : ''}`}>
                {isItem && (isEditing ? (
                    <input
                        type="text"
                        value={item.specification || ''}
                        onChange={(e) => handleChange('specification', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-200 text-sm"
                        placeholder="規格說明"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="text-gray-500">{item.specification}</span>
                ))}
            </td>

            {/* 單位 */}
            <td className={`px-2 py-2 text-center text-sm w-16 ${isChapter || isSection ? 'opacity-30' : ''}`}>
                {isItem && (isEditing ? (
                    <input
                        type="text"
                        value={item.unit || ''}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="w-full px-1 py-1 rounded border border-gray-200 text-sm text-center"
                        placeholder="式"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span>{item.unit}</span>
                ))}
            </td>

            {/* 數量 */}
            <td className={`px-2 py-2 text-right text-sm w-20 ${isChapter || isSection ? 'opacity-30' : ''}`}>
                {isItem && (isEditing ? (
                    <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 rounded border border-gray-200 text-sm text-right"
                        min="0"
                        step="0.01"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span>{formatNumber(item.quantity)}</span>
                ))}
            </td>

            {/* 單價 */}
            <td className={`px-2 py-2 text-right text-sm w-24 ${isChapter || isSection ? 'opacity-30' : ''}`}>
                {isItem && (isEditing ? (
                    <input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 rounded border border-gray-200 text-sm text-right"
                        min="0"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span>{formatNumber(item.unitPrice)}</span>
                ))}
            </td>

            {/* 複價 */}
            <td className={`px-2 py-2 text-right text-sm w-28 font-medium ${isChapter ? 'text-white' : 'text-orange-600'}`}>
                {formatNumber(item.amount || calculateLineAmount(item.quantity, item.unitPrice))}
            </td>

            {/* 操作 */}
            <td className="px-2 py-2 w-24">
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasChildren && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddChild?.(item.id); }}
                            className={`p-1 rounded ${isChapter ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="新增子項"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDuplicate?.(item.id); }}
                        className={`p-1 rounded ${isChapter ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                        title="複製"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
                        className={`p-1 rounded ${isChapter ? 'hover:bg-red-500/50 text-white' : 'hover:bg-red-100 text-red-500'}`}
                        title="刪除"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ItemRow;
