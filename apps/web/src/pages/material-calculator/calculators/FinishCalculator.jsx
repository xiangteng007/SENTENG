import React, { useState } from 'react';
import {
    Calculator, Plus, ChevronDown, ChevronUp, Trash2, RefreshCw, Info, Settings2
} from 'lucide-react';
import {
    COMPONENT_REBAR_RATES, COMPONENT_TYPES, REBAR_SPECS, REBAR_USAGE_BY_COMPONENT,
    WATERPROOF_MATERIALS, INSULATION_MATERIALS, TILE_SIZES, TILE_METHODS,
    BUILDING_TYPES, SLAB_THICKNESS_OPTIONS, TAIWAN_REFERENCE_PRICES,
    PARAPET_HEIGHTS, PROJECT_TEMPLATES, DEFAULT_WASTAGE, COMMON_OPENINGS,
    formatNumber, applyWastage
} from '../constants';
import {
    InputField, SelectField, OptionDetailCard, WastageControl, ResultDisplay, CostInput
} from '../components/shared';
export // 4️⃣ 裝修工程計算器 (支援多列輸入)
const FinishCalculator = ({ onAddRecord, vendors = [] }) => {
    const [calcType, setCalcType] = useState('paint');

    // 油漆計算 - 多列支援
    const [paintRows, setPaintRows] = useState([
        { id: 1, name: '', area: '', unit: 'sqm' }
    ]);
    const [paintWastage, setPaintWastage] = useState(DEFAULT_WASTAGE.paint);
    const [paintCustomWastage, setPaintCustomWastage] = useState(false);
    const [paintCost, setPaintCost] = useState(null);

    // 批土計算 - 多列支援
    const [puttyRows, setPuttyRows] = useState([
        { id: 1, name: '', area: '' }
    ]);
    const [puttyWastage, setPuttyWastage] = useState(DEFAULT_WASTAGE.putty);
    const [puttyCustomWastage, setPuttyCustomWastage] = useState(false);
    const [puttyCost, setPuttyCost] = useState(null);

    // 塗刷面積估算
    const [buildingArea, setBuildingArea] = useState('');

    // 計算每列油漆結果
    const paintRowResults = paintRows.map(row => {
        const areaSqm = row.unit === 'ping' ? (parseFloat(row.area) || 0) * 3.30579 : (parseFloat(row.area) || 0);
        const gallons = areaSqm / 3.30579 * 0.5;
        return { ...row, gallons };
    });

    // 總計油漆
    const totalPaintGallons = paintRowResults.reduce((sum, row) => sum + row.gallons, 0);
    const currentPaintWastage = paintCustomWastage ? paintWastage : DEFAULT_WASTAGE.paint;
    const totalPaintWithWastage = applyWastage(totalPaintGallons, currentPaintWastage);

    // 油漆列操作
    const addPaintRow = () => {
        const newId = Math.max(...paintRows.map(r => r.id), 0) + 1;
        setPaintRows([...paintRows, { id: newId, name: '', area: '', unit: 'sqm' }]);
    };
    const removePaintRow = (id) => {
        if (paintRows.length <= 1) return;
        setPaintRows(paintRows.filter(row => row.id !== id));
    };
    const updatePaintRow = (id, field, value) => {
        setPaintRows(paintRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    const clearPaintRows = () => {
        setPaintRows([{ id: 1, name: '', area: '', unit: 'sqm' }]);
    };

    // 計算每列批土結果
    const puttyRowResults = puttyRows.map(row => {
        const area = parseFloat(row.area) || 0;
        const amount = area * 0.35;
        return { ...row, amount };
    });

    // 總計批土
    const totalPutty = puttyRowResults.reduce((sum, row) => sum + row.amount, 0);
    const currentPuttyWastage = puttyCustomWastage ? puttyWastage : DEFAULT_WASTAGE.putty;
    const totalPuttyWithWastage = applyWastage(totalPutty, currentPuttyWastage);

    // 批土列操作
    const addPuttyRow = () => {
        const newId = Math.max(...puttyRows.map(r => r.id), 0) + 1;
        setPuttyRows([...puttyRows, { id: newId, name: '', area: '' }]);
    };
    const removePuttyRow = (id) => {
        if (puttyRows.length <= 1) return;
        setPuttyRows(puttyRows.filter(row => row.id !== id));
    };
    const updatePuttyRow = (id, field, value) => {
        setPuttyRows(puttyRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    const clearPuttyRows = () => {
        setPuttyRows([{ id: 1, name: '', area: '' }]);
    };

    // 塗刷面積估算
    const estimatedPaintArea = (parseFloat(buildingArea) || 0) * 3;

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'paint', label: '油漆用量' },
                    { id: 'putty', label: '批土用量' },
                    { id: 'estimate', label: '面積估算' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCalcType(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === item.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 油漆用量 - 多列模式 */}
            {calcType === 'paint' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            公式: 用量(加侖) ≈ 面積(坪) × 0.5
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{paintRows.length} 列</span>
                            <button onClick={() => paintRows.length > 1 && removePaintRow(paintRows[paintRows.length - 1].id)} disabled={paintRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button onClick={addPaintRow} className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                                <Plus size={16} />
                            </button>
                            {paintRows.length > 1 && <button onClick={clearPaintRows} className="text-xs text-gray-500 hover:text-gray-700 ml-1">清空</button>}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {paintRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input type="text" value={row.name} onChange={(e) => updatePaintRow(row.id, 'name', e.target.value)}
                                            placeholder={`區域 ${index + 1}`} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                    </div>
                                    <div className="col-span-5 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">塗刷面積</label>
                                        <div className="relative">
                                            <input type="number" value={row.area} onChange={(e) => updatePaintRow(row.id, 'area', e.target.value)}
                                                placeholder="0" min="0" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8" />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row.unit === 'ping' ? '坪' : 'm²'}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">單位</label>
                                        <select value={row.unit} onChange={(e) => updatePaintRow(row.id, 'unit', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500">
                                            <option value="sqm">m²</option>
                                            <option value="ping">坪</option>
                                        </select>
                                    </div>
                                    <div className="col-span-10 sm:col-span-3 flex items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">油漆用量</label>
                                            <div className="text-sm font-bold text-orange-600">
                                                {paintRowResults[index].gallons > 0 ? `${formatNumber(paintRowResults[index].gallons, 2)} 加侖` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button onClick={() => removePaintRow(row.id)} disabled={paintRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addPaintRow} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Plus size={16} />+增加新欄位
                    </button>

                    <WastageControl wastage={paintWastage} setWastage={setPaintWastage} defaultValue={DEFAULT_WASTAGE.paint} useCustom={paintCustomWastage} setUseCustom={setPaintCustomWastage} />

                    <ResultDisplay
                        label={`油漆用量 (共 ${paintRowResults.filter(r => r.gallons > 0).length} 項)`}
                        value={totalPaintGallons}
                        unit="加侖"
                        wastageValue={totalPaintWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, paintCost)}
                        subType="油漆"
                    />

                    <CostInput
                        label="油漆"
                        quantity={totalPaintWithWastage}
                        unit="坪"
                        unitLabel="工帶料/坪"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('油漆'))}
                        onChange={setPaintCost}
                        placeholder={{ spec: '例：乳膠漆' }}
                    />

                    {paintRowResults.filter(r => r.gallons > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {paintRowResults.filter(r => r.gallons > 0).map((row, idx) => (
                                    <div key={row.id} className="flex justify-between text-gray-600">
                                        <span>{row.name || `區域 ${idx + 1}`} ({row.area}{row.unit === 'ping' ? '坪' : 'm²'})</span>
                                        <span className="font-medium">{formatNumber(row.gallons, 2)} 加侖</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 批土用量 - 多列模式 */}
            {calcType === 'putty' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            公式: 批土用量 = 建築面積 × 0.35
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{puttyRows.length} 列</span>
                            <button onClick={() => puttyRows.length > 1 && removePuttyRow(puttyRows[puttyRows.length - 1].id)} disabled={puttyRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button onClick={addPuttyRow} className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                                <Plus size={16} />
                            </button>
                            {puttyRows.length > 1 && <button onClick={clearPuttyRows} className="text-xs text-gray-500 hover:text-gray-700 ml-1">清空</button>}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {puttyRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 sm:col-span-4">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input type="text" value={row.name} onChange={(e) => updatePuttyRow(row.id, 'name', e.target.value)}
                                            placeholder={`區域 ${index + 1}`} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                    </div>
                                    <div className="col-span-5 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">建築面積</label>
                                        <div className="relative">
                                            <input type="number" value={row.area} onChange={(e) => updatePuttyRow(row.id, 'area', e.target.value)}
                                                placeholder="0" min="0" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8" />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5 sm:col-span-4 flex items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">批土用量</label>
                                            <div className="text-sm font-bold text-orange-600">
                                                {puttyRowResults[index].amount > 0 ? `${formatNumber(puttyRowResults[index].amount, 2)} kg` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button onClick={() => removePuttyRow(row.id)} disabled={puttyRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addPuttyRow} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Plus size={16} />+增加新欄位
                    </button>

                    <WastageControl wastage={puttyWastage} setWastage={setPuttyWastage} defaultValue={DEFAULT_WASTAGE.putty} useCustom={puttyCustomWastage} setUseCustom={setPuttyCustomWastage} />

                    <ResultDisplay
                        label={`批土用量 (共 ${puttyRowResults.filter(r => r.amount > 0).length} 項)`}
                        value={totalPutty}
                        unit="kg"
                        wastageValue={totalPuttyWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, puttyCost)}
                        subType="批土"
                    />

                    <CostInput
                        label="批土"
                        quantity={totalPuttyWithWastage}
                        unit="kg"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('油漆'))}
                        onChange={setPuttyCost}
                        placeholder={{ spec: '例：AB批土' }}
                    />

                    {puttyRowResults.filter(r => r.amount > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {puttyRowResults.filter(r => r.amount > 0).map((row, idx) => (
                                    <div key={row.id} className="flex justify-between text-gray-600">
                                        <span>{row.name || `區域 ${idx + 1}`} ({row.area}m²)</span>
                                        <span className="font-medium">{formatNumber(row.amount, 2)} kg</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {calcType === 'estimate' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        室內抹灰/塗刷面積 ≈ 建築面積 × 3 ~ 3.8
                    </div>
                    <InputField label="建築面積" value={buildingArea} onChange={setBuildingArea} unit="m²" placeholder="0" />
                    <ResultDisplay label="預估塗刷面積" value={estimatedPaintArea} unit="m²" showWastage={false} onAddRecord={onAddRecord} subType="面積估算" />
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        地磚面積 ≈ 建築面積 × 0.7 = <strong>{formatNumber((parseFloat(buildingArea) || 0) * 0.7)}</strong> m²
                    </div>
                </div>
            )}
        </div>
    );
};

