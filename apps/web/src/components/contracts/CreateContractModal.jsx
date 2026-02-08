import React, { useState, useEffect } from 'react';
import { FileText, FileSignature, X } from 'lucide-react';
import ContractService, {
    CONTRACT_TYPES,
    CONTRACT_TYPE_LABELS,
    PAYMENT_TERM_TEMPLATES,
} from '../../services/ContractService';
import { QuotationService, QUOTATION_STATUS } from '../../services/QuotationService';
import { formatCurrency } from './contractUtils';

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

export default CreateContractModal;
