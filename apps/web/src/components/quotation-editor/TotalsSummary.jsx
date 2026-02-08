/**
 * 金額摘要
 */

// React 17+ JSX transform

const TotalsSummary = ({ totals }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 text-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                    <div className="text-gray-400 text-xs mb-1">工項小計</div>
                    <div className="font-medium">{formatCurrency(totals.subtotal)}</div>
                </div>
                <div>
                    <div className="text-gray-400 text-xs mb-1">管理費</div>
                    <div className="font-medium">{formatCurrency(totals.managementFee)}</div>
                </div>
                <div>
                    <div className="text-gray-400 text-xs mb-1">利潤</div>
                    <div className="font-medium">{formatCurrency(totals.profitAmount)}</div>
                </div>
                <div>
                    <div className="text-gray-400 text-xs mb-1">稅額</div>
                    <div className="font-medium">{formatCurrency(totals.taxAmount)}</div>
                </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/20">
                <div className="flex items-center gap-3">
                    <span className="text-gray-300">報價總計</span>
                    {totals.discountAmount > 0 && (
                        <span className="text-xs text-orange-400">已折 {formatCurrency(totals.discountAmount)}</span>
                    )}
                </div>
                <div className="text-2xl font-bold text-orange-400">
                    {formatCurrency(totals.totalAmount)}
                </div>
            </div>
        </div>
    );
};

export default TotalsSummary;
