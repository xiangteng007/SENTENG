/**
 * 費用設定面板
 */

import { useState } from 'react';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { TAX_TYPES, DEFAULT_SETTINGS } from '../../services/QuotationService';

const SettingsPanel = ({ settings, onChange, totals: _totals }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Settings2 size={18} className="text-gray-500" />
                    <span className="font-medium text-gray-700">費用設定</span>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isExpanded && (
                <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">折扣金額</label>
                            <input
                                type="number"
                                value={settings.discountAmount || 0}
                                onChange={(e) => onChange({ ...settings, discountAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">管理費 (%)</label>
                            <input
                                type="number"
                                value={settings.managementFeeRate || DEFAULT_SETTINGS.managementFee}
                                onChange={(e) => onChange({ ...settings, managementFeeRate: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                min="0"
                                max="100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">利潤率 (%)</label>
                            <input
                                type="number"
                                value={settings.profitRate || DEFAULT_SETTINGS.profitRate}
                                onChange={(e) => onChange({ ...settings, profitRate: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                min="0"
                                max="100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">稅率 (%)</label>
                            <input
                                type="number"
                                value={settings.taxRate || DEFAULT_SETTINGS.taxRate}
                                onChange={(e) => onChange({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="radio"
                                name="taxType"
                                checked={settings.taxType === TAX_TYPES.INCLUSIVE}
                                onChange={() => onChange({ ...settings, taxType: TAX_TYPES.INCLUSIVE })}
                                className="text-orange-500"
                            />
                            含稅價
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="radio"
                                name="taxType"
                                checked={settings.taxType === TAX_TYPES.EXCLUSIVE}
                                onChange={() => onChange({ ...settings, taxType: TAX_TYPES.EXCLUSIVE })}
                                className="text-orange-500"
                            />
                            未稅價
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPanel;
