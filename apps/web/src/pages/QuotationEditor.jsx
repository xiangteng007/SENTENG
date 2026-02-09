/**
 * 估價單編輯器 - 工項編輯器組件
 * QuotationEditor.jsx
 * 提供類 Excel 表格編輯體驗
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Save, ArrowLeft, Plus, Upload, Download,
    AlertCircle, Layers, FilePlus2, Search
} from 'lucide-react';
// PERF: Dynamic import for PDF (1.58MB) - loads only when user clicks PDF button
const QuotationPdfButton = React.lazy(() => 
    import('../components/quotation/QuotationPdfExport').then(m => ({ default: m.QuotationPdfButton }))
);
import ChangeOrders from './ChangeOrders';
import QuotationService, {
    QUOTATION_STATUS_LABELS,
    QUOTATION_STATUS_COLORS,
    ITEM_TYPES,
    SUPPLY_TYPES,
    TAX_TYPES,
    DEFAULT_SETTINGS,
    calculateQuotationTotals,
    generateItemCode,
} from '../services/QuotationService';
import ItemRow from '../components/quotation-editor/ItemRow';
import CatalogSearchModal from '../components/quotation-editor/CatalogSearchModal';
import SettingsPanel from '../components/quotation-editor/SettingsPanel';
import TotalsSummary from '../components/quotation-editor/TotalsSummary';


// ============================================
// 主編輯器組件
// ============================================
const QuotationEditor = ({ quotationId, onBack, addToast }) => {
    const [quotation, setQuotation] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, _setIsEditing] = useState(true);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [showCatalog, setShowCatalog] = useState(false);
    const [showChangeOrders, setShowChangeOrders] = useState(false);
    const [settings, setSettings] = useState({
        discountAmount: 0,
        managementFeeRate: DEFAULT_SETTINGS.managementFee,
        profitRate: DEFAULT_SETTINGS.profitRate,
        taxRate: DEFAULT_SETTINGS.taxRate,
        taxType: TAX_TYPES.INCLUSIVE,
    });
    const [hasChanges, setHasChanges] = useState(false);

    // 載入估價單
    useEffect(() => {
        const loadQuotation = async () => {
            if (!quotationId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const data = await QuotationService.getQuotation(quotationId);
                if (data) {
                    setQuotation(data);
                    setItems(data.items || []);
                    setSettings({
                        discountAmount: data.discountAmount || 0,
                        managementFeeRate: data.managementFeeRate || DEFAULT_SETTINGS.managementFee,
                        profitRate: data.profitRate || DEFAULT_SETTINGS.profitRate,
                        taxRate: data.taxRate || DEFAULT_SETTINGS.taxRate,
                        taxType: data.taxType || TAX_TYPES.INCLUSIVE,
                    });
                }
            } catch (error) {
                console.error('Failed to load quotation:', error);
                addToast?.('載入估價單失敗', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotationId]);

    // 計算總金額
    const totals = useMemo(() => {
        return calculateQuotationTotals(items, settings);
    }, [items, settings]);

    // 更新工項
    const handleUpdateItem = useCallback((itemId, updates) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
        setHasChanges(true);
    }, []);

    // 刪除工項
    const handleDeleteItem = useCallback((itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId && item.parentId !== itemId));
        setHasChanges(true);
    }, []);

    // 複製工項
    const handleDuplicateItem = useCallback((itemId) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newItem = {
            ...item,
            id: `item-${Date.now()}`,
            name: `${item.name} (複製)`,
        };

        const index = items.findIndex(i => i.id === itemId);
        const newItems = [...items];
        newItems.splice(index + 1, 0, newItem);
        setItems(newItems);
        setHasChanges(true);
    }, [items]);

    // 新增章節
    const handleAddChapter = useCallback(() => {
        const chapterCount = items.filter(i => i.type === ITEM_TYPES.CHAPTER).length;
        const newChapter = {
            id: `item-${Date.now()}`,
            parentId: null,
            itemCode: `${chapterCount + 1}`,
            type: ITEM_TYPES.CHAPTER,
            name: `第${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][chapterCount] || chapterCount + 1}章`,
            unit: '',
            quantity: 0,
            unitPrice: 0,
            amount: 0,
            sortOrder: items.length,
        };
        setItems(prev => [...prev, newChapter]);
        setHasChanges(true);
    }, [items]);

    // 新增工項
    const handleAddItem = useCallback((parentId = null) => {
        // 找到父項
        const parent = parentId ? items.find(i => i.id === parentId) : null;
        const siblings = items.filter(i => i.parentId === parentId);

        const newItem = {
            id: `item-${Date.now()}`,
            parentId,
            itemCode: generateItemCode(parent?.itemCode || '', siblings.length),
            type: parent?.type === ITEM_TYPES.CHAPTER ? ITEM_TYPES.SECTION : ITEM_TYPES.ITEM,
            name: '新工項',
            specification: '',
            unit: '式',
            quantity: 1,
            unitPrice: 0,
            costPrice: 0,
            amount: 0,
            supplyType: SUPPLY_TYPES.CONTRACTOR,
            remark: '',
            sortOrder: items.length,
        };

        // 在父項後面插入
        if (parentId) {
            const parentIndex = items.findIndex(i => i.id === parentId);
            const lastChildIndex = items.reduce((lastIdx, item, idx) =>
                item.parentId === parentId ? idx : lastIdx, parentIndex);
            const newItems = [...items];
            newItems.splice(lastChildIndex + 1, 0, newItem);
            setItems(newItems);
        } else {
            setItems(prev => [...prev, newItem]);
        }
        setHasChanges(true);
    }, [items]);

    // 從工項庫新增
    const handleAddFromCatalog = useCallback((catalogItem) => {
        const lastChapter = [...items].reverse().find(i => i.type === ITEM_TYPES.CHAPTER);
        const siblings = items.filter(i => i.parentId === lastChapter?.id);

        const newItem = {
            id: `item-${Date.now()}`,
            parentId: lastChapter?.id || null,
            itemCode: generateItemCode(lastChapter?.itemCode || '', siblings.length),
            type: ITEM_TYPES.ITEM,
            name: catalogItem.name,
            specification: '',
            unit: catalogItem.unit,
            quantity: 1,
            unitPrice: catalogItem.refPrice,
            costPrice: catalogItem.costPrice,
            amount: catalogItem.refPrice,
            supplyType: SUPPLY_TYPES.CONTRACTOR,
            catalogItemId: catalogItem.id,
            sortOrder: items.length,
        };

        setItems(prev => [...prev, newItem]);
        setHasChanges(true);
        addToast?.(`已新增「${catalogItem.name}」`, 'success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    // 儲存
    const handleSave = async () => {
        if (!quotation) return;

        setSaving(true);
        try {
            await QuotationService.updateQuotation(quotation.id, {
                items,
                ...settings,
                ...totals,
            });
            setHasChanges(false);
            addToast?.('儲存成功', 'success');
        } catch (error) {
            console.error('Failed to save:', error);
            addToast?.('儲存失敗', 'error');
        } finally {
            setSaving(false);
        }
    };

    // 組織階層結構
    const organizedItems = useMemo(() => {
        // 簡單平坦化 - 保持原始順序
        return items.map((item, _index) => {
            let level = 0;
            if (item.type === ITEM_TYPES.SECTION) level = 1;
            if (item.type === ITEM_TYPES.ITEM) level = item.parentId ? 2 : 1;
            return { ...item, level };
        });
    }, [items]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="text-center py-12 text-gray-500">
                找不到估價單
            </div>
        );
    }

    // 變更單模式
    if (showChangeOrders) {
        return (
            <ChangeOrders
                quotationId={quotationId}
                onBack={() => setShowChangeOrders(false)}
                addToast={addToast}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* 頁首 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{quotation.quotationNo}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${QUOTATION_STATUS_COLORS[quotation.status]}`}>
                                {QUOTATION_STATUS_LABELS[quotation.status]}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">{quotation.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                            <AlertCircle size={14} /> 尚未儲存
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {saving ? <span className="animate-spin">⟳</span> : <Save size={18} />}
                        儲存
                    </button>
                </div>
            </div>

            {/* 工具列 */}
            <div className="bg-white rounded-xl p-3 border border-gray-100 flex flex-wrap items-center gap-2">
                <button
                    onClick={handleAddChapter}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1"
                >
                    <Plus size={16} /> 新增章節
                </button>
                <button
                    onClick={() => handleAddItem()}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"
                >
                    <Plus size={16} /> 新增工項
                </button>
                <button
                    onClick={() => setShowCatalog(true)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"
                >
                    <Search size={16} /> 工項庫
                </button>
                <button
                    onClick={() => setShowChangeOrders(true)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 flex items-center gap-1"
                >
                    <FilePlus2 size={16} /> 變更單
                </button>
                <div className="flex-1" />
                <button className="px-3 py-1.5 text-gray-500 rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1">
                    <Upload size={16} /> 匯入
                </button>
                <button className="px-3 py-1.5 text-gray-500 rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1">
                    <Download size={16} /> 匯出
                </button>

                {/* PDF 下載 - Lazy loaded */}
                <React.Suspense fallback={<span className="px-3 py-1.5 text-gray-400 text-sm">載入中...</span>}>
                    <QuotationPdfButton
                        quotation={{
                            ...quotation,
                            items: items,
                            taxRate: settings.taxRate,
                            isTaxIncluded: settings.taxType === TAX_TYPES.INCLUSIVE,
                        }}
                        className="text-sm py-1.5"
                    />
                </React.Suspense>
            </div>

            {/* 費用設定 */}
            <SettingsPanel settings={settings} onChange={setSettings} totals={totals} />

            {/* 工項表格 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-xs text-gray-500 uppercase">
                                <th className="px-2 py-3 text-left w-20">項次</th>
                                <th className="px-2 py-3 text-left">名稱</th>
                                <th className="px-2 py-3 text-left">規格</th>
                                <th className="px-2 py-3 text-center w-16">單位</th>
                                <th className="px-2 py-3 text-right w-20">數量</th>
                                <th className="px-2 py-3 text-right w-24">單價</th>
                                <th className="px-2 py-3 text-right w-28">複價</th>
                                <th className="px-2 py-3 text-center w-24">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {organizedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                        <Layers size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>尚無工項</p>
                                        <p className="text-sm">點擊上方按鈕新增章節或工項</p>
                                    </td>
                                </tr>
                            ) : (
                                organizedItems.map((item, index) => (
                                    <ItemRow
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        level={item.level}
                                        isEditing={isEditing}
                                        onUpdate={handleUpdateItem}
                                        onDelete={handleDeleteItem}
                                        onAddChild={handleAddItem}
                                        onDuplicate={handleDuplicateItem}
                                        isSelected={selectedItemId === item.id}
                                        onSelect={setSelectedItemId}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 金額摘要 */}
            <TotalsSummary totals={totals} />

            {/* 工項庫 Modal */}
            <CatalogSearchModal
                isOpen={showCatalog}
                onClose={() => setShowCatalog(false)}
                onSelect={handleAddFromCatalog}
            />
        </div>
    );
};

export default QuotationEditor;
