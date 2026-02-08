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
export // 6️⃣ 鷹架計算器
const ScaffoldingCalculator = ({ onAddRecord, vendors = [] }) => {
    const [perimeter, setPerimeter] = useState('');
    const [floorHeight, setFloorHeight] = useState('3.2');
    const [floors, setFloors] = useState('');
    const [safetyNetLayers, setSafetyNetLayers] = useState('2');
    const [rentalDays, setRentalDays] = useState('30');
    const [scaffoldingCost, setScaffoldingCost] = useState(null);

    // 鷹架租金參考價格 (NT$/m²/月)
    const SCAFFOLDING_RATES = {
        rental: { min: 80, max: 150, unit: 'm²/月', label: '鷹架租金' },
        safetyNet: { min: 30, max: 60, unit: 'm²', label: '安全網' },
        installation: { min: 100, max: 200, unit: 'm²', label: '架設工資' },
    };

    const p = parseFloat(perimeter) || 0;  // 建築外周長
    const h = parseFloat(floorHeight) || 3.2;
    const f = parseFloat(floors) || 0;
    const netLayers = parseInt(safetyNetLayers) || 2;
    const days = parseFloat(rentalDays) || 30;

    const totalHeight = h * f;
    const scaffoldingArea = p * totalHeight;
    const safetyNetArea = p * netLayers;  // 安全網通常架設在特定樓層
    const rentalMonths = days / 30;

    // 費用估算
    const rentalCostMin = scaffoldingArea * SCAFFOLDING_RATES.rental.min * rentalMonths;
    const rentalCostMax = scaffoldingArea * SCAFFOLDING_RATES.rental.max * rentalMonths;
    const installCostMin = scaffoldingArea * SCAFFOLDING_RATES.installation.min;
    const installCostMax = scaffoldingArea * SCAFFOLDING_RATES.installation.max;

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info size={16} />
                    公式: 鷹架面積 = 外周長 × 層高 × 層數 | 安全網 = 周長 × 層數
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">建築外周長 (m)</label>
                        <input type="number" value={perimeter} onChange={e => setPerimeter(e.target.value)}
                            placeholder="40" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">層高 (m)</label>
                        <input type="number" value={floorHeight} onChange={e => setFloorHeight(e.target.value)}
                            placeholder="3.2" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">樓層數</label>
                        <input type="number" value={floors} onChange={e => setFloors(e.target.value)}
                            placeholder="5" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">安全網層數</label>
                        <input type="number" value={safetyNetLayers} onChange={e => setSafetyNetLayers(e.target.value)}
                            placeholder="2" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">租期 (天)</label>
                        <input type="number" value={rentalDays} onChange={e => setRentalDays(e.target.value)}
                            placeholder="30" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                    </div>
                </div>

                {/* 計算結果 */}
                {scaffoldingArea > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="text-xs text-orange-600">鷹架面積</div>
                            <div className="text-xl font-bold text-orange-700">{formatNumber(scaffoldingArea)} m²</div>
                            <div className="text-xxs text-orange-500 mt-1">
                                {formatNumber(p)}m × {formatNumber(totalHeight)}m
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-xs text-blue-600">安全網面積</div>
                            <div className="text-xl font-bold text-blue-700">{formatNumber(safetyNetArea)} m²</div>
                            <div className="text-xxs text-blue-500 mt-1">
                                {formatNumber(p)}m × {netLayers} 層
                            </div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="text-xs text-green-600">總高度</div>
                            <div className="text-xl font-bold text-green-700">{formatNumber(totalHeight)} m</div>
                            <div className="text-xxs text-green-500 mt-1">
                                {f} 層 × {formatNumber(h)}m
                            </div>
                        </div>
                    </div>
                )}

                {/* 費用估算 */}
                {scaffoldingArea > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-gray-700 mb-3">💰 費用估算參考</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">鷹架租金 ({rentalMonths.toFixed(1)} 月)</span>
                                <span className="font-medium">$ {formatNumber(rentalCostMin, 0)} ~ {formatNumber(rentalCostMax, 0)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">架設工資 (一次)</span>
                                <span className="font-medium">$ {formatNumber(installCostMin, 0)} ~ {formatNumber(installCostMax, 0)}</span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-3">
                            * 價格僅供參考，實際依廠商報價為準
                        </div>
                    </div>
                )}

                <ResultDisplay
                    label="鷹架面積"
                    value={scaffoldingArea}
                    unit="m²"
                    wastageValue={scaffoldingArea}
                    showWastage={false}
                    onAddRecord={(subType, label, value, unit, wastageValue) =>
                        onAddRecord(subType, label, value, unit, wastageValue, scaffoldingCost)}
                    subType="鷹架"
                />

                <CostInput
                    label="鷹架"
                    quantity={scaffoldingArea}
                    unit="m²"
                    unitLabel="租金/m²"
                    vendors={vendors.filter(v => v.category === '假設工程' || v.tradeType?.includes('鷹架'))}
                    onChange={setScaffoldingCost}
                    placeholder={{ spec: '例：標準鷹架' }}
                />
            </div>
        </div>
    );
};

