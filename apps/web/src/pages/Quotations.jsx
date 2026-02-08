/**
 * 估價單列表與管理頁面
 * Quotations.jsx
 */

import { useState, useEffect, useMemo } from 'react';
import {
    FileText, Plus, Search, Edit2, Eye, DollarSign
} from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';

import QuotationEditor from './QuotationEditor';
import { useConfirm } from '../components/common/useConfirm';
import QuotationService, {
    QUOTATION_STATUS,
    QUOTATION_STATUS_LABELS,
} from '../services/QuotationService';

import NewQuotationModal from '../components/quotations/NewQuotationModal';
import QuotationCard from '../components/quotations/QuotationCard';

// ============================================
// 主頁面
// ============================================
const Quotations = ({ addToast, projects = [], clients = [] }) => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // list / editor
    const { confirm, ConfirmDialog } = useConfirm();

    // 載入估價單
    useEffect(() => {
        loadQuotations();
    }, []);

    const loadQuotations = async () => {
        setLoading(true);
        try {
            const data = await QuotationService.getQuotations();
            setQuotations(data);
        } catch (error) {
            console.error('Failed to load quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    // 篩選估價單
    const filteredQuotations = useMemo(() => {
        return quotations.filter(q => {
            // 狀態篩選
            if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
            // 搜尋
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    q.quotationNo?.toLowerCase().includes(term) ||
                    q.title?.toLowerCase().includes(term) ||
                    q.customerName?.toLowerCase().includes(term) ||
                    q.projectName?.toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [quotations, statusFilter, searchTerm]);

    // 統計
    const stats = useMemo(() => {
        const total = quotations.length;
        const draft = quotations.filter(q => q.status === QUOTATION_STATUS.DRAFT).length;
        const pending = quotations.filter(q => q.status === QUOTATION_STATUS.PENDING).length;
        const approved = quotations.filter(q => q.status === QUOTATION_STATUS.APPROVED).length;
        const totalAmount = quotations
            .filter(q => [QUOTATION_STATUS.APPROVED, QUOTATION_STATUS.SENT, QUOTATION_STATUS.ACCEPTED].includes(q.status))
            .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

        return { total, draft, pending, approved, totalAmount };
    }, [quotations]);

    // 新增估價單
    const handleCreate = async (data) => {
        try {
            const newQuotation = await QuotationService.createQuotation(data);
            loadQuotations();
            // 自動進入編輯模式
            setSelectedQuotation(newQuotation);
            setViewMode('editor');
        } catch (error) {
            console.error('Failed to create quotation:', error);
        }
    };

    // 複製估價單
    const handleCopy = async (quotation) => {
        const confirmed = await confirm({
            title: '確認複製',
            message: `確定要複製估價單「${quotation.title}」嗎？`,
            type: 'info',
            confirmText: '複製',
        });
        if (confirmed) {
            try {
                await QuotationService.copyQuotation(quotation.id);
                loadQuotations();
            } catch (error) {
                console.error('Failed to copy quotation:', error);
            }
        }
    };

    // 刪除估價單
    const handleDelete = async (quotation) => {
        const confirmed = await confirm({
            title: '確認刪除',
            message: `確定要刪除估價單「${quotation.title}」嗎？此操作無法復原。`,
            type: 'danger',
            confirmText: '刪除',
        });
        if (confirmed) {
            try {
                await QuotationService.deleteQuotation(quotation.id);
                loadQuotations();
            } catch (error) {
                console.error('Failed to delete quotation:', error);
            }
        }
    };

    // 編輯估價單
    const handleEdit = (quotation) => {
        setSelectedQuotation(quotation);
        setViewMode('editor');
    };

    // 檢視估價單
    const handleView = (quotation) => {
        setSelectedQuotation(quotation);
        setViewMode('editor');
    };

    // 返回列表
    const handleBack = () => {
        setSelectedQuotation(null);
        setViewMode('list');
        loadQuotations(); // 重新載入
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // 編輯模式
    if (viewMode === 'editor' && selectedQuotation) {
        return (
            <QuotationEditor
                quotationId={selectedQuotation.id}
                onBack={handleBack}
                addToast={addToast}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* 標題與操作 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionTitle
                    icon={FileText}
                    title="估價單管理"
                    subtitle="建立與管理專案報價"
                />
                <button
                    onClick={() => setShowNewModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-md"
                >
                    <Plus size={18} />
                    新增估價單
                </button>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">全部估價單</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">草稿中</div>
                    <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">待審核</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">已核准</div>
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 col-span-2 lg:col-span-1">
                    <div className="text-sm text-gray-500 mb-1">已核准金額</div>
                    <div className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalAmount)}</div>
                </div>
            </div>

            {/* 搜尋與篩選 */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜尋估價單編號、標題、客戶..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white min-w-[140px]"
                >
                    <option value="ALL">全部狀態</option>
                    {Object.entries(QUOTATION_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* 估價單列表 */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">
                    載入中...
                </div>
            ) : filteredQuotations.length === 0 ? (
                <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                        {searchTerm || statusFilter !== 'ALL' ? '沒有符合條件的估價單' : '尚無估價單'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm || statusFilter !== 'ALL'
                            ? '請調整搜尋條件或篩選條件'
                            : '點擊上方按鈕建立您的第一張估價單'}
                    </p>
                    {!searchTerm && statusFilter === 'ALL' && (
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            建立估價單
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredQuotations.map(quotation => (
                        <QuotationCard
                            key={quotation.id}
                            quotation={quotation}
                            onView={handleView}
                            onEdit={handleEdit}
                            onCopy={handleCopy}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* 新增 Modal */}
            <NewQuotationModal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                onSubmit={handleCreate}
                projects={projects}
                customers={clients}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog />
        </div>
    );
};

export default Quotations;
