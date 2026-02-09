import { useState } from 'react';
import {
    Building2, Layers, Grid3X3, Paintbrush, BarChart3, Calculator, Info, Droplets, Construction, FileSpreadsheet, ExternalLink, Trash2, RefreshCw
} from 'lucide-react';
import { formatNumber } from './constants';
import { UnitConverter } from './components/shared';
import { StructureCalculator } from './calculators/StructureCalculator';
import { MasonryCalculator } from './calculators/MasonryCalculator';
import { TileCalculator } from './calculators/TileCalculator';
import { FinishCalculator } from './calculators/FinishCalculator';
import { BuildingEstimator } from './calculators/BuildingEstimator';
import { ScaffoldingCalculator } from './calculators/ScaffoldingCalculator';
import { WaterproofCalculator } from './calculators/WaterproofCalculator';
import { SectionTitle } from '../../components/common/Indicators';
import { GoogleService } from '../../services/GoogleService';
import StructuralMaterialCalculator from '../../components/StructuralMaterialCalculator';

// ============================================
// 主組件
// ============================================

export const MaterialCalculator = ({ addToast, vendors = [] }) => {
    const [activeTab, setActiveTab] = useState('structure');

    // 計算記錄
    const [calcRecords, setCalcRecords] = useState([]);
    const [exportName, setExportName] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportedSheet, setExportedSheet] = useState(null);

    const tabs = [
        { id: 'structure', icon: Building2, label: '結構工程' },
        { id: 'masonry', icon: Layers, label: '泥作工程' },
        { id: 'tile', icon: Grid3X3, label: '磁磚工程' },
        { id: 'finish', icon: Paintbrush, label: '塗料工程' },
        { id: 'waterproof', icon: Droplets, label: '防水保溫' },
        { id: 'scaffolding', icon: Construction, label: '鷹架工程' },
        { id: 'estimate', icon: BarChart3, label: '建築概估' },
        { id: 'integrated', icon: Calculator, label: '材料統計' },
    ];

    // 新增計算記錄
    const addRecord = (category, subType, label, value, unit, wastageValue, costData) => {
        const record = {
            id: Date.now(),
            category,
            subType,
            label,
            value: parseFloat(value) || 0,
            unit,
            wastageValue: parseFloat(wastageValue) || parseFloat(value) || 0,
            createdAt: new Date().toLocaleString('zh-TW'),
            // 成本資訊
            vendor: costData?.vendor || '',
            spec: costData?.spec || '',
            price: costData?.price || 0,
            subtotal: costData?.subtotal || 0,
            note: costData?.note || ''
        };
        setCalcRecords(prev => [...prev, record]);
        addToast?.(`已加入記錄: ${label}`, 'success');
    };

    // 刪除記錄
    const removeRecord = (id) => {
        setCalcRecords(prev => prev.filter(r => r.id !== id));
    };

    // 清空記錄
    const clearRecords = () => {
        setCalcRecords([]);
        addToast?.('已清空計算記錄', 'info');
    };

    // 匯出到 Google Sheet (存入物料算量資料夾)
    const exportToSheet = async () => {
        if (calcRecords.length === 0) {
            addToast?.('請先加入計算記錄', 'warning');
            return;
        }

        setIsExporting(true);
        try {
            // 使用新的匯出功能，會自動建立物料算量資料夾並以日期時間命名
            const result = await GoogleService.exportMaterialCalculationToFolder(
                calcRecords,
                exportName // 如果有自訂名稱則使用，否則會自動產生含日期時間的檔名
            );

            if (result.success) {
                setExportedSheet(result);
                addToast?.('已匯出到 Google Sheet！', 'success', {
                    action: {
                        label: '開啟 Sheet',
                        onClick: () => window.open(result.sheetUrl, '_blank')
                    }
                });
            } else {
                addToast?.(result.error || '匯出失敗', 'error');
            }
        } catch (error) {
            console.error('Export error:', error);
            addToast?.('匯出失敗：' + error.message, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const renderCalculator = () => {
        switch (activeTab) {
            case 'structure': return <StructureCalculator onAddRecord={(s, l, v, u, w, c) => addRecord('結構工程', s, l, v, u, w, c)} vendors={vendors} />;
            case 'masonry': return <MasonryCalculator onAddRecord={(s, l, v, u, w, c) => addRecord('泥作工程', s, l, v, u, w, c)} vendors={vendors} />;
            case 'tile': return <TileCalculator onAddRecord={(s, l, v, u, w, c) => addRecord('磁磚工程', s, l, v, u, w, c)} vendors={vendors} />;
            case 'finish': return <FinishCalculator onAddRecord={(s, l, v, u, w, c) => addRecord('塗料工程', s, l, v, u, w, c)} vendors={vendors} />;
            case 'waterproof': return <WaterproofCalculator onAddRecord={(s, l, v, u, w, c) => addRecord('防水保溫', s, l, v, u, w, c)} vendors={vendors} />;
            case 'scaffolding': return <ScaffoldingCalculator onAddRecord={(s, l, v, u, w, c) => addRecord('鷹架工程', s, l, v, u, w, c)} vendors={vendors} />;
            case 'estimate': return <BuildingEstimator onAddRecord={(s, l, v, u, w, c) => addRecord('建築概估', s, l, v, u, w, c)} />;
            case 'integrated': return <StructuralMaterialCalculator />;
            default: return <StructureCalculator onAddRecord={(s, l, v, u, w, c) => addRecord('結構工程', s, l, v, u, w, c)} vendors={vendors} />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle title="營建物料快速換算" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左側：計算器 */}
                <div className="lg:col-span-2 space-y-4">
                    {/* 工項選擇 */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 計算器區域 */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                        {renderCalculator()}
                    </div>

                    {/* 公式說明 */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Calculator size={18} />
                            常用換算公式
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="font-medium text-gray-700">🧱 鋼筋重量</div>
                                <div className="text-gray-500 mt-1">每米重 = 0.00617 × d²</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="font-medium text-gray-700">🧱 紅磚數量</div>
                                <div className="text-gray-500 mt-1">24牆 = 128塊/m²</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="font-medium text-gray-700">🔲 磁磚片數</div>
                                <div className="text-gray-500 mt-1">每坪 = 32400 ÷ (長×寬)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右側：計算記錄與匯出 */}
                <div className="space-y-4">
                    {/* 單位換算工具 */}
                    <UnitConverter />

                    {/* 計算記錄 */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-bold flex items-center gap-2">
                                <Calculator size={18} />
                                計算記錄
                            </span>
                            {calcRecords.length > 0 && (
                                <button
                                    onClick={clearRecords}
                                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                                >
                                    清空
                                </button>
                            )}
                        </div>

                        {calcRecords.length === 0 ? (
                            <div className="text-center py-8 text-orange-200">
                                <Calculator size={40} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">計算後點擊「加入記錄」</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {calcRecords.map(record => (
                                    <div key={record.id} className="flex items-center justify-between py-2 border-b border-white/20 last:border-0">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{record.label}</div>
                                            <div className="text-xs text-orange-200">
                                                {record.category} - {record.subType}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">
                                                {formatNumber(record.wastageValue)} {record.unit}
                                            </span>
                                            <button
                                                onClick={() => removeRecord(record.id)}
                                                className="p-1 hover:bg-white/20 rounded text-red-200"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 匯出到 Google Sheet */}
                    {calcRecords.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FileSpreadsheet size={18} className="text-blue-600" />
                                <span className="font-medium text-blue-800">匯出到 Google Sheet</span>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={exportName}
                                    onChange={(e) => setExportName(e.target.value)}
                                    placeholder="輸入報表名稱（選填）"
                                    className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                                <button
                                    onClick={exportToSheet}
                                    disabled={isExporting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isExporting ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            匯出中...
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet size={16} />
                                            匯出到 Google Sheet
                                        </>
                                    )}
                                </button>
                            </div>

                            {exportedSheet && (
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <a
                                        href={exportedSheet.sheetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <ExternalLink size={14} />
                                        開啟已匯出的 Sheet
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BOM 預覽表格 */}
                    {calcRecords.length > 0 && calcRecords.some(r => r.subtotal > 0) && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FileSpreadsheet size={18} className="text-gray-600" />
                                <span className="font-medium text-gray-800">📋 BOM 物料清單預覽</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left py-2 px-2">工程類別</th>
                                            <th className="text-left py-2 px-2">品項</th>
                                            <th className="text-right py-2 px-2">數量</th>
                                            <th className="text-right py-2 px-2">單價</th>
                                            <th className="text-right py-2 px-2">小計</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calcRecords.filter(r => r.subtotal > 0).map(record => (
                                            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-1.5 px-2 text-gray-500">{record.category}</td>
                                                <td className="py-1.5 px-2">{record.label}</td>
                                                <td className="py-1.5 px-2 text-right">{formatNumber(record.wastageValue)} {record.unit}</td>
                                                <td className="py-1.5 px-2 text-right">${formatNumber(record.price)}</td>
                                                <td className="py-1.5 px-2 text-right font-medium">${formatNumber(record.subtotal, 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-orange-50 font-bold">
                                            <td colSpan={4} className="py-2 px-2 text-right text-gray-700">總計</td>
                                            <td className="py-2 px-2 text-right text-orange-700">
                                                ${formatNumber(calcRecords.filter(r => r.subtotal > 0).reduce((sum, r) => sum + (r.subtotal || 0), 0), 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                * 僅顯示已輸入單價的項目
                            </div>
                        </div>
                    )}

                    {/* 使用提示 */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex gap-2">
                            <Info size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-orange-700">
                                <p className="font-medium mb-1">使用說明</p>
                                <ol className="list-decimal list-inside space-y-0.5 text-orange-600">
                                    <li>選擇工程類別進行計算</li>
                                    <li>點「加入記錄」保存結果</li>
                                    <li>匯出到 Google Sheet</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialCalculator;
