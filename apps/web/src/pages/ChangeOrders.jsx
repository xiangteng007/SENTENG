/**
 * 工程變更單頁面 (ChangeOrders.jsx)
 * 變更單列表與編輯器
 */

import { useState, useEffect } from 'react';
import { useConfirm } from '../components/common/useConfirm';
import {
    ChangeOrderService,
    CHANGE_ORDER_STATUS,
    CHANGE_ORDER_STATUS_LABELS,
    CHANGE_ORDER_STATUS_COLORS,
    CHANGE_TYPES,
    CHANGE_TYPE_LABELS,
    CHANGE_TYPE_COLORS,
    CHANGE_REASONS,
    calculateChangeOrderTotals,
} from '../services/ChangeOrderService';
import { QuotationService } from '../services/QuotationService';

// ============================================
// 格式化函數
// ============================================
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-TW');
};

// ============================================
// 狀態徽章
// ============================================
const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CHANGE_ORDER_STATUS_COLORS[status]}`}>
        {CHANGE_ORDER_STATUS_LABELS[status]}
    </span>
);

const ChangeTypeBadge = ({ type }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CHANGE_TYPE_COLORS[type]}`}>
        {CHANGE_TYPE_LABELS[type]}
    </span>
);

// ============================================
// 變更項目列
// ============================================
const ChangeItemRow = ({ item, index, onUpdate, onDelete, disabled }) => {
    const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    const originalAmount = (item.originalQuantity || 0) * (item.originalUnitPrice || 0);
    const diff = amount - originalAmount;

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">
                <select
                    value={item.changeType}
                    onChange={(e) => onUpdate(index, 'changeType', e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded text-sm"
                >
                    {Object.entries(CHANGE_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </td>
            <td className="py-3 px-4">
                <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onUpdate(index, 'name', e.target.value)}
                    disabled={disabled}
                    placeholder="項目名稱"
                    className="w-full px-2 py-1 border rounded text-sm"
                />
            </td>
            <td className="py-3 px-4">
                <input
                    type="text"
                    value={item.specification || ''}
                    onChange={(e) => onUpdate(index, 'specification', e.target.value)}
                    disabled={disabled}
                    placeholder="規格"
                    className="w-full px-2 py-1 border rounded text-sm"
                />
            </td>
            <td className="py-3 px-4">
                <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => onUpdate(index, 'unit', e.target.value)}
                    disabled={disabled}
                    className="w-20 px-2 py-1 border rounded text-sm text-center"
                />
            </td>
            <td className="py-3 px-4">
                <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-20 px-2 py-1 border rounded text-sm text-right"
                />
            </td>
            <td className="py-3 px-4">
                <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-24 px-2 py-1 border rounded text-sm text-right"
                />
            </td>
            <td className="py-3 px-4 text-right font-medium">
                {formatCurrency(amount)}
            </td>
            <td className="py-3 px-4 text-right">
                {item.changeType === CHANGE_TYPES.MODIFY && (
                    <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </span>
                )}
            </td>
            <td className="py-3 px-4">
                {!disabled && (
                    <button
                        onClick={() => onDelete(index)}
                        className="text-red-500 hover:text-red-700"
                    >
                        🗑️
                    </button>
                )}
            </td>
        </tr>
    );
};

// ============================================
// 變更單編輯器
// ============================================
const ChangeOrderEditor = ({ changeOrder, quotation, onSave, onBack, addToast }) => {
    const [formData, setFormData] = useState({
        title: changeOrder?.title || '',
        description: changeOrder?.description || '',
        reason: changeOrder?.reason || 'client_request',
        items: changeOrder?.items || [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [quotationItems, setQuotationItems] = useState([]);

    useEffect(() => {
        if (quotation?.items) {
            setQuotationItems(quotation.items.filter(i => i.type === 'ITEM'));
        }
    }, [quotation]);

    const isEditable = !changeOrder || changeOrder.status === CHANGE_ORDER_STATUS.DRAFT;

    const totals = calculateChangeOrderTotals(formData.items);
    const originalAmount = changeOrder?.originalContractAmount || quotation?.totalAmount || 0;
    const newAmount = originalAmount + totals.netChange;

    const handleAddItem = () => {
        const newItem = ChangeOrderService.createNewChangeItem();
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem],
        }));
    };

    const handleAddFromQuotation = (quotationItem, changeType) => {
        const newItem = ChangeOrderService.createChangeItemFromQuotation(quotationItem, changeType);
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem],
        }));
    };

    const handleUpdateItem = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const handleDeleteItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            addToast?.('error', '請輸入變更單標題');
            return;
        }
        if (formData.items.length === 0) {
            addToast?.('error', '請新增至少一個變更項目');
            return;
        }

        setIsSaving(true);
        try {
            if (changeOrder?.id) {
                await ChangeOrderService.updateChangeOrder(changeOrder.id, formData);
            } else {
                await ChangeOrderService.createChangeOrder({
                    ...formData,
                    quotationId: quotation.id,
                });
            }
            addToast?.('success', '儲存成功');
            onSave?.();
        } catch (error) {
            console.error('Save error:', error);
            addToast?.('error', '儲存失敗: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        await handleSave();
        try {
            await ChangeOrderService.submitForReview(changeOrder.id, 'current-user');
            addToast?.('success', '已送出審核');
            onSave?.();
        } catch (error) {
            addToast?.('error', '送出失敗');
        }
    };

    return (
        <div className="space-y-6">
            {/* 頂部導航 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        ← 返回
                    </button>
                    <div>
                        <h2 className="text-xl font-bold">
                            {changeOrder?.changeOrderNo || '新增變更單'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {quotation?.quotationNo} - {quotation?.title}
                        </p>
                    </div>
                    {changeOrder && <StatusBadge status={changeOrder.status} />}
                </div>
                <div className="flex gap-2">
                    {isEditable && (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSaving ? '儲存中...' : '儲存'}
                            </button>
                            {changeOrder?.id && (
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    送出審核
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 基本資訊 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-4">基本資訊</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">變更單標題</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            disabled={!isEditable}
                            placeholder="例：追加隔間牆工程"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">變更原因</label>
                        <select
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            {CHANGE_REASONS.map(r => (
                                <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">說明</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            disabled={!isEditable}
                            placeholder="變更原因說明"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* 變更項目 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">變更項目</h3>
                    {isEditable && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddItem}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                            >
                                ➕ 新增項目
                            </button>
                        </div>
                    )}
                </div>

                {/* 從原估價單選取 */}
                {isEditable && quotationItems.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">從原估價單選取工項：</p>
                        <div className="flex flex-wrap gap-2">
                            {quotationItems.slice(0, 10).map(item => (
                                <div key={item.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-sm">
                                    <span>{item.name}</span>
                                    <button
                                        onClick={() => handleAddFromQuotation(item, CHANGE_TYPES.MODIFY)}
                                        className="text-blue-500 hover:text-blue-700"
                                        title="變更"
                                    >
                                        📝
                                    </button>
                                    <button
                                        onClick={() => handleAddFromQuotation(item, CHANGE_TYPES.DEDUCT)}
                                        className="text-red-500 hover:text-red-700"
                                        title="減項"
                                    >
                                        ➖
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 項目表格 */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">類型</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">項目名稱</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">規格</th>
                                <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">單位</th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">數量</th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">單價</th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">金額</th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">差額</th>
                                <th className="py-3 px-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.items.map((item, index) => (
                                <ChangeItemRow
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onUpdate={handleUpdateItem}
                                    onDelete={handleDeleteItem}
                                    disabled={!isEditable}
                                />
                            ))}
                        </tbody>
                    </table>
                    {formData.items.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            尚無變更項目，請點擊「新增項目」或從原估價單選取
                        </div>
                    )}
                </div>
            </div>

            {/* 金額摘要 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-4">金額摘要</h3>
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500">原合約金額</p>
                        <p className="text-xl font-bold">{formatCurrency(originalAmount)}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-sm text-green-600">追加金額</p>
                        <p className="text-xl font-bold text-green-600">+{formatCurrency(totals.totalAdded)}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                        <p className="text-sm text-red-600">減項金額</p>
                        <p className="text-xl font-bold text-red-600">-{formatCurrency(totals.totalDeducted)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-sm text-blue-600">變更後總價</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(newAmount)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// 變更單列表
// ============================================
const ChangeOrderList = ({ quotationId, onEdit, onBack, addToast }) => {
    const [changeOrders, setChangeOrders] = useState([]);
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cumulative, setCumulative] = useState({ totalAdded: 0, totalDeducted: 0, netChange: 0, count: 0 });
    const { confirm, ConfirmDialog } = useConfirm();

    const loadData = async () => {
        try {
            const [orders, quo, cum] = await Promise.all([
                ChangeOrderService.getChangeOrders(quotationId),
                QuotationService.getQuotation(quotationId),
                ChangeOrderService.getCumulativeChanges(quotationId),
            ]);
            setChangeOrders(orders);
            setQuotation(quo);
            setCumulative(cum);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [quotationId]);

    const handleCreate = async () => {
        const newOrder = await ChangeOrderService.createChangeOrder({
            quotationId,
            title: `第 ${changeOrders.length + 1} 次變更`,
        });
        onEdit(newOrder, quotation);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: '確認刪除',
            message: '確定要刪除此變更單？此操作無法復原。',
            type: 'danger',
            confirmText: '刪除',
        });
        if (!confirmed) return;
        try {
            await ChangeOrderService.deleteChangeOrder(id);
            addToast?.('success', '已刪除');
            loadData();
        } catch (error) {
            addToast?.('error', error.message);
        }
    };

    if (loading) {
        return <div className="text-center py-8">載入中...</div>;
    }

    return (
        <div className="space-y-6">
            {/* 頂部 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
                        ← 返回
                    </button>
                    <div>
                        <h2 className="text-xl font-bold">工程變更單</h2>
                        <p className="text-sm text-gray-500">
                            {quotation?.quotationNo} - {quotation?.title}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    ➕ 新增變更單
                </button>
            </div>

            {/* 累計統計 */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">變更單數量</p>
                    <p className="text-2xl font-bold">{cumulative.count}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-green-600">累計追加</p>
                    <p className="text-2xl font-bold text-green-600">+{formatCurrency(cumulative.totalAdded)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-red-600">累計減項</p>
                    <p className="text-2xl font-bold text-red-600">-{formatCurrency(cumulative.totalDeducted)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-blue-600">淨變更</p>
                    <p className={`text-2xl font-bold ${cumulative.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cumulative.netChange >= 0 ? '+' : ''}{formatCurrency(cumulative.netChange)}
                    </p>
                </div>
            </div>

            {/* 變更單列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">變更單號</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">標題</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">原因</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">狀態</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">淨變更</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">建立日期</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {changeOrders.map(order => {
                            const reason = CHANGE_REASONS.find(r => r.id === order.reason);
                            return (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{order.changeOrderNo}</td>
                                    <td className="py-3 px-4">{order.title}</td>
                                    <td className="py-3 px-4 text-sm">
                                        {reason?.icon} {reason?.label}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className={`py-3 px-4 text-right font-medium ${order.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {order.netChange >= 0 ? '+' : ''}{formatCurrency(order.netChange)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(order, quotation)}
                                                className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                {order.status === CHANGE_ORDER_STATUS.DRAFT ? '編輯' : '查看'}
                                            </button>
                                            {order.status === CHANGE_ORDER_STATUS.DRAFT && (
                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    刪除
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {changeOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        尚無變更單，請點擊「新增變更單」建立
                    </div>
                )}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog />
        </div>
    );
};

// ============================================
// 主元件
// ============================================
const ChangeOrders = ({ quotationId, onBack, addToast }) => {
    const [viewMode, setViewMode] = useState('list'); // list | editor
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedQuotation, setSelectedQuotation] = useState(null);

    const handleEdit = (order, quotation) => {
        setSelectedOrder(order);
        setSelectedQuotation(quotation);
        setViewMode('editor');
    };

    const handleBackToList = () => {
        setSelectedOrder(null);
        setViewMode('list');
    };

    if (viewMode === 'editor') {
        return (
            <ChangeOrderEditor
                changeOrder={selectedOrder}
                quotation={selectedQuotation}
                onSave={handleBackToList}
                onBack={handleBackToList}
                addToast={addToast}
            />
        );
    }

    return (
        <ChangeOrderList
            quotationId={quotationId}
            onEdit={handleEdit}
            onBack={onBack}
            addToast={addToast}
        />
    );
};

export default ChangeOrders;
