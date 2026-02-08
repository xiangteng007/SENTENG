import { useState } from 'react';
import {
    Calculator, Plus, ChevronDown, ChevronUp, Trash2, RefreshCw, Info, Settings2
} from 'lucide-react';
import {
    COMPONENT_REBAR_RATES, COMPONENT_TYPES, REBAR_SPECS, REBAR_USAGE_BY_COMPONENT,
    WATERPROOF_MATERIALS, INSULATION_MATERIALS, TILE_SIZES, TILE_METHODS,
    BUILDING_TYPES, SLAB_THICKNESS_OPTIONS, TAIWAN_REFERENCE_PRICES,
    PARAPET_HEIGHTS, PROJECT_TEMPLATES, DEFAULT_WASTAGE, COMMON_OPENINGS,
    WALL_THICKNESS_OPTIONS,
    formatNumber, applyWastage
} from '../constants';
import {
    InputField, SelectField, OptionDetailCard, WastageControl, ResultDisplay, CostInput
} from '../components/shared';
// 5️⃣ 建築概估計算器
export const BuildingEstimator = ({ onAddRecord }) => {
    const [buildingType, setBuildingType] = useState(1);
    const [floorArea, setFloorArea] = useState('');
    const [wallThicknessFilter, setWallThicknessFilter] = useState('all');
    const [plasterRatio, setPlasterRatio] = useState('1:3'); // 抹灰配比

    // 抹灰砂漿配比選項 (水泥:砂 體積比)
    const PLASTER_MIX_RATIOS = [
        { value: '1:2', label: '1:2 (粉光層)', cementRate: 0.33, sandRate: 0.67, cementKg: 650, sandKg: 800, desc: '細緻粉光面層用' },
        { value: '1:2.5', label: '1:2.5 (精抹)', cementRate: 0.29, sandRate: 0.71, cementKg: 550, sandKg: 850, desc: '精緻抹灰' },
        { value: '1:3', label: '1:3 (一般打底)', cementRate: 0.25, sandRate: 0.75, cementKg: 450, sandKg: 950, desc: '一般抹灰打底' },
        { value: '1:4', label: '1:4 (粗底)', cementRate: 0.20, sandRate: 0.80, cementKg: 350, sandKg: 1000, desc: '粗底打底用' },
    ];

    // 根據牆壁厚度篩選建築類型
    const filteredTypes = BUILDING_TYPES.map((t, i) => ({ ...t, originalIndex: i }))
        .filter(t => wallThicknessFilter === 'all' || t.wallThickness === parseInt(wallThicknessFilter));

    // 確保選中的類型在過濾後仍然有效
    const selectedIndex = filteredTypes.findIndex(t => t.originalIndex === buildingType);
    const validSelectedIndex = selectedIndex >= 0 ? buildingType : (filteredTypes[0]?.originalIndex ?? 0);
    const selected = BUILDING_TYPES[validSelectedIndex];

    // 計算總量
    const area = parseFloat(floorArea) || 0;
    const totalRebar = area * selected.rebar;
    const totalConcrete = area * selected.concrete;
    const totalFormwork = area * selected.formwork;
    const totalMortarVolume = area * selected.sand;  // 抹灰砂漿總體積 (m³)

    // 取得選中的配比
    const selectedRatio = PLASTER_MIX_RATIOS.find(r => r.value === plasterRatio) || PLASTER_MIX_RATIOS[2];

    // 根據配比計算水泥和砂用量
    // 水泥用量 = 砂漿體積 × 水泥密度(約1500kg/m³) × 水泥體積比例
    // 砂用量 = 砂漿體積 × 砂密度(約1500kg/m³) × 砂體積比例
    const totalCement = totalMortarVolume * selectedRatio.cementKg;  // kg
    const totalSand = totalMortarVolume * selectedRatio.sandKg;      // kg
    const totalSandVolume = totalMortarVolume * selectedRatio.sandRate;  // m³ (方便訂購)

    // 當篩選改變時，自動選擇篩選後的第一個類型
    const handleWallThicknessChange = (value) => {
        setWallThicknessFilter(value);
        if (value !== 'all') {
            const newFiltered = BUILDING_TYPES.map((t, i) => ({ ...t, originalIndex: i }))
                .filter(t => t.wallThickness === parseInt(value));
            if (newFiltered.length > 0) {
                setBuildingType(newFiltered[0].originalIndex);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                    <Info size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                        <p className="font-medium">建築概估說明</p>
                        <p className="text-orange-600 mt-1">依據建築類型與樓地板面積，快速估算整棟建築的主要結構材料用量。數據來源為抗震7度區規則結構設計經驗值。</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <SelectField
                        label="牆壁厚度篩選"
                        value={wallThicknessFilter}
                        onChange={handleWallThicknessChange}
                        options={WALL_THICKNESS_OPTIONS}
                    />
                    <SelectField
                        label="建築類型"
                        value={validSelectedIndex}
                        onChange={(v) => setBuildingType(parseInt(v))}
                        options={filteredTypes.map((t) => ({ value: t.originalIndex, label: `${t.label} (${t.structure})` }))}
                    />
                    <InputField label="總樓地板面積" value={floorArea} onChange={setFloorArea} unit="m²" placeholder="0" />
                    <SelectField
                        label="抹灰配比 (水泥:砂)"
                        value={plasterRatio}
                        onChange={setPlasterRatio}
                        options={PLASTER_MIX_RATIOS.map(r => ({ value: r.value, label: r.label }))}
                    />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-gray-600">
                        <span>結構: <strong className="text-gray-800">{selected.structure}</strong></span>
                        <span>牆厚: <strong className="text-gray-800">{selected.wallThickness} cm</strong></span>
                        <span>鋼筋: {selected.rebar} kg/m²</span>
                        <span>混凝土: {selected.concrete} m³/m²</span>
                        <span>模板: {selected.formwork} m²/m²</span>
                        <span>砂漿: {selected.sand} m³/m²</span>
                    </div>
                </div>

                {/* 主要結構材料 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <ResultDisplay label="鋼筋總量" value={totalRebar} unit="kg" showWastage={false} onAddRecord={onAddRecord} subType="建築概估" />
                    <ResultDisplay label="混凝土總量" value={totalConcrete} unit="m³" showWastage={false} onAddRecord={onAddRecord} subType="建築概估" />
                    <ResultDisplay label="模板總量" value={totalFormwork} unit="m²" showWastage={false} onAddRecord={onAddRecord} subType="建築概估" />
                </div>

                {/* 抹灰砂漿拆分 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-amber-700 font-medium">🧱 抹灰砂漿用量 ({plasterRatio} 配比)</span>
                        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{selectedRatio.desc}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <div className="text-xs text-gray-500">砂漿總體積</div>
                            <div className="text-lg font-bold text-amber-700">{formatNumber(totalMortarVolume, 2)} <span className="text-sm font-normal">m³</span></div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <div className="text-xs text-gray-500">水泥用量</div>
                            <div className="text-lg font-bold text-blue-600">{formatNumber(totalCement, 0)} <span className="text-sm font-normal">kg</span></div>
                            <div className="text-xs text-gray-400">約 {formatNumber(totalCement / 50, 1)} 包 (50kg/包)</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <div className="text-xs text-gray-500">砂用量 (重量)</div>
                            <div className="text-lg font-bold text-amber-600">{formatNumber(totalSand, 0)} <span className="text-sm font-normal">kg</span></div>
                            <div className="text-xs text-gray-400">約 {formatNumber(totalSand / 1000, 2)} 噸</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <div className="text-xs text-gray-500">砂用量 (體積)</div>
                            <div className="text-lg font-bold text-amber-600">{formatNumber(totalSandVolume, 2)} <span className="text-sm font-normal">m³</span></div>
                            <div className="text-xs text-gray-400">訂購用</div>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-amber-600 flex flex-wrap gap-4">
                        <span>• 配比 {plasterRatio} = 水泥{Math.round(selectedRatio.cementRate * 100)}% : 砂{Math.round(selectedRatio.sandRate * 100)}%</span>
                        <span>• 每m³砂漿約需水泥 {selectedRatio.cementKg} kg、砂 {selectedRatio.sandKg} kg</span>
                    </div>
                </div>

                <div className="text-xs text-gray-500">
                    鋼筋約 <strong>{formatNumber(totalRebar / 1000, 1)}</strong> 噸 |
                    混凝土約 <strong>{formatNumber(totalConcrete)}</strong> 立方公尺 |
                    水泥約 <strong>{formatNumber(totalCement / 50, 0)}</strong> 包
                </div>
            </div>

            {/* 參考表格 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">建築類型參考指標</h4>
                    {wallThicknessFilter !== 'all' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            篩選: 牆厚 {wallThicknessFilter} cm
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left py-2 px-2">建築類型</th>
                                <th className="text-center py-2 px-2">結構</th>
                                <th className="text-center py-2 px-2">牆厚(cm)</th>
                                <th className="text-right py-2 px-2">鋼筋(kg/m²)</th>
                                <th className="text-right py-2 px-2">混凝土(m³/m²)</th>
                                <th className="text-right py-2 px-2">模板(m²/m²)</th>
                                <th className="text-right py-2 px-2">砂漿(m³/m²)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.map((t) => (
                                <tr key={t.originalIndex} className={`border-b hover:bg-gray-50 transition-colors ${t.originalIndex === validSelectedIndex ? 'bg-orange-50' : ''} ${t.structure === 'RB' ? 'text-amber-700' : ''}`}>
                                    <td className="py-2 px-2">
                                        {t.label}
                                        {t.structure === 'RB' && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1 rounded">磚造</span>}
                                    </td>
                                    <td className="text-center py-2 px-2">{t.structure}</td>
                                    <td className="text-center py-2 px-2">{t.wallThickness}</td>
                                    <td className="text-right py-2 px-2">{t.rebar}</td>
                                    <td className="text-right py-2 px-2">{t.concrete}</td>
                                    <td className="text-right py-2 px-2">{t.formwork}</td>
                                    <td className="text-right py-2 px-2">{t.sand}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 text-xs text-gray-500 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-amber-100 rounded"></span>
                        RB = 加強磚造
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-gray-100 rounded"></span>
                        RC = 鋼筋混凝土 | SRC = 鋼骨鋼筋混凝土 | SC = 鋼構
                    </span>
                </div>
            </div>
        </div>
    );
};

