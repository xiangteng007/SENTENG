/**
 * 合約管理頁面 (Contracts.jsx)
 * 合約列表與詳情
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useConfirm } from '../components/common/ConfirmModal';
import {
    FileText, Plus, Search, Eye, Edit2, Trash2, CheckCircle,
    Clock, AlertCircle, Building2, Users, Calendar, DollarSign,
    FileSignature, Shield, TrendingUp, ArrowRight
} from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';
import ContractService, {
    CONTRACT_STATUS,
    CONTRACT_STATUS_LABELS,
    CONTRACT_STATUS_COLORS,
    CONTRACT_TYPES,
    CONTRACT_TYPE_LABELS,
    PAYMENT_TERM_TEMPLATES,
} from '../services/ContractService';
import { QuotationService, QUOTATION_STATUS } from '../services/QuotationService';

// ============================================
// 格式化函數
// ============================================
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[status]}`}>
        {CONTRACT_STATUS_LABELS[status]}
    </span>
);

// ============================================
// 統計卡片
// ============================================
const StatCard = ({ icon: Icon, label, value, color = 'gray' }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
                <Icon size={20} className={`text-${color}-600`} />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
            </div>
        </div>
    </div>
);

// ============================================
// 從估價單建立合約 Modal
// ============================================
const CreateContractModal = ({ isOpen, onClose, onSubmit, addToast }) => {
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [formData, setFormData] = useState({
        type: CONTRACT_TYPES.LUMP_SUM,
        paymentTemplateId: 'standard-3',
        warrantyMonths: 12,
        retentionRate: 5,
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadQuotations();
        }
    }, [isOpen]);

    const loadQuotations = async () => {
        const data = await QuotationService.getQuotations();
        // 只顯示已核准但尚未成交的估價單
        const available = data.filter(q =>
            q.status === QUOTATION_STATUS.APPROVED ||
            q.status === QUOTATION_STATUS.SENT
        );
        setQuotations(available);
    };

    const handleSubmit = async () => {
        if (!selectedQuotation) {
            addToast?.('error', '請選擇估價單');
            return;
        }

        const paymentTerms = PAYMENT_TERM_TEMPLATES.find(t => t.id === formData.paymentTemplateId)?.terms;

        try {
            await onSubmit(selectedQuotation.id, {
                ...formData,
                paymentTerms,
            });
            onClose();
        } catch (error) {
            addToast?.('error', '建立合約失敗');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <FileText size={20} className="text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">從估價單建立合約</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* 選擇估價單 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            選擇估價單 <span className="text-red-500">*</span>
                        </label>
                        {quotations.length === 0 ? (
                            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                                沒有可用的已核准估價單
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {quotations.map(q => (
                                    <button
                                        key={q.id}
                                        onClick={() => setSelectedQuotation(q)}
                                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${selectedQuotation?.id === q.id
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{q.title}</p>
                                                <p className="text-sm text-gray-500">{q.quotationNo} · {q.customerName}</p>
                                            </div>
                                            <span className="text-lg font-bold text-orange-600">
                                                {formatCurrency(q.totalAmount)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 合約類型 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">合約類型</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                {Object.entries(CONTRACT_TYPE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">付款條件</label>
                            <select
                                value={formData.paymentTemplateId}
                                onChange={(e) => setFormData(prev => ({ ...prev, paymentTemplateId: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                {PAYMENT_TERM_TEMPLATES.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 其他設定 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">保固期 (月)</label>
                            <input
                                type="number"
                                value={formData.warrantyMonths}
                                onChange={(e) => setFormData(prev => ({ ...prev, warrantyMonths: parseInt(e.target.value) || 12 }))}
                                className="w-full px-3 py-2 border rounded-lg"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">保留款比例 (%)</label>
                            <input
                                type="number"
                                value={formData.retentionRate}
                                onChange={(e) => setFormData(prev => ({ ...prev, retentionRate: parseFloat(e.target.value) || 5 }))}
                                className="w-full px-3 py-2 border rounded-lg"
                                min="0"
                                max="20"
                            />
                        </div>
                    </div>

                    {/* 日期 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">預計開工日</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">預計完工日</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* 按鈕 */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedQuotation}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        <FileSignature size={18} />
                        建立合約
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// 合約詳情
// ============================================
const ContractDetail = ({ contract, onBack, onRefresh, addToast }) => {
    const { confirm, ConfirmDialog } = useConfirm();
    const progress = contract.currentAmount > 0
        ? Math.round((contract.paidAmount / contract.currentAmount) * 100)
        : 0;

    const handleSign = async () => {
        const confirmed = await confirm({
            title: '確認簽約',
            message: '確定要簽約嗎？簽約後合約將正式生效。',
            type: 'warning',
            confirmText: '簽約',
        });
        if (confirmed) {
            try {
                await ContractService.sign(contract.id);
                addToast?.('success', '合約已簽約');
                onRefresh?.();
            } catch (error) {
                addToast?.('error', '簽約失敗');
            }
        }
    };

    const handleComplete = async () => {
        const confirmed = await confirm({
            title: '確認完工',
            message: '確定要標記完工嗎？',
            type: 'info',
            confirmText: '標記完工',
        });
        if (confirmed) {
            try {
                await ContractService.complete(contract.id);
                addToast?.('success', '已標記完工');
                onRefresh?.();
            } catch (error) {
                addToast?.('error', '操作失敗');
            }
        }
    };

    const handleClose = async () => {
        const confirmed = await confirm({
            title: '確認結案',
            message: '確定要結案嗎？結案後將無法再變更。',
            type: 'warning',
            confirmText: '結案',
        });
        if (confirmed) {
            try {
                await ContractService.close(contract.id);
                addToast?.('success', '已結案');
                onRefresh?.();
            } catch (error) {
                addToast?.('error', '操作失敗');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* 頂部 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
                        ← 返回
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold">{contract.contractNo}</h2>
                            <StatusBadge status={contract.status} />
                        </div>
                        <p className="text-sm text-gray-500">{contract.projectName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {contract.status === CONTRACT_STATUS.DRAFT && (
                        <button
                            onClick={handleSign}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            簽約
                        </button>
                    )}
                    {contract.status === CONTRACT_STATUS.ACTIVE && (
                        <button
                            onClick={handleComplete}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            標記完工
                        </button>
                    )}
                    {contract.status === CONTRACT_STATUS.WARRANTY && (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            結案
                        </button>
                    )}
                </div>
            </div>

            {/* 金額概覽 */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">原始合約金額</p>
                    <p className="text-xl font-bold">{formatCurrency(contract.originalAmount)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">變更單金額</p>
                    <p className={`text-xl font-bold ${contract.changeOrderTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {contract.changeOrderTotal >= 0 ? '+' : ''}{formatCurrency(contract.changeOrderTotal)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">現行合約金額</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(contract.currentAmount)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">已請款金額</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(contract.paidAmount)}</p>
                </div>
            </div>

            {/* 請款進度 */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">請款進度</h3>
                    <span className="text-lg font-bold text-orange-600">{progress}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>已請 {formatCurrency(contract.paidAmount)}</span>
                    <span>未請 {formatCurrency(contract.currentAmount - contract.paidAmount)}</span>
                </div>
            </div>

            {/* 合約資訊 */}
            <div className="grid grid-cols-2 gap-6">
                {/* 基本資訊 */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="font-semibold mb-4">基本資訊</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">合約類型</span>
                            <span>{CONTRACT_TYPE_LABELS[contract.type]}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">客戶</span>
                            <span>{contract.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">來源估價單</span>
                            <span>{contract.quotationNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">保留款比例</span>
                            <span>{contract.retentionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">保固期</span>
                            <span>{contract.warrantyMonths} 個月</span>
                        </div>
                    </div>
                </div>

                {/* 日期資訊 */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h3 className="font-semibold mb-4">日期資訊</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">建立日期</span>
                            <span>{formatDate(contract.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">簽約日期</span>
                            <span>{formatDate(contract.signedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">預計開工</span>
                            <span>{formatDate(contract.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">預計完工</span>
                            <span>{formatDate(contract.endDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">保固到期</span>
                            <span>{formatDate(contract.warrantyEndDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 付款條件 */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold mb-4">付款條件</h3>
                <div className="flex gap-2">
                    {contract.paymentTerms?.map((term, index) => (
                        <div key={index} className="flex-1 p-3 bg-gray-50 rounded-lg text-center">
                            <p className="text-xs text-gray-500">{term.name}</p>
                            <p className="text-lg font-bold text-gray-800">{term.percentage}%</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog />
        </div>
    );
};

// ============================================
// 合約列表
// ============================================
const ContractList = ({ onView, addToast }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();

    const loadContracts = async () => {
        setLoading(true);
        try {
            const data = await ContractService.getContracts();
            setContracts(data);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContracts();
    }, []);

    // 篩選
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    c.contractNo?.toLowerCase().includes(term) ||
                    c.projectName?.toLowerCase().includes(term) ||
                    c.customerName?.toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [contracts, statusFilter, searchTerm]);

    // 統計
    const stats = useMemo(() => ({
        total: contracts.length,
        active: contracts.filter(c => c.status === CONTRACT_STATUS.ACTIVE).length,
        completed: contracts.filter(c => c.status === CONTRACT_STATUS.COMPLETED || c.status === CONTRACT_STATUS.WARRANTY).length,
        totalAmount: contracts.reduce((sum, c) => sum + (c.currentAmount || 0), 0),
    }), [contracts]);

    const handleCreate = async (quotationId, data) => {
        try {
            await ContractService.createFromQuotation(quotationId, data);
            addToast?.('success', '合約建立成功');
            loadContracts();
        } catch (error) {
            addToast?.('error', '建立失敗: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: '確認刪除',
            message: '確定要刪除此合約？此操作無法復原。',
            type: 'danger',
            confirmText: '刪除',
        });
        if (!confirmed) return;
        try {
            await ContractService.deleteContract(id);
            addToast?.('success', '已刪除');
            loadContracts();
        } catch (error) {
            addToast?.('error', error.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* 標題 */}
            <div className="flex items-center justify-between">
                <SectionTitle
                    icon={FileSignature}
                    title="合約管理"
                    subtitle="管理專案合約與履約追蹤"
                />
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 flex items-center gap-2"
                >
                    <Plus size={18} /> 建立合約
                </button>
            </div>

            {/* 統計 */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard icon={FileText} label="全部合約" value={stats.total} color="gray" />
                <StatCard icon={Clock} label="履約中" value={stats.active} color="blue" />
                <StatCard icon={CheckCircle} label="已完工" value={stats.completed} color="green" />
                <StatCard icon={DollarSign} label="合約總額" value={formatCurrency(stats.totalAmount)} color="orange" />
            </div>

            {/* 搜尋篩選 */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜尋合約編號、專案、客戶..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
                >
                    <option value="ALL">全部狀態</option>
                    {Object.entries(CONTRACT_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* 合約列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">合約編號</th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">專案/客戶</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">類型</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">狀態</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">合約金額</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">已請款</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">簽約日</th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContracts.map(contract => (
                            <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{contract.contractNo}</td>
                                <td className="py-3 px-4">
                                    <div className="text-sm">{contract.projectName}</div>
                                    <div className="text-xs text-gray-400">{contract.customerName}</div>
                                </td>
                                <td className="py-3 px-4 text-center text-sm">
                                    {CONTRACT_TYPE_LABELS[contract.type]}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <StatusBadge status={contract.status} />
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-blue-600">
                                    {formatCurrency(contract.currentAmount)}
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-green-600">
                                    {formatCurrency(contract.paidAmount)}
                                </td>
                                <td className="py-3 px-4 text-center text-sm text-gray-500">
                                    {formatDate(contract.signedDate)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => onView(contract)}
                                            className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            查看
                                        </button>
                                        {contract.status === CONTRACT_STATUS.DRAFT && (
                                            <button
                                                onClick={() => handleDelete(contract.id)}
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
                ) : filteredContracts.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <FileSignature size={48} className="mx-auto mb-4 opacity-30" />
                        <p>尚無合約</p>
                        <p className="text-sm">請從已核准的估價單建立合約</p>
                    </div>
                )}
            </div>

            {/* 建立合約 Modal */}
            <CreateContractModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
                addToast={addToast}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog />
        </div>
    );
};

// ============================================
// 主元件
// ============================================
const Contracts = ({ addToast }) => {
    const [viewMode, setViewMode] = useState('list');
    const [selectedContract, setSelectedContract] = useState(null);

    const handleView = (contract) => {
        setSelectedContract(contract);
        setViewMode('detail');
    };

    const handleBack = () => {
        setSelectedContract(null);
        setViewMode('list');
    };

    const handleRefresh = async () => {
        if (selectedContract) {
            const updated = await ContractService.getContract(selectedContract.id);
            setSelectedContract(updated);
        }
    };

    if (viewMode === 'detail' && selectedContract) {
        return (
            <ContractDetail
                contract={selectedContract}
                onBack={handleBack}
                onRefresh={handleRefresh}
                addToast={addToast}
            />
        );
    }

    return (
        <ContractList
            onView={handleView}
            addToast={addToast}
        />
    );
};

export default Contracts;
