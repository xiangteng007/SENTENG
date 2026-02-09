/**
 * 請款管理頁面 (Payments.jsx)
 * 請款單列表與編輯器
 */

import { useState, useEffect, useMemo } from 'react';
import { useConfirm } from '../components/common/useConfirm';
import {
    FileText, Plus, Search, Receipt, Clock, CheckCircle, TrendingUp
} from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';
import PaymentService, {
    PAYMENT_STATUS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_COLORS,
    PAYMENT_TYPES,
    PAYMENT_TYPE_LABELS,
    calculateRetention,
} from '../services/PaymentService';

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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[status]}`}>
        {PAYMENT_STATUS_LABELS[status]}
    </span>
);

const TypeBadge = ({ type }) => (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {PAYMENT_TYPE_LABELS[type]}
    </span>
);

// ============================================
// 統計卡片
// ============================================
const StatCard = ({ icon: Icon, label, value, color = 'gray', subValue }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
                <Icon size={20} className={`text-${color}-600`} />
            </div>
            <div className="flex-1">
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
                {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
            </div>
        </div>
    </div>
);

// ============================================
// 請款單編輯器
// ============================================
const PaymentEditor = ({ payment, onSave, onBack, addToast }) => {
    const [formData, setFormData] = useState({
        title: payment?.title || '',
        type: payment?.type || PAYMENT_TYPES.PROGRESS,
        description: payment?.description || '',
        projectName: payment?.projectName || '',
        customerName: payment?.customerName || '',
        contractAmount: payment?.contractAmount || 0,
        previousPaidAmount: payment?.previousPaidAmount || 0,
        requestAmount: payment?.requestAmount || 0,
        retentionRate: payment?.retentionRate || 5,
        dueDate: payment?.dueDate?.split('T')[0] || '',
        invoiceNo: payment?.invoiceNo || '',
        items: payment?.items || [],
    });
    const [isSaving, setIsSaving] = useState(false);

    const isEditable = !payment || payment.status === PAYMENT_STATUS.DRAFT;

    // 計算金額
    const retentionAmount = calculateRetention(formData.requestAmount, formData.retentionRate);
    const payableAmount = formData.requestAmount - retentionAmount;
    const remainingAmount = formData.contractAmount - formData.previousPaidAmount - formData.requestAmount;

    const handleSave = async () => {
        if (!formData.title.trim()) {
            addToast?.('error', '請輸入請款單標題');
            return;
        }
        if (formData.requestAmount <= 0) {
            addToast?.('error', '請輸入請款金額');
            return;
        }

        setIsSaving(true);
        try {
            if (payment?.id) {
                await PaymentService.updatePayment(payment.id, formData);
            } else {
                await PaymentService.createPayment(formData);
            }
            addToast?.('success', '儲存成功');
            onSave?.();
        } catch (error) {
            console.error('Save error:', error);
            addToast?.('error', '儲存失敗');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        await handleSave();
        if (payment?.id) {
            try {
                await PaymentService.submitForReview(payment.id, 'current-user');
                addToast?.('success', '已送出審核');
                onSave?.();
            } catch (error) {
                addToast?.('error', '送出失敗');
            }
        }
    };

    const handleApprove = async () => {
        try {
            await PaymentService.approve(payment.id, 'current-user');
            addToast?.('success', '已核准');
            onSave?.();
        } catch (error) {
            addToast?.('error', '核准失敗');
        }
    };

    const handleCreateInvoice = async () => {
        const invoiceNo = prompt('請輸入發票號碼：');
        if (invoiceNo) {
            try {
                await PaymentService.createInvoice(payment.id, invoiceNo);
                addToast?.('success', '已開立發票');
                onSave?.();
            } catch (error) {
                addToast?.('error', '開票失敗');
            }
        }
    };

    const handleRecordReceipt = async () => {
        const amount = prompt('請輸入收款金額：', payableAmount.toString());
        if (amount) {
            try {
                await PaymentService.recordReceipt(payment.id, parseFloat(amount));
                addToast?.('success', '已記錄收款');
                onSave?.();
            } catch (error) {
                addToast?.('error', '記錄失敗');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* 頂部導航 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
                        ← 返回
                    </button>
                    <div>
                        <h2 className="text-xl font-bold">
                            {payment?.paymentNo || '新增請款單'}
                        </h2>
                        {payment?.projectName && (
                            <p className="text-sm text-gray-500">{payment.projectName}</p>
                        )}
                    </div>
                    {payment && <StatusBadge status={payment.status} />}
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
                            {payment?.id && (
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    送出審核
                                </button>
                            )}
                        </>
                    )}
                    {payment?.status === PAYMENT_STATUS.PENDING && (
                        <button
                            onClick={handleApprove}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            核准
                        </button>
                    )}
                    {payment?.status === PAYMENT_STATUS.APPROVED && (
                        <button
                            onClick={handleCreateInvoice}
                            className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-800"
                        >
                            開立發票
                        </button>
                    )}
                    {(payment?.status === PAYMENT_STATUS.INVOICED || payment?.status === PAYMENT_STATUS.PARTIAL) && (
                        <button
                            onClick={handleRecordReceipt}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            記錄收款
                        </button>
                    )}
                </div>
            </div>

            {/* 基本資訊 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-4">基本資訊</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">請款標題</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            disabled={!isEditable}
                            placeholder="例：第一期工程款"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">請款類型</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">請款日期</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">專案名稱</label>
                        <input
                            type="text"
                            value={formData.projectName}
                            onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                            disabled={!isEditable}
                            placeholder="輸入專案名稱"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">客戶名稱</label>
                        <input
                            type="text"
                            value={formData.customerName}
                            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                            disabled={!isEditable}
                            placeholder="輸入客戶名稱"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* 金額資訊 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-4">金額資訊</h3>
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">合約總金額</label>
                        <input
                            type="number"
                            value={formData.contractAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, contractAmount: parseFloat(e.target.value) || 0 }))}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border rounded-lg text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">前期已請金額</label>
                        <input
                            type="number"
                            value={formData.previousPaidAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, previousPaidAmount: parseFloat(e.target.value) || 0 }))}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border rounded-lg text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">本期請款金額</label>
                        <input
                            type="number"
                            value={formData.requestAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, requestAmount: parseFloat(e.target.value) || 0 }))}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 border rounded-lg text-right font-semibold"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">保留款比例 (%)</label>
                        <input
                            type="number"
                            value={formData.retentionRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, retentionRate: parseFloat(e.target.value) || 0 }))}
                            disabled={!isEditable}
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 border rounded-lg text-right"
                        />
                    </div>
                </div>
            </div>

            {/* 金額摘要 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 text-white">
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">本期請款</p>
                        <p className="text-xl font-bold">{formatCurrency(formData.requestAmount)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">保留款 ({formData.retentionRate}%)</p>
                        <p className="text-xl font-bold text-red-400">-{formatCurrency(retentionAmount)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">應付金額</p>
                        <p className="text-xl font-bold text-green-400">{formatCurrency(payableAmount)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">剩餘未請</p>
                        <p className="text-xl font-bold text-orange-400">{formatCurrency(remainingAmount)}</p>
                    </div>
                </div>
                {payment?.receivedAmount > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20 text-center">
                        <p className="text-gray-400 text-sm">已收款金額</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(payment.receivedAmount)}</p>
                    </div>
                )}
            </div>

            {/* 備註 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-4">備註說明</h3>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!isEditable}
                    placeholder="請款說明、施工進度等..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                />
            </div>
        </div>
    );
};

// ============================================
// 請款單列表
// ============================================
const PaymentList = ({ onEdit, _onBack, addToast }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const { confirm, ConfirmDialog } = useConfirm();

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await PaymentService.getPayments();
            setPayments(data);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    // 篩選
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    p.paymentNo?.toLowerCase().includes(term) ||
                    p.title?.toLowerCase().includes(term) ||
                    p.projectName?.toLowerCase().includes(term) ||
                    p.customerName?.toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [payments, statusFilter, searchTerm]);

    // 統計
    const stats = useMemo(() => {
        const total = payments.length;
        const pending = payments.filter(p => p.status === PAYMENT_STATUS.PENDING).length;
        const invoiced = payments.filter(p => p.status === PAYMENT_STATUS.INVOICED).length;
        const totalRequested = payments.reduce((sum, p) => sum + (p.requestAmount || 0), 0);
        const totalReceived = payments.reduce((sum, p) => sum + (p.receivedAmount || 0), 0);

        return { total, pending, invoiced, totalRequested, totalReceived };
    }, [payments]);

    const handleCreate = () => {
        onEdit(null);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: '確認刪除',
            message: '確定要刪除此請款單？此操作無法復原。',
            type: 'danger',
            confirmText: '刪除',
        });
        if (!confirmed) return;
        try {
            await PaymentService.deletePayment(id);
            addToast?.('success', '已刪除');
            loadPayments();
        } catch (error) {
            addToast?.('error', error.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* 標題 */}
            <div className="flex items-center justify-between">
                <SectionTitle
                    icon={Receipt}
                    title="請款管理"
                    subtitle="管理專案請款與收款"
                />
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 flex items-center gap-2"
                >
                    <Plus size={18} /> 新增請款單
                </button>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={FileText} label="全部請款單" value={stats.total} color="gray" />
                <StatCard icon={Clock} label="待審核" value={stats.pending} color="yellow" />
                <StatCard icon={Receipt} label="已開票" value={stats.invoiced} color="purple" />
                <StatCard icon={TrendingUp} label="總請款金額" value={formatCurrency(stats.totalRequested)} color="blue" />
                <StatCard icon={CheckCircle} label="已收款金額" value={formatCurrency(stats.totalReceived)} color="green" />
            </div>

            {/* 搜尋與篩選 */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜尋請款單編號、專案、客戶..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
                >
                    <option value="ALL">全部狀態</option>
                    {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* 請款單列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">請款單號</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">標題</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">專案/客戶</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">類型</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">狀態</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">請款金額</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">已收金額</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">到期日</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map(payment => (
                            <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{payment.paymentNo}</td>
                                <td className="py-3 px-4">{payment.title}</td>
                                <td className="py-3 px-4">
                                    <div className="text-sm">{payment.projectName}</div>
                                    <div className="text-xs text-gray-400">{payment.customerName}</div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <TypeBadge type={payment.type} />
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <StatusBadge status={payment.status} />
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-blue-600">
                                    {formatCurrency(payment.requestAmount)}
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-green-600">
                                    {formatCurrency(payment.receivedAmount)}
                                </td>
                                <td className="py-3 px-4 text-center text-sm text-gray-500">
                                    {formatDate(payment.dueDate)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => onEdit(payment)}
                                            className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            {payment.status === PAYMENT_STATUS.DRAFT ? '編輯' : '查看'}
                                        </button>
                                        {payment.status === PAYMENT_STATUS.DRAFT && (
                                            <button
                                                onClick={() => handleDelete(payment.id)}
                                                className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                            >
                                                刪除
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading ? (
                    <div className="text-center py-8 text-gray-400">載入中...</div>
                ) : filteredPayments.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        尚無請款單，請點擊「新增請款單」建立
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
const Payments = ({ addToast }) => {
    const [viewMode, setViewMode] = useState('list');
    const [selectedPayment, setSelectedPayment] = useState(null);

    const handleEdit = (payment) => {
        setSelectedPayment(payment);
        setViewMode('editor');
    };

    const handleBack = () => {
        setSelectedPayment(null);
        setViewMode('list');
    };

    if (viewMode === 'editor') {
        return (
            <PaymentEditor
                payment={selectedPayment}
                onSave={handleBack}
                onBack={handleBack}
                addToast={addToast}
            />
        );
    }

    return (
        <PaymentList
            onEdit={handleEdit}
            addToast={addToast}
        />
    );
};

export default Payments;
