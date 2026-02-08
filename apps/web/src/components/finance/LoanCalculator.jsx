
import { useState, useMemo } from 'react';
import { Calculator, Calendar } from 'lucide-react';
import { calculateEqualPayment, calculateEqualPrincipal } from './loanCalculations';

/**
 * 貸款還款試算器
 * 支援等額本息和等額本金兩種還款方式
 */

// 還款試算器 UI 組件
export const LoanCalculator = ({
    principal = 0,
    rate = 0,
    terms = 0,
    paymentType = 'equalPayment',
    showSchedule = false,
    compact = false
}) => {
    const [showFullSchedule, setShowFullSchedule] = useState(false);

    const calculation = useMemo(() => {
        if (paymentType === 'equalPayment') {
            return calculateEqualPayment(principal, rate, terms);
        } else {
            return calculateEqualPrincipal(principal, rate, terms);
        }
    }, [principal, rate, terms, paymentType]);

    if (compact) {
        return (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Calculator size={14} />
                    <span className="text-xs font-medium">還款試算</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <div className="text-xs text-gray-500">
                            {paymentType === 'equalPayment' ? '每月還款' : '首期還款'}
                        </div>
                        <div className="font-bold text-blue-700">
                            ${paymentType === 'equalPayment'
                                ? calculation.monthlyPayment?.toLocaleString()
                                : calculation.firstPayment?.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">總利息</div>
                        <div className="font-bold text-orange-600">
                            ${calculation.totalInterest?.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 mb-4">
                <Calculator size={18} />
                <span className="font-bold">還款試算結果</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">
                        {paymentType === 'equalPayment' ? '每月還款' : '首期還款'}
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                        ${paymentType === 'equalPayment'
                            ? calculation.monthlyPayment?.toLocaleString()
                            : calculation.firstPayment?.toLocaleString()}
                    </div>
                </div>

                {paymentType === 'equalPrincipal' && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">末期還款</div>
                        <div className="text-lg font-bold text-green-600">
                            ${calculation.lastPayment?.toLocaleString()}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">總利息</div>
                    <div className="text-lg font-bold text-orange-600">
                        ${calculation.totalInterest?.toLocaleString()}
                    </div>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">總還款金額</div>
                    <div className="text-lg font-bold text-gray-800">
                        ${calculation.totalPayment?.toLocaleString()}
                    </div>
                </div>
            </div>

            {showSchedule && calculation.schedule.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowFullSchedule(!showFullSchedule)}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
                    >
                        <Calendar size={14} />
                        {showFullSchedule ? '收合還款明細' : `查看還款明細 (${terms} 期)`}
                    </button>

                    {showFullSchedule && (
                        <div className="bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left">期數</th>
                                        <th className="px-2 py-2 text-right">還款金額</th>
                                        <th className="px-2 py-2 text-right">本金</th>
                                        <th className="px-2 py-2 text-right">利息</th>
                                        <th className="px-2 py-2 text-right">剩餘本金</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculation.schedule.slice(0, showFullSchedule ? undefined : 12).map(item => (
                                        <tr key={item.term} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-2 py-1.5">{item.term}</td>
                                            <td className="px-2 py-1.5 text-right font-mono">${item.payment.toLocaleString()}</td>
                                            <td className="px-2 py-1.5 text-right font-mono text-blue-600">${item.principal.toLocaleString()}</td>
                                            <td className="px-2 py-1.5 text-right font-mono text-orange-500">${item.interest.toLocaleString()}</td>
                                            <td className="px-2 py-1.5 text-right font-mono text-gray-600">${item.remainingPrincipal.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LoanCalculator;
