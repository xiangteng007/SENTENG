/**
 * 模板預覽 Modal
 */

// React 17+ JSX transform
import { Eye, X } from 'lucide-react';

const TemplatePreviewModal = ({ isOpen, onClose, template }) => {
    if (!isOpen || !template) return null;

    const calculateEstimate = () => {
        let total = 0;
        template.items?.forEach(chapter => {
            chapter.children?.forEach(item => {
                total += item.unitPrice || 0;
            });
        });
        return total;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Eye size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{template.name}</h3>
                                <p className="text-sm text-white/80">{template.description}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* 內容 */}
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="space-y-4">
                        {template.items?.map((chapter, chapterIdx) => (
                            <div key={chapterIdx} className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {chapterIdx + 1}
                                    </span>
                                    {chapter.name}
                                </h4>
                                <div className="space-y-2">
                                    {chapter.children?.map((item, itemIdx) => (
                                        <div
                                            key={itemIdx}
                                            className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                                        >
                                            <div className="flex-1">
                                                <span className="text-sm text-gray-800">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-500">{item.unit}</span>
                                                <span className="font-medium text-orange-600 min-w-[80px] text-right">
                                                    {formatCurrency(item.unitPrice)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 底部統計 */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-700">
                                {template.items?.length || 0}
                            </span> 個章節，
                            <span className="font-medium text-gray-700">
                                {template.items?.reduce((sum, ch) => sum + (ch.children?.length || 0), 0)}
                            </span> 個工項
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">參考單價合計</div>
                            <div className="text-lg font-bold text-orange-600">
                                {formatCurrency(calculateEstimate())}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full mt-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        關閉預覽
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplatePreviewModal;
