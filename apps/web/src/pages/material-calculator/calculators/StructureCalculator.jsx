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
export // 1️⃣ 結構工程計算器 (支援多列輸入)
const StructureCalculator = ({ onAddRecord, vendors = [] }) => {
    const [calcType, setCalcType] = useState('concrete');

    // 混凝土計算 - 多列支援
    const [concreteRows, setConcreteRows] = useState([
        { id: 1, name: '', length: '', width: '', height: '' }
    ]);
    const [concreteWastage, setConcreteWastage] = useState(DEFAULT_WASTAGE.concrete);
    const [concreteCustomWastage, setConcreteCustomWastage] = useState(false);
    const [concreteCost, setConcreteCost] = useState(null);

    // 泵浦車記錄
    const [pumpTruckCount, setPumpTruckCount] = useState('');
    const [pumpTruckTrips, setPumpTruckTrips] = useState('');
    const [pumpTruckNote, setPumpTruckNote] = useState('');
    const [pumpTruckCost, setPumpTruckCost] = useState(null);

    // 鋼筋計算
    const [rebarSpec, setRebarSpec] = useState(0);
    const [rebarLength, setRebarLength] = useState('');
    const [rebarCount, setRebarCount] = useState('');
    const [rebarWastage, setRebarWastage] = useState(DEFAULT_WASTAGE.rebar);
    const [rebarCustomWastage, setRebarCustomWastage] = useState(false);
    const [rebarCost, setRebarCost] = useState(null);

    // 鋼筋概算模式
    const [rebarMode, setRebarMode] = useState('exact'); // 'exact' | 'estimate'
    const [rebarEstimate, setRebarEstimate] = useState({
        wallType: 0,
        wallArea: '',
        floorType: 0,
        floorArea: '',
        stairType: 0,
        stairArea: '',
    });

    // 鋼筋概算結果計算
    const rebarEstimateResults = {
        wall: (parseFloat(rebarEstimate.wallArea) || 0) * REBAR_USAGE_BY_COMPONENT.wall[rebarEstimate.wallType]?.usage,
        floor: (parseFloat(rebarEstimate.floorArea) || 0) * REBAR_USAGE_BY_COMPONENT.floor[rebarEstimate.floorType]?.usage,
        stair: (parseFloat(rebarEstimate.stairArea) || 0) * REBAR_USAGE_BY_COMPONENT.stair[rebarEstimate.stairType]?.usage,
        get total() { return this.wall + this.floor + this.stair; }
    };

    // 模板計算
    const [formworkArea, setFormworkArea] = useState('');
    const [formworkRatio, setFormworkRatio] = useState('2.2');
    const [formworkWastage, setFormworkWastage] = useState(DEFAULT_WASTAGE.formwork);
    const [formworkCustomWastage, setFormworkCustomWastage] = useState(false);
    const [formworkCost, setFormworkCost] = useState(null);

    // 計算每列混凝土體積
    const concreteRowResults = concreteRows.map(row => {
        const volume = (parseFloat(row.length) || 0) * (parseFloat(row.width) || 0) * (parseFloat(row.height) || 0);
        return { ...row, volume };
    });

    // 總計混凝土體積
    const totalConcreteVolume = concreteRowResults.reduce((sum, row) => sum + row.volume, 0);
    const totalConcreteWithWastage = applyWastage(totalConcreteVolume, concreteCustomWastage ? concreteWastage : DEFAULT_WASTAGE.concrete);

    // 新增混凝土列
    const addConcreteRow = () => {
        const newId = Math.max(...concreteRows.map(r => r.id), 0) + 1;
        setConcreteRows([...concreteRows, { id: newId, name: '', length: '', width: '', height: '' }]);
    };

    // 刪除混凝土列
    const removeConcreteRow = (id) => {
        if (concreteRows.length <= 1) return;
        setConcreteRows(concreteRows.filter(row => row.id !== id));
    };

    // 更新混凝土列
    const updateConcreteRow = (id, field, value) => {
        setConcreteRows(concreteRows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    // 清空所有列
    const clearConcreteRows = () => {
        setConcreteRows([{ id: 1, name: '', length: '', width: '', height: '' }]);
    };

    // 鋼筋計算結果
    const selectedRebar = REBAR_SPECS[rebarSpec];
    const rebarWeight = selectedRebar.weight * (parseFloat(rebarLength) || 0) * (parseFloat(rebarCount) || 0);
    const rebarWithWastage = applyWastage(rebarWeight, rebarCustomWastage ? rebarWastage : DEFAULT_WASTAGE.rebar);

    // 模板計算結果
    const formworkResult = (parseFloat(formworkArea) || 0) * parseFloat(formworkRatio);
    const formworkWithWastage = applyWastage(formworkResult, formworkCustomWastage ? formworkWastage : DEFAULT_WASTAGE.formwork);

    return (
        <div className="space-y-4">
            {/* 子項目選擇 */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'concrete', label: '混凝土用量' },
                    { id: 'rebar', label: '鋼筋重量' },
                    { id: 'formwork', label: '模板面積' },
                    { id: 'component', label: '構件計算' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCalcType(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === item.id
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 混凝土計算 - 多列模式 */}
            {calcType === 'concrete' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            公式: 體積(m³) = 長 × 寬 × 高
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{concreteRows.length} 列</span>
                            <button
                                onClick={() => concreteRows.length > 1 && removeConcreteRow(concreteRows[concreteRows.length - 1].id)}
                                disabled={concreteRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="減少一列"
                            >
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button
                                onClick={addConcreteRow}
                                className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                                title="新增一列"
                            >
                                <Plus size={16} />
                            </button>
                            {concreteRows.length > 1 && (
                                <button
                                    onClick={clearConcreteRows}
                                    className="text-xs text-gray-500 hover:text-gray-700 ml-1"
                                >
                                    清空
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 混凝土規格說明 */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="font-medium text-blue-800 text-sm mb-2 flex items-center gap-2">
                            <Info size={14} />
                            混凝土規格與用途說明
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-white border border-gray-200">
                                <div className="font-bold text-gray-800 mb-1">2000 psi (140 kgf/cm²)</div>
                                <div className="text-gray-600">
                                    <span className="text-blue-700 font-medium">一般用途：</span>
                                    地坪、車道、人行道
                                </div>
                            </div>
                            <div className="p-2 rounded-lg bg-white border border-gray-200">
                                <div className="font-bold text-gray-800 mb-1">3000 psi (210 kgf/cm²)</div>
                                <div className="text-gray-600">
                                    <span className="text-blue-700 font-medium">標準結構：</span>
                                    樓板、梁柱、牆體
                                </div>
                            </div>
                            <div className="p-2 rounded-lg bg-white border border-gray-200">
                                <div className="font-bold text-gray-800 mb-1">4000 psi (280 kgf/cm²)</div>
                                <div className="text-gray-600">
                                    <span className="text-blue-700 font-medium">高強度：</span>
                                    高樓主結構、地下室
                                </div>
                            </div>
                            <div className="p-2 rounded-lg bg-white border border-gray-200">
                                <div className="font-bold text-gray-800 mb-1">5000+ psi (350 kgf/cm²)</div>
                                <div className="text-gray-600">
                                    <span className="text-blue-700 font-medium">特殊工程：</span>
                                    橋梁、預力構件
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                            <span className="text-blue-500">💡</span>
                            <span>混凝土用量需考慮損耗率（通常 3~5%）。預拌混凝土以立方公尺(m³)計價，建議多備料避免不足。</span>
                        </div>
                    </div>

                    {/* 多列輸入區 */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {concreteRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    {/* 項目名稱 */}
                                    <div className="col-span-12 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => updateConcreteRow(row.id, 'name', e.target.value)}
                                            placeholder={`項目 ${index + 1}`}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    {/* 長度 */}
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">長度</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={row.length}
                                                onChange={(e) => updateConcreteRow(row.id, 'length', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-7"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m</span>
                                        </div>
                                    </div>
                                    {/* 寬度 */}
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">寬度</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={row.width}
                                                onChange={(e) => updateConcreteRow(row.id, 'width', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-7"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m</span>
                                        </div>
                                    </div>
                                    {/* 高度/厚度 */}
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">高度/厚度</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={row.height}
                                                onChange={(e) => updateConcreteRow(row.id, 'height', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-7"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m</span>
                                        </div>
                                    </div>
                                    {/* 計算結果 */}
                                    <div className="col-span-10 sm:col-span-3 flex items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">體積</label>
                                            <div className="text-sm font-bold text-orange-600">
                                                {concreteRowResults[index].volume > 0
                                                    ? `${formatNumber(concreteRowResults[index].volume, 4)} m³`
                                                    : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    {/* 刪除按鈕 */}
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button
                                            onClick={() => removeConcreteRow(row.id)}
                                            disabled={concreteRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 快速新增按鈕 */}
                    <button
                        onClick={addConcreteRow}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <Plus size={16} />
                        +增加新欄位
                    </button>

                    <WastageControl
                        wastage={concreteWastage}
                        setWastage={setConcreteWastage}
                        defaultValue={DEFAULT_WASTAGE.concrete}
                        useCustom={concreteCustomWastage}
                        setUseCustom={setConcreteCustomWastage}
                    />

                    {/* 總計結果 */}
                    <ResultDisplay
                        label={`混凝土用量 (共 ${concreteRowResults.filter(r => r.volume > 0).length} 項)`}
                        value={totalConcreteVolume}
                        unit="m³"
                        wastageValue={totalConcreteWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, concreteCost)}
                        subType="混凝土"
                    />

                    {/* 混凝土成本計算 */}
                    <CostInput
                        label="混凝土"
                        quantity={totalConcreteWithWastage}
                        unit="m³"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('混凝土'))}
                        onChange={setConcreteCost}
                        placeholder={{ spec: '例：3000psi' }}
                    />

                    {/* 泵浦車欄位 */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-3 mt-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <span className="bg-orange-100 text-orange-600 p-1 rounded">
                                <Building2 size={16} />
                            </span>
                            混凝土泵浦車紀錄 (非必填)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="grid grid-cols-2 gap-2">
                                <InputField label="車輛數" value={pumpTruckCount} onChange={setPumpTruckCount} unit="輛" placeholder="0" />
                                <InputField label="總車次" value={pumpTruckTrips} onChange={setPumpTruckTrips} unit="車次" placeholder="0" />
                            </div>
                            <InputField label="備註說明" value={pumpTruckNote} onChange={setPumpTruckNote} placeholder="例：45米泵浦車" type="text" />
                        </div>

                        {/* 泵浦車成本計算 */}
                        <CostInput
                            label="泵浦車"
                            quantity={parseFloat(pumpTruckTrips) || parseFloat(pumpTruckCount) || 0}
                            unit="車次"
                            vendors={vendors.filter(v => v.category === '工程工班' || v.tradeType?.includes('泵浦'))}
                            onChange={setPumpTruckCost}
                            placeholder={{ spec: '例：45米' }}
                        />

                        {(pumpTruckCount || pumpTruckTrips) && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onAddRecord?.('結構工程', '泵浦車',
                                        `泵浦車 ${pumpTruckCount ? pumpTruckCount + '輛' : ''} ${pumpTruckTrips ? pumpTruckTrips + '車次' : ''} ${pumpTruckNote ? '(' + pumpTruckNote + ')' : ''}`,
                                        parseFloat(pumpTruckTrips) || parseFloat(pumpTruckCount) || 0, '車次', 0, pumpTruckCost)}
                                    className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded text-xs hover:bg-orange-200 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={12} /> 加入記錄
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 各列明細 */}
                    {concreteRowResults.filter(r => r.volume > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {concreteRowResults.filter(r => r.volume > 0).map((row, idx) => (
                                    <div key={row.id} className="flex justify-between text-gray-600">
                                        <span>{row.name || `項目 ${idx + 1}`} ({row.length}×{row.width}×{row.height})</span>
                                        <span className="font-medium">{formatNumber(row.volume, 4)} m³</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 鋼筋計算 */}
            {calcType === 'rebar' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    {/* 子分頁切換 */}
                    <div className="flex gap-2 border-b border-gray-100 pb-3">
                        <button
                            onClick={() => setRebarMode('exact')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${rebarMode === 'exact'
                                ? 'bg-orange-100 text-orange-700 font-medium'
                                : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            精確計算
                        </button>
                        <button
                            onClick={() => setRebarMode('estimate')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${rebarMode === 'estimate'
                                ? 'bg-orange-100 text-orange-700 font-medium'
                                : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            部位概算
                        </button>
                    </div>

                    {/* 精確計算模式 */}
                    {rebarMode === 'exact' && (
                        <>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Info size={16} />
                                公式: 重量(kg) = 單位重量 × 長度 × 數量
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <SelectField
                                    label="鋼筋規格"
                                    value={rebarSpec}
                                    onChange={(v) => setRebarSpec(parseInt(v))}
                                    options={REBAR_SPECS.map((r, i) => ({ value: i, label: `${r.label} (${r.weight}kg/m)` }))}
                                />
                                <InputField label="單根長度" value={rebarLength} onChange={setRebarLength} unit="m" placeholder="0" />
                                <InputField label="數量" value={rebarCount} onChange={setRebarCount} unit="支" placeholder="0" />
                            </div>

                            {/* 鋼筋規格說明 */}
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <div className="font-medium text-blue-800 text-sm mb-2 flex items-center gap-2">
                                    <Info size={14} />
                                    鋼筋規格與常用部位說明
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 0 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#3 D10</div>
                                        <div className="text-gray-600">箍筋、繫筋</div>
                                        <div className="text-blue-600 text-[10px]">0.56 kg/m</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 1 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#4 D13</div>
                                        <div className="text-gray-600">樓板筋、牆筋</div>
                                        <div className="text-blue-600 text-[10px]">0.99 kg/m</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 2 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#5 D16</div>
                                        <div className="text-gray-600">梁主筋、柱筋</div>
                                        <div className="text-blue-600 text-[10px]">1.56 kg/m</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 3 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#6 D19</div>
                                        <div className="text-gray-600">大梁主筋</div>
                                        <div className="text-blue-600 text-[10px]">2.25 kg/m</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 4 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#7 D22</div>
                                        <div className="text-gray-600">柱主筋、基礎筋</div>
                                        <div className="text-blue-600 text-[10px]">3.04 kg/m</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 5 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#8 D25</div>
                                        <div className="text-gray-600">大柱主筋</div>
                                        <div className="text-blue-600 text-[10px]">3.98 kg/m</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 6 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#9 D29</div>
                                        <div className="text-gray-600">高樓柱筋</div>
                                        <div className="text-blue-600 text-[10px]">5.08 kg/m</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border ${rebarSpec === 7 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                        <div className="font-bold text-gray-800">#10 D32</div>
                                        <div className="text-gray-600">特殊工程</div>
                                        <div className="text-blue-600 text-[10px]">6.39 kg/m</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                                    <span className="text-blue-500">💡</span>
                                    <span>標準鋼筋長度為 12m（可訂製 6m、9m）。搭接長度依規範約為鋼筋直徑的 40~60 倍。建議損耗率 5%。</span>
                                </div>
                            </div>

                            <WastageControl
                                wastage={rebarWastage}
                                setWastage={setRebarWastage}
                                defaultValue={DEFAULT_WASTAGE.rebar}
                                useCustom={rebarCustomWastage}
                                setUseCustom={setRebarCustomWastage}
                            />
                            <ResultDisplay
                                label="鋼筋重量"
                                value={rebarWeight}
                                unit="kg"
                                wastageValue={rebarWithWastage}
                                onAddRecord={(subType, label, value, unit, wastageValue) =>
                                    onAddRecord(subType, label, value, unit, wastageValue, rebarCost)}
                                subType="鋼筋"
                            />
                            <CostInput
                                label="鋼筋"
                                quantity={rebarWithWastage}
                                unit="kg"
                                vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('鋼筋'))}
                                onChange={setRebarCost}
                                placeholder={{ spec: '例：#4 鋼筋' }}
                            />
                        </>
                    )}

                    {/* 部位概算模式 */}
                    {rebarMode === 'estimate' && (
                        <>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Info size={16} />
                                依部位輸入面積，自動估算鋼筋用量 (營造經驗值)
                            </div>

                            {/* 牆面 */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <div className="font-medium text-gray-700 text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    牆面鋼筋
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <SelectField
                                        label="牆體類型"
                                        value={rebarEstimate.wallType}
                                        onChange={(v) => setRebarEstimate(prev => ({ ...prev, wallType: parseInt(v) }))}
                                        options={REBAR_USAGE_BY_COMPONENT.wall.map((w, i) => ({ value: i, label: `${w.label} (${w.usage} kg/m²)` }))}
                                    />
                                    <InputField
                                        label="牆面面積"
                                        value={rebarEstimate.wallArea}
                                        onChange={(v) => setRebarEstimate(prev => ({ ...prev, wallArea: v }))}
                                        unit="m²"
                                        placeholder="0"
                                    />
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">估算用量</label>
                                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-orange-600">
                                            {formatNumber(rebarEstimateResults.wall)} kg
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 地板 */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <div className="font-medium text-gray-700 text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    地板/樓板鋼筋
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <SelectField
                                        label="樓板類型"
                                        value={rebarEstimate.floorType}
                                        onChange={(v) => setRebarEstimate(prev => ({ ...prev, floorType: parseInt(v) }))}
                                        options={REBAR_USAGE_BY_COMPONENT.floor.map((f, i) => ({ value: i, label: `${f.label} (${f.usage} kg/m²)` }))}
                                    />
                                    <InputField
                                        label="樓板面積"
                                        value={rebarEstimate.floorArea}
                                        onChange={(v) => setRebarEstimate(prev => ({ ...prev, floorArea: v }))}
                                        unit="m²"
                                        placeholder="0"
                                    />
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">估算用量</label>
                                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-orange-600">
                                            {formatNumber(rebarEstimateResults.floor)} kg
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 樓梯 */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <div className="font-medium text-gray-700 text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-zinc-600 rounded-full"></span>
                                    樓梯鋼筋
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <SelectField
                                        label="樓梯類型"
                                        value={rebarEstimate.stairType}
                                        onChange={(v) => setRebarEstimate(prev => ({ ...prev, stairType: parseInt(v) }))}
                                        options={REBAR_USAGE_BY_COMPONENT.stair.map((s, i) => ({ value: i, label: `${s.label} (${s.usage} kg/m²)` }))}
                                    />
                                    <InputField
                                        label="樓梯面積"
                                        value={rebarEstimate.stairArea}
                                        onChange={(v) => setRebarEstimate(prev => ({ ...prev, stairArea: v }))}
                                        unit="m²"
                                        placeholder="0"
                                    />
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">估算用量</label>
                                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-orange-600">
                                            {formatNumber(rebarEstimateResults.stair)} kg
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 總計 */}
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-orange-200 text-sm">鋼筋概算總量</div>
                                        <div className="text-3xl font-bold mt-1">
                                            {formatNumber(rebarEstimateResults.total)} <span className="text-lg">kg</span>
                                        </div>
                                        <div className="text-orange-200 text-xs mt-1">
                                            約 {formatNumber(rebarEstimateResults.total / 1000, 2)} 噸
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onAddRecord('鋼筋概算', '鋼筋概算總量', rebarEstimateResults.total, 'kg', rebarEstimateResults.total, null)}
                                        disabled={rebarEstimateResults.total <= 0}
                                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        加入記錄
                                    </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-blue-300 rounded-full"></span>
                                        牆面: {formatNumber(rebarEstimateResults.wall)} kg
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                                        地板: {formatNumber(rebarEstimateResults.floor)} kg
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-purple-300 rounded-full"></span>
                                        樓梯: {formatNumber(rebarEstimateResults.stair)} kg
                                    </div>
                                </div>
                            </div>

                            {/* 參考表格 */}
                            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                <div className="font-medium mb-2">📊 營造經驗參考值</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <div>牆 15cm: 23 kg/m²</div>
                                    <div>牆 20cm: 34 kg/m²</div>
                                    <div>牆 25cm: 47 kg/m²</div>
                                    <div>板 12cm: 13 kg/m²</div>
                                    <div>板 15cm: 17 kg/m²</div>
                                    <div>直跑梯: 40 kg/m²</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 模板計算 */}
            {calcType === 'formwork' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        公式: 模板面積 = 建築面積 × 係數 (1.3~2.2)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="建築面積" value={formworkArea} onChange={setFormworkArea} unit="m²" placeholder="0" />
                        <SelectField
                            label="模板係數"
                            value={formworkRatio}
                            onChange={setFormworkRatio}
                            options={[
                                { value: '1.3', label: '1.3 - 簡單結構 (少柱少現澆板)' },
                                { value: '1.8', label: '1.8 - 一般結構 (標準框架)' },
                                { value: '2.2', label: '2.2 - 複雜結構 (多層住宅)' },
                            ]}
                        />
                    </div>

                    {/* 模板係數詳細說明 */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="font-medium text-blue-800 text-sm mb-2 flex items-center gap-2">
                            <Info size={14} />
                            模板係數說明
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className={`p-2 rounded-lg border ${formworkRatio === '1.3' ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                <div className="font-bold text-gray-800 mb-1">係數 1.3</div>
                                <div className="text-gray-600 leading-relaxed">
                                    <div className="font-medium text-blue-700 mb-1">適用：簡單結構</div>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        <li>少量柱子的建築</li>
                                        <li>預鑄板為主，現澆板少</li>
                                        <li>單層或簡易倉庫廠房</li>
                                        <li>開放式空間較多</li>
                                    </ul>
                                </div>
                            </div>
                            <div className={`p-2 rounded-lg border ${formworkRatio === '1.8' ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                <div className="font-bold text-gray-800 mb-1">係數 1.8</div>
                                <div className="text-gray-600 leading-relaxed">
                                    <div className="font-medium text-blue-700 mb-1">適用：一般結構（最常用）</div>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        <li>標準框架結構</li>
                                        <li>一般商業/辦公建築</li>
                                        <li>標準柱距與樓板配置</li>
                                        <li>3~5 層樓建築</li>
                                    </ul>
                                </div>
                            </div>
                            <div className={`p-2 rounded-lg border ${formworkRatio === '2.2' ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'}`}>
                                <div className="font-bold text-gray-800 mb-1">係數 2.2</div>
                                <div className="text-gray-600 leading-relaxed">
                                    <div className="font-medium text-blue-700 mb-1">適用：複雜結構</div>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        <li>標準多層住宅大樓</li>
                                        <li>密集柱子與牆面</li>
                                        <li>多樓梯/電梯井</li>
                                        <li>複雜梁配置</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                            <span className="text-blue-500">💡</span>
                            <span>係數越高代表單位建築面積需要越多模板面積。實際使用時請依現場結構複雜度適當調整。</span>
                        </div>
                    </div>
                    <WastageControl
                        wastage={formworkWastage}
                        setWastage={setFormworkWastage}
                        defaultValue={DEFAULT_WASTAGE.formwork}
                        useCustom={formworkCustomWastage}
                        setUseCustom={setFormworkCustomWastage}
                    />
                    <ResultDisplay
                        label="模板面積"
                        value={formworkResult}
                        unit="m²"
                        wastageValue={formworkWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, formworkCost)}
                        subType="模板"
                    />

                    <CostInput
                        label="模板"
                        quantity={formworkWithWastage}
                        unit="m²"
                        vendors={vendors.filter(v => v.category === '工程工班' || v.tradeType?.includes('模板'))}
                        onChange={setFormworkCost}
                        placeholder={{ spec: '例：清水模板' }}
                    />
                </div>
            )}

            {/* 構件計算器 */}
            {calcType === 'component' && (
                <ComponentCalculator onAddRecord={onAddRecord} vendors={vendors} />
            )}
        </div>
    );
};
