import { useState, useEffect, useMemo } from 'react';
import { useConfirm } from '../common/useConfirm';
import {
    FileText, Plus, Search, CheckCircle, Clock, DollarSign, FileSignature
} from 'lucide-react';
import { SectionTitle } from '../common/Indicators';
import ContractService, {
    CONTRACT_STATUS,
    CONTRACT_STATUS_LABELS,
    CONTRACT_TYPE_LABELS,
} from '../../services/ContractService';
import StatusBadge from './StatusBadge';
import StatCard from './StatCard';
import CreateContractModal from './CreateContractModal';
import { formatCurrency, formatDate } from './contractUtils';

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

export default ContractList;
