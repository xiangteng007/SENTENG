// React 17+ JSX transform
import { useConfirm } from '../common/useConfirm';
import ContractService, {
    CONTRACT_STATUS,
    CONTRACT_TYPE_LABELS,
} from '../../services/ContractService';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from './contractUtils';

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

export default ContractDetail;
