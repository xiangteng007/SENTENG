import React, { useState, useEffect, useMemo } from 'react';
import {
    DollarSign, Plus, Search, Filter, Calendar, Building2,
    User, FileText, Check, Clock, AlertCircle, TrendingUp,
    Edit, Trash2, X, Save, CreditCard, Download, RotateCcw
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { InputField } from '../components/common/InputField';
import { SectionTitle } from '../components/common/Indicators';
import { costEntriesApi, projectsApi, vendorsApi } from '../services/api';

// 成本類別配置
const CATEGORY_CONFIG = {
    'MATERIAL': { label: '材料費', icon: Building2, color: 'blue' },
    'LABOR': { label: '工資', icon: User, color: 'orange' },
    'EQUIPMENT': { label: '設備費', icon: Clock, color: 'purple' },
    'SUBCONTRACT': { label: '外包費', icon: FileText, color: 'green' },
    'OVERHEAD': { label: '管銷費', icon: TrendingUp, color: 'gray' },
    'OTHER': { label: '其他', icon: DollarSign, color: 'red' },
};

// 付款狀態配置
const PAYMENT_STATUS = {
    'UNPAID': { label: '未付款', color: 'red', icon: AlertCircle },
    'PARTIAL': { label: '部分付款', color: 'yellow', icon: Clock },
    'PAID': { label: '已付款', color: 'green', icon: Check },
};

// 統計卡片組件
function StatCard({ icon: Icon, label, value, color = 'gray', subValue }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        orange: 'bg-orange-50 text-orange-600 border-orange-200',
        purple: 'bg-purple-50 text-zinc-700 border-purple-200',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} transition-all hover:shadow-md`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/60`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm opacity-80">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                    {subValue && <p className="text-xs opacity-60">{subValue}</p>}
                </div>
            </div>
        </div>
    );
}

// 成本項目行組件
function CostEntryRow({ entry, onEdit, onDelete, onMarkPaid }) {
    const category = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.OTHER;
    const status = PAYMENT_STATUS[entry.paymentStatus] || PAYMENT_STATUS.UNPAID;
    const CategoryIcon = category.icon;
    const StatusIcon = status.icon;

    return (
        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-${category.color}-100`}>
                        <CategoryIcon className={`w-5 h-5 text-${category.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{entry.description}</h4>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {entry.date}
                            </span>
                            {entry.vendorName && (
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {entry.vendorName}
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs bg-${category.color}-100 text-${category.color}-700`}>
                                {category.label}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                        ${entry.amount?.toLocaleString() || 0}
                    </p>
                    <div className={`flex items-center gap-1 text-xs mt-1 text-${status.color}-600`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                {entry.paymentStatus !== 'PAID' && (
                    <button
                        onClick={() => onMarkPaid(entry)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
                    >
                        <CreditCard className="w-3 h-3" /> 標記已付
                    </button>
                )}
                <button
                    onClick={() => onEdit(entry)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                    <Edit className="w-3 h-3" /> 編輯
                </button>
                <button
                    onClick={() => onDelete(entry)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" /> 刪除
                </button>
            </div>
        </div>
    );
}

export default function CostEntries({ addToast }) {
    // 狀態
    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 篩選狀態
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Modal 狀態
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null);

    // 表單狀態
    const [formData, setFormData] = useState({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        category: 'MATERIAL',
        description: '',
        vendorId: '',
        vendorName: '',
        amount: '',
        invoiceNo: '',
        notes: '',
    });

    // 載入資料
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [entriesRes, projectsRes, vendorsRes] = await Promise.all([
                costEntriesApi.getAll(),
                projectsApi.getAll(),
                vendorsApi.getAll(),
            ]);

            const entriesList = Array.isArray(entriesRes) ? entriesRes : (entriesRes.items || []);
            const projectsList = Array.isArray(projectsRes) ? projectsRes : (projectsRes.items || []);
            const vendorsList = Array.isArray(vendorsRes) ? vendorsRes : (vendorsRes.items || []);

            setEntries(entriesList);
            setProjects(projectsList);
            setVendors(vendorsList);
            console.log('✅ Cost entries loaded:', entriesList.length);
        } catch (err) {
            console.error('❌ Failed to load cost entries:', err);
            setError(err.message);
            addToast?.('載入成本資料失敗', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 篩選後的資料
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            if (searchTerm && !entry.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            if (filterProject && entry.projectId !== filterProject) {
                return false;
            }
            if (filterCategory && entry.category !== filterCategory) {
                return false;
            }
            if (filterStatus && entry.paymentStatus !== filterStatus) {
                return false;
            }
            // Date range filter
            if (filterDateFrom && entry.date < filterDateFrom) {
                return false;
            }
            if (filterDateTo && entry.date > filterDateTo) {
                return false;
            }
            return true;
        });
    }, [entries, searchTerm, filterProject, filterCategory, filterStatus, filterDateFrom, filterDateTo]);

    // 統計資料
    const stats = useMemo(() => {
        const total = filteredEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
        const paid = filteredEntries.filter(e => e.paymentStatus === 'PAID').reduce((sum, e) => sum + (e.amount || 0), 0);
        const unpaid = filteredEntries.filter(e => e.paymentStatus === 'UNPAID').reduce((sum, e) => sum + (e.amount || 0), 0);
        const byCategory = {};
        filteredEntries.forEach(e => {
            byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0);
        });
        return { total, paid, unpaid, byCategory, count: filteredEntries.length };
    }, [filteredEntries]);

    // 開啟新增 Modal
    const handleOpenAdd = () => {
        setEditingEntry(null);
        setFormData({
            projectId: filterProject || '',
            date: new Date().toISOString().split('T')[0],
            category: 'MATERIAL',
            description: '',
            vendorId: '',
            vendorName: '',
            amount: '',
            invoiceNo: '',
            notes: '',
        });
        setShowAddModal(true);
    };

    // 開啟編輯 Modal
    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setFormData({
            projectId: entry.projectId || '',
            date: entry.date || new Date().toISOString().split('T')[0],
            category: entry.category || 'MATERIAL',
            description: entry.description || '',
            vendorId: entry.vendorId || '',
            vendorName: entry.vendorName || '',
            amount: entry.amount?.toString() || '',
            invoiceNo: entry.invoiceNo || '',
            notes: entry.notes || '',
        });
        setShowAddModal(true);
    };

    // 儲存成本項目
    const handleSave = async () => {
        if (!formData.projectId || !formData.description || !formData.amount) {
            addToast?.('請填寫必要欄位（專案、說明、金額）', 'error');
            return;
        }

        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
            };

            if (editingEntry) {
                await costEntriesApi.update(editingEntry.id, payload);
                addToast?.('成本項目已更新', 'success');
            } else {
                await costEntriesApi.create(payload);
                addToast?.('成本項目已新增', 'success');
            }

            setShowAddModal(false);
            loadData();
        } catch (err) {
            console.error('Failed to save cost entry:', err);
            addToast?.(`儲存失敗: ${err.message}`, 'error');
        }
    };

    // 刪除成本項目
    const handleDelete = async () => {
        if (!entryToDelete) return;

        try {
            await costEntriesApi.delete(entryToDelete.id);
            addToast?.('成本項目已刪除', 'success');
            setShowDeleteModal(false);
            setEntryToDelete(null);
            loadData();
        } catch (err) {
            console.error('Failed to delete cost entry:', err);
            addToast?.(`刪除失敗: ${err.message}`, 'error');
        }
    };

    // 標記已付款
    const handleMarkPaid = async (entry) => {
        try {
            await costEntriesApi.markPaid(entry.id, { paidDate: new Date().toISOString() });
            addToast?.('已標記為已付款', 'success');
            loadData();
        } catch (err) {
            console.error('Failed to mark as paid:', err);
            addToast?.(`標記失敗: ${err.message}`, 'error');
        }
    };

    // 開啟刪除確認
    const openDeleteModal = (entry) => {
        setEntryToDelete(entry);
        setShowDeleteModal(true);
    };

    // 清除所有篩選
    const clearFilters = () => {
        setSearchTerm('');
        setFilterProject('');
        setFilterCategory('');
        setFilterStatus('');
        setFilterDateFrom('');
        setFilterDateTo('');
    };

    // 匯出 CSV
    const exportToCSV = () => {
        const headers = ['日期', '專案', '類別', '說明', '廠商', '金額', '發票號碼', '付款狀態', '備註'];
        const rows = filteredEntries.map(entry => {
            const project = projects.find(p => p.id === entry.projectId);
            const category = CATEGORY_CONFIG[entry.category]?.label || entry.category;
            const status = PAYMENT_STATUS[entry.paymentStatus]?.label || entry.paymentStatus;
            return [
                entry.date,
                project?.name || '-',
                category,
                entry.description,
                entry.vendorName || '-',
                entry.amount,
                entry.invoiceNo || '-',
                status,
                entry.notes || '-'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `成本紀錄_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        addToast?.('CSV 匯出成功', 'success');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionTitle icon={DollarSign} title="成本追蹤" />
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportToCSV}
                        disabled={filteredEntries.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        匯出
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        新增成本
                    </button>
                </div>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="總成本"
                    value={`$${stats.total.toLocaleString()}`}
                    color="blue"
                    subValue={`${stats.count} 筆`}
                />
                <StatCard
                    icon={Check}
                    label="已付款"
                    value={`$${stats.paid.toLocaleString()}`}
                    color="green"
                />
                <StatCard
                    icon={AlertCircle}
                    label="未付款"
                    value={`$${stats.unpaid.toLocaleString()}`}
                    color="red"
                />
                <StatCard
                    icon={TrendingUp}
                    label="材料費佔比"
                    value={`${stats.total > 0 ? Math.round((stats.byCategory['MATERIAL'] || 0) / stats.total * 100) : 0}%`}
                    color="purple"
                />
            </div>

            {/* 篩選區 */}
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜尋說明..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">所有專案</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">所有類別</option>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">所有狀態</option>
                    {Object.entries(PAYMENT_STATUS).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">期間:</span>
                    <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <span className="text-gray-400">~</span>
                    <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                {(searchTerm || filterProject || filterCategory || filterStatus || filterDateFrom || filterDateTo) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        清除篩選
                    </button>
                )}
            </div>

            {/* 成本列表 */}
            {error ? (
                <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>載入失敗: {error}</p>
                    <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
                        重試
                    </button>
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-xl">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">尚無成本紀錄</p>
                    <p className="text-sm mt-2">點擊「新增成本」開始記錄專案支出</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredEntries.map(entry => (
                        <CostEntryRow
                            key={entry.id}
                            entry={entry}
                            onEdit={handleEdit}
                            onDelete={openDeleteModal}
                            onMarkPaid={handleMarkPaid}
                        />
                    ))}
                </div>
            )}

            {/* 新增/編輯 Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title={editingEntry ? '編輯成本項目' : '新增成本項目'}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">專案 *</label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">選擇專案</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <InputField
                            label="日期"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">類別</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                        <InputField
                            label="金額 *"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="輸入金額"
                        />
                    </div>

                    <InputField
                        label="說明 *"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="成本項目說明"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">廠商</label>
                            <select
                                value={formData.vendorId}
                                onChange={(e) => {
                                    const vendor = vendors.find(v => v.id === e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        vendorId: e.target.value,
                                        vendorName: vendor?.name || '',
                                    }));
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">選擇廠商</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                        <InputField
                            label="發票號碼"
                            value={formData.invoiceNo}
                            onChange={(e) => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                            placeholder="選填"
                        />
                    </div>

                    <InputField
                        label="備註"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="其他備註"
                        multiline
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingEntry ? '更新' : '新增'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* 刪除確認 Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="確認刪除"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        確定要刪除成本項目「{entryToDelete?.description}」嗎？此操作無法復原。
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            確認刪除
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
