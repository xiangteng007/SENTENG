import { useState } from 'react';
import {
    Calculator, Plus, ChevronDown, ChevronUp, Trash2, RefreshCw, Info, Settings2
} from 'lucide-react';
import {
    COMPONENT_REBAR_RATES, COMPONENT_TYPES, REBAR_SPECS, REBAR_USAGE_BY_COMPONENT,
    WATERPROOF_MATERIALS, INSULATION_MATERIALS, TILE_SIZES, TILE_METHODS,
    BUILDING_TYPES, SLAB_THICKNESS_OPTIONS, TAIWAN_REFERENCE_PRICES,
    PARAPET_HEIGHTS, PROJECT_TEMPLATES, DEFAULT_WASTAGE, COMMON_OPENINGS,
    UNIT_CONVERSIONS,
    formatNumber, applyWastage
} from '../constants';
import {
    InputField, SelectField, OptionDetailCard, WastageControl, ResultDisplay, CostInput
} from '../components/shared';
export // 7️⃣ 防水/保溫計算器
const WaterproofCalculator = ({ onAddRecord, vendors = [] }) => {
    const [calcType, setCalcType] = useState('waterproof'); // waterproof | insulation
    const [area, setArea] = useState('');
    const [materialType, setMaterialType] = useState(0);
    const [layers, setLayers] = useState('2');
    const [waterproofWastage, setWaterproofWastage] = useState(DEFAULT_WASTAGE.waterproof);
    const [waterproofCustomWastage, setWaterproofCustomWastage] = useState(false);
    const [waterproofCost, setWaterproofCost] = useState(null);

    const materials = calcType === 'waterproof' ? WATERPROOF_MATERIALS : INSULATION_MATERIALS;
    const selectedMaterial = materials[materialType] || materials[0];
    
    const a = parseFloat(area) || 0;
    const l = parseInt(layers) || (calcType === 'waterproof' ? selectedMaterial.layers : 1);
    
    // 計算用量
    const baseUsage = a * selectedMaterial.usage * (calcType === 'waterproof' ? l : 1);
    const wastageMultiplier = 1 + (waterproofWastage / 100);
    const usageWithWastage = baseUsage * wastageMultiplier;

    // 費用估算
    const costMin = a * selectedMaterial.price.min;
    const costMax = a * selectedMaterial.price.max;

    return (
        <div className="space-y-4">
            {/* 類型切換 */}
            <div className="flex gap-2 mb-4">
                <button onClick={() => { setCalcType('waterproof'); setMaterialType(0); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${calcType === 'waterproof' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    💧 防水材料
                </button>
                <button onClick={() => { setCalcType('insulation'); setMaterialType(0); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${calcType === 'insulation' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    🧱 保溫材料
                </button>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info size={16} />
                    公式: 用量 = 面積 × 單位用量 × 塗層數 × (1 + 損耗率)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">材料類型</label>
                        <select value={materialType} onChange={e => setMaterialType(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 bg-white">
                            {materials.map((m, i) => <option key={i} value={i}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">施作面積 (m²)</label>
                        <input type="number" value={area} onChange={e => setArea(e.target.value)}
                            placeholder="100" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200" />
                    </div>
                    {calcType === 'waterproof' && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">塗層數</label>
                            <input type="number" value={layers} onChange={e => setLayers(e.target.value)}
                                placeholder="2" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200" />
                        </div>
                    )}
                </div>

                {/* 材料說明 */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div><span className="text-gray-500">用量:</span> {selectedMaterial.usage} {selectedMaterial.unit}</div>
                        <div><span className="text-gray-500">工法:</span> {selectedMaterial.method || '-'}</div>
                        <div><span className="text-gray-500">參考價:</span> ${selectedMaterial.price.min}~{selectedMaterial.price.max}/m²</div>
                        {calcType === 'insulation' && <div><span className="text-gray-500">R值:</span> {selectedMaterial.rValue} m²K/W</div>}
                    </div>
                </div>

                {/* 計算結果 */}
                {a > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <div className={`${calcType === 'waterproof' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-lg p-3`}>
                            <div className={`text-xs ${calcType === 'waterproof' ? 'text-blue-600' : 'text-green-600'}`}>材料用量</div>
                            <div className={`text-xl font-bold ${calcType === 'waterproof' ? 'text-blue-700' : 'text-green-700'}`}>
                                {formatNumber(usageWithWastage, 1)} {selectedMaterial.unit.split('/')[0]}
                            </div>
                            <div className={`text-xxs ${calcType === 'waterproof' ? 'text-blue-500' : 'text-green-500'} mt-1`}>
                                含損耗 {waterproofWastage}%
                            </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="text-xs text-orange-600">估算費用</div>
                            <div className="text-xl font-bold text-orange-700">
                                ${formatNumber(costMin, 0)} ~ ${formatNumber(costMax, 0)}
                            </div>
                            <div className="text-xxs text-orange-500 mt-1">
                                工帶料參考價
                            </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="text-xs text-gray-600">施作面積</div>
                            <div className="text-xl font-bold text-gray-700">{formatNumber(a)} m²</div>
                            <div className="text-xxs text-gray-500 mt-1">
                                {formatNumber(a * UNIT_CONVERSIONS.sqmToPing, 2)} 坪
                            </div>
                        </div>
                    </div>
                )}

                <WastageControl
                    wastage={waterproofWastage}
                    setWastage={setWaterproofWastage}
                    defaultValue={calcType === 'waterproof' ? DEFAULT_WASTAGE.waterproof : DEFAULT_WASTAGE.insulation}
                    useCustom={waterproofCustomWastage}
                    setUseCustom={setWaterproofCustomWastage}
                />

                <ResultDisplay
                    label={calcType === 'waterproof' ? '防水材料' : '保溫材料'}
                    value={baseUsage}
                    unit={selectedMaterial.unit.split('/')[0]}
                    wastageValue={usageWithWastage}
                    onAddRecord={(subType, label, value, unit, wastageValue) =>
                        onAddRecord(subType, label, value, unit, wastageValue, waterproofCost)}
                    subType={selectedMaterial.label}
                />

                <CostInput
                    label={calcType === 'waterproof' ? '防水工程' : '保溫工程'}
                    quantity={a}
                    unit="m²"
                    unitLabel="工帶料/m²"
                    vendors={vendors.filter(v => v.category === '防水工程' || v.tradeType?.includes('防水') || v.tradeType?.includes('保溫'))}
                    onChange={setWaterproofCost}
                    placeholder={{ spec: `例：${selectedMaterial.label}` }}
                />
            </div>
        </div>
    );
};