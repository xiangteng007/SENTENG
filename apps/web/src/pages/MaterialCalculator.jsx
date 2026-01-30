
import React, { useState } from 'react';
import {
    Calculator, Building2, Layers, Grid3X3, Paintbrush, BarChart3,
    Info, RotateCcw, Settings2, ChevronDown, ChevronUp, Copy, Check,
    FileSpreadsheet, Plus, Trash2, ExternalLink, RefreshCw
} from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';
import { GoogleService } from '../services/GoogleService';
import StructuralMaterialCalculator from '../components/StructuralMaterialCalculator';

// ============================================
// 計算公式與常數定義
// ============================================

// 預設損耗率 (%)
const DEFAULT_WASTAGE = {
    concrete: 3,
    rebar: 5,
    formwork: 10,
    cement: 10,
    sand: 10,
    brick: 5,
    tile: 5,
    grout: 15,
    adhesive: 10,
    paint: 10,
    putty: 10,
};

// 紅磚用量對照表 (塊/m²)
const BRICK_PER_SQM = {
    '12': { label: '12牆 (12cm)', count: 64 },
    '18': { label: '18牆 (18cm)', count: 96 },
    '24': { label: '24牆 (24cm)', count: 128 },
    '37': { label: '37牆 (37cm)', count: 192 },
};

// 磁磚尺寸選項
const TILE_SIZES = [
    { label: '30×30 cm', l: 30, w: 30 },
    { label: '30×60 cm', l: 30, w: 60 },
    { label: '45×45 cm', l: 45, w: 45 },
    { label: '60×60 cm', l: 60, w: 60 },
    { label: '60×120 cm', l: 60, w: 120 },
    { label: '80×80 cm', l: 80, w: 80 },
    { label: '自訂', l: 0, w: 0 },
];

// 磁磚施工方法分類
const TILE_METHODS = [
    { value: 'none', label: '未選擇' },
    { value: 'wet', label: '濕式工法(軟底)' },
    { value: 'dry', label: '乾式工法(硬底)' },
    { value: 'semi', label: '半乾濕式(騷底)' },
    { value: 'hang', label: '乾掛式工法' },
];

// 粉光配比對照表
const PLASTER_RATIOS = {
    '1:2': { label: '1:2 粉光 (細)', cementPerM3: 650, sandPerM3: 800, desc: '細緻粉光面' },
    '1:3': { label: '1:3 打底 (粗)', cementPerM3: 450, sandPerM3: 950, desc: '一般打底用' },
};

// 牆壁厚度選項
const WALL_THICKNESS_OPTIONS = [
    { value: 'all', label: '全部厚度' },
    { value: 8, label: '8 cm (鋼構)' },
    { value: 10, label: '10 cm (鋼構)' },
    { value: 15, label: '15 cm' },
    { value: 18, label: '18 cm' },
    { value: 20, label: '20 cm' },
    { value: 24, label: '24 cm (1B磚)' },
    { value: 25, label: '25 cm' },
    { value: 30, label: '30 cm' },
    { value: 35, label: '35 cm (地下室)' },
    { value: 40, label: '40 cm (深地下室)' },
];

// 建築類型概估指標 (擴充版 - 含牆壁厚度與加強磚造)
const BUILDING_TYPES = [
    // ========== RC 鋼筋混凝土結構 ==========
    // 透天住宅類 (鋼筋: 100-112 kg/m², 混凝土: 0.73-0.82 m³/m²)
    { label: 'RC透天 (1-2F)', rebar: 95, concrete: 0.70, formwork: 2.0, sand: 0.08, structure: 'RC', wallThickness: 15 },
    { label: 'RC透天 (3F)', rebar: 100, concrete: 0.73, formwork: 2.1, sand: 0.09, structure: 'RC', wallThickness: 18 },
    { label: 'RC透天 (4-5F)', rebar: 108, concrete: 0.78, formwork: 2.2, sand: 0.10, structure: 'RC', wallThickness: 20 },
    { label: '別墅/Villa', rebar: 105, concrete: 0.75, formwork: 2.1, sand: 0.09, structure: 'RC', wallThickness: 18 },

    // 公寓類 (鋼筋: 121-136 kg/m², 混凝土: 0.76-0.91 m³/m²)
    { label: '公寓 (5-6F)', rebar: 121, concrete: 0.78, formwork: 2.3, sand: 0.10, structure: 'RC', wallThickness: 20 },
    { label: '公寓 (7-8F)', rebar: 128, concrete: 0.82, formwork: 2.4, sand: 0.11, structure: 'RC', wallThickness: 20 },
    { label: '電梯大樓 (9-11F)', rebar: 135, concrete: 0.85, formwork: 2.5, sand: 0.12, structure: 'RC', wallThickness: 25 },

    // 高層建築 (鋼筋: 91-130 kg/m², 混凝土: 0.38-0.50 m³/m²)
    { label: '小高層 (12-15F)', rebar: 95, concrete: 0.40, formwork: 2.4, sand: 0.10, structure: 'RC', wallThickness: 25 },
    { label: '高層 (16-20F)', rebar: 105, concrete: 0.42, formwork: 2.5, sand: 0.11, structure: 'RC', wallThickness: 25 },
    { label: '高層 (21-30F)', rebar: 115, concrete: 0.45, formwork: 2.6, sand: 0.12, structure: 'RC', wallThickness: 30 },

    // 特殊用途
    { label: '辦公大樓 (RC)', rebar: 110, concrete: 0.42, formwork: 2.5, sand: 0.10, structure: 'RC', wallThickness: 25 },
    { label: '學校/公共建築', rebar: 100, concrete: 0.40, formwork: 2.4, sand: 0.10, structure: 'RC', wallThickness: 20 },
    { label: '醫院', rebar: 120, concrete: 0.45, formwork: 2.6, sand: 0.12, structure: 'RC', wallThickness: 25 },
    { label: '工廠/倉庫 (RC)', rebar: 75, concrete: 0.35, formwork: 1.8, sand: 0.08, structure: 'RC', wallThickness: 18 },

    // 地下室 (高配筋、高混凝土用量)
    { label: '地下室 (1層)', rebar: 150, concrete: 0.55, formwork: 3.2, sand: 0.15, structure: 'RC', wallThickness: 30 },
    { label: '地下室 (2層)', rebar: 175, concrete: 0.65, formwork: 3.5, sand: 0.18, structure: 'RC', wallThickness: 35 },
    { label: '地下室 (3層+)', rebar: 200, concrete: 0.75, formwork: 4.0, sand: 0.20, structure: 'RC', wallThickness: 40 },

    // ========== SRC 鋼骨鋼筋混凝土結構 ==========
    // SRC結構鋼筋+鋼骨用量較高 (約 130-260 kg/m²)
    { label: 'SRC中高層 (10-15F)', rebar: 140, concrete: 0.42, formwork: 2.5, sand: 0.11, structure: 'SRC', wallThickness: 25 },
    { label: 'SRC高層 (16-25F)', rebar: 180, concrete: 0.48, formwork: 2.8, sand: 0.13, structure: 'SRC', wallThickness: 30 },
    { label: 'SRC超高層 (26F+)', rebar: 220, concrete: 0.52, formwork: 3.0, sand: 0.14, structure: 'SRC', wallThickness: 35 },
    { label: 'SRC辦公大樓', rebar: 160, concrete: 0.45, formwork: 2.6, sand: 0.12, structure: 'SRC', wallThickness: 25 },

    // ========== SC 鋼骨結構 ==========
    // 鋼構主要用鋼骨，鋼筋較少 (主要用於樓板)
    { label: '鋼構廠房', rebar: 35, concrete: 0.18, formwork: 1.2, sand: 0.05, structure: 'SC', wallThickness: 10 },
    { label: '鋼構辦公大樓', rebar: 50, concrete: 0.25, formwork: 1.5, sand: 0.07, structure: 'SC', wallThickness: 15 },
    { label: '鋼構高層 (20F+)', rebar: 65, concrete: 0.30, formwork: 1.8, sand: 0.08, structure: 'SC', wallThickness: 20 },
    { label: '鋼構倉庫', rebar: 25, concrete: 0.15, formwork: 1.0, sand: 0.04, structure: 'SC', wallThickness: 8 },

    // ========== RB 加強磚造結構 ==========
    // 加強磚造鋼筋較少，但砂用量較高 (砌磚用)
    { label: '加強磚造透天 (2F)', rebar: 25, concrete: 0.20, formwork: 1.2, sand: 0.45, structure: 'RB', wallThickness: 24 },
    { label: '加強磚造透天 (3F)', rebar: 30, concrete: 0.25, formwork: 1.4, sand: 0.50, structure: 'RB', wallThickness: 24 },
    { label: '加強磚造公寓', rebar: 35, concrete: 0.28, formwork: 1.5, sand: 0.55, structure: 'RB', wallThickness: 24 },
    { label: '農舍/倉庫 (磚造)', rebar: 20, concrete: 0.18, formwork: 1.0, sand: 0.40, structure: 'RB', wallThickness: 24 },
];


// 鋼筋規格表 (含工程常用號數)
const REBAR_SPECS = [
    { label: '#3 D10 (9.53mm)', d: 9.53, weight: 0.56 },
    { label: '#4 D13 (12.7mm)', d: 12.7, weight: 0.99 },
    { label: '#5 D16 (15.9mm)', d: 15.9, weight: 1.56 },
    { label: '#6 D19 (19.1mm)', d: 19.1, weight: 2.25 },
    { label: '#7 D22 (22.2mm)', d: 22.2, weight: 3.04 },
    { label: '#8 D25 (25.4mm)', d: 25.4, weight: 3.98 },
    { label: '#9 D29 (28.7mm)', d: 28.7, weight: 5.08 },
    { label: '#10 D32 (32.2mm)', d: 32.2, weight: 6.39 },
];

// 各部位鋼筋用量概算指標 (kg/m²) - 營造經驗數據
const REBAR_USAGE_BY_COMPONENT = {
    wall: [
        { label: 'RC牆 15cm', thickness: 15, usage: 23, desc: '主筋@20+箍筋' },
        { label: 'RC牆 18cm', thickness: 18, usage: 29, desc: '主筋@15+箍筋' },
        { label: 'RC牆 20cm', thickness: 20, usage: 34, desc: '雙層主筋+箍筋' },
        { label: 'RC牆 25cm', thickness: 25, usage: 47, desc: '雙層主筋+加強箍筋' },
        { label: 'RC牆 30cm', thickness: 30, usage: 58, desc: '雙層主筋+密箍' },
    ],
    floor: [
        { label: '樓板 12cm', thickness: 12, usage: 13, desc: '單層雙向配筋' },
        { label: '樓板 15cm', thickness: 15, usage: 17, desc: '單層雙向配筋' },
        { label: '加厚板 18cm', thickness: 18, usage: 25, desc: '雙層雙向配筋' },
        { label: '屋頂板', thickness: 12, usage: 16, desc: '含隔熱層配筋' },
    ],
    stair: [
        { label: '直跑樓梯', usage: 40, desc: '踏板+斜版' },
        { label: '迴轉樓梯', usage: 50, desc: '含中間平台' },
        { label: '懸臂樓梯', usage: 62, desc: '高配筋' },
    ],
    beam: [
        { label: '一般大梁', usage: 85, desc: '主筋+箍筋 (kg/m³)' },
        { label: '框架梁', usage: 100, desc: '高配筋 (kg/m³)' },
    ],
    column: [
        { label: '一般柱', usage: 120, desc: '主筋+箍筋 (kg/m³)' },
        { label: '框架柱', usage: 150, desc: '高配筋 (kg/m³)' },
    ],
};

// 構件鋼筋配筋率參考值 (kg/m³ 或 kg/m²)
const COMPONENT_REBAR_RATES = {
    column: [
        { label: '一般柱', value: 120, desc: '主筋+箍筋' },
        { label: '框架柱', value: 150, desc: '高配筋' },
    ],
    beam: [
        { label: '一般大梁', value: 85, desc: '主筋+箍筋' },
        { label: '框架梁', value: 100, desc: '高配筋' },
    ],
    slab: [
        { label: '12cm 樓板', thickness: 12, value: 13, desc: '單層雙向' },
        { label: '15cm 樓板', thickness: 15, value: 17, desc: '單層雙向' },
        { label: '18cm 加厚板', thickness: 18, value: 25, desc: '雙層雙向' },
    ],
    wall: [
        { label: '15cm 牆', thickness: 15, value: 23, desc: '主筋@20' },
        { label: '18cm 牆', thickness: 18, value: 29, desc: '主筋@15' },
        { label: '20cm 牆', thickness: 20, value: 34, desc: '雙層主筋' },
        { label: '25cm 牆', thickness: 25, value: 47, desc: '雙層+加強' },
        { label: '30cm 牆', thickness: 30, value: 58, desc: '雙層+密箍' },
    ],
    parapet: [
        { label: '輕量配筋', value: 18, desc: '單層' },
        { label: '標準配筋', value: 22, desc: '雙層' },
        { label: '加強配筋', value: 25, desc: '密配' },
    ],
    groundBeam: [
        { label: '一般地樑', value: 90, desc: '標準' },
        { label: '加強地樑', value: 110, desc: '框架' },
    ],
    foundation: [
        { label: '獨立基腳', value: 80, desc: '單柱基礎' },
        { label: '聯合基腳', value: 85, desc: '多柱基礎' },
        { label: '筏式基礎', value: 100, desc: '全面基礎' },
    ],
};

// 女兒牆預設高度選項
const PARAPET_HEIGHTS = [
    { value: 0.6, label: '60 cm (矮牆)' },
    { value: 0.9, label: '90 cm (標準)' },
    { value: 1.2, label: '120 cm (高欄)' },
];

// 構件類型定義
const COMPONENT_TYPES = [
    { id: 'column', label: '柱子', icon: '🏛️' },
    { id: 'beam', label: '樑', icon: '📏' },
    { id: 'slab', label: '樓板', icon: '⬜' },
    { id: 'wall', label: '牆體', icon: '🧱' },
    { id: 'parapet', label: '女兒牆', icon: '🏚️' },
    { id: 'groundBeam', label: '地樑', icon: '⛏️' },
    { id: 'foundation', label: '基礎', icon: '🏗️' },
];

// ============================================
// 工具函數
// ============================================

const formatNumber = (num, decimals = 2) => {
    if (isNaN(num) || num === null) return '-';
    return Number(num).toLocaleString('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
};

const applyWastage = (value, wastagePercent) => {
    return value * (1 + wastagePercent / 100);
};

// ============================================
// 子組件
// ============================================

// 輸入欄位組件
const InputField = ({ label, value, onChange, unit, placeholder, type = 'number', min = 0, step = 'any' }) => (
    <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                min={min}
                step={step}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
            {unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
            )}
        </div>
    </div>
);

// 下拉選單組件
const SelectField = ({ label, value, onChange, options }) => (
    <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-white"
        >
            {options.map((opt, i) => (
                <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
                    {typeof opt === 'object' ? opt.label : opt}
                </option>
            ))}
        </select>
    </div>
);

// 損耗率控制組件
const WastageControl = ({ wastage, setWastage, defaultValue, useCustom, setUseCustom }) => (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
        <span className="text-xs text-gray-500">損耗率:</span>
        <button
            onClick={() => setUseCustom(false)}
            className={`px-2 py-1 text-xs rounded ${!useCustom ? 'bg-orange-500 text-white' : 'bg-white border'}`}
        >
            預設 {defaultValue}%
        </button>
        <button
            onClick={() => setUseCustom(true)}
            className={`px-2 py-1 text-xs rounded ${useCustom ? 'bg-orange-500 text-white' : 'bg-white border'}`}
        >
            自訂
        </button>
        {useCustom && (
            <input
                type="number"
                value={wastage}
                onChange={(e) => setWastage(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border rounded text-xs text-center"
                min="0"
                max="100"
            />
        )}
        {useCustom && <span className="text-xs text-gray-500">%</span>}
    </div>
);

// 結果顯示組件
const ResultDisplay = ({ label, value, unit, wastageValue, showWastage = true, onAddRecord, subType = '' }) => {
    const [copied, setCopied] = useState(false);

    const copyValue = () => {
        navigator.clipboard.writeText(wastageValue || value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleAddRecord = () => {
        if (onAddRecord && value > 0) {
            onAddRecord(subType, label, value, unit, wastageValue || value);
        }
    };

    return (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="text-xs opacity-80 mb-1">{label}</div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{formatNumber(value)}</span>
                <span className="text-sm opacity-80 mb-1">{unit}</span>
                <div className="ml-auto flex gap-1">
                    {onAddRecord && value > 0 && (
                        <button onClick={handleAddRecord} className="p-1 hover:bg-white/20 rounded" title="加入記錄">
                            <Plus size={16} />
                        </button>
                    )}
                    <button onClick={copyValue} className="p-1 hover:bg-white/20 rounded" title="複製">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>
            {showWastage && wastageValue && wastageValue !== value && (
                <div className="mt-2 pt-2 border-t border-white/30 text-sm">
                    含損耗: <span className="font-bold">{formatNumber(wastageValue)}</span> {unit}
                </div>
            )}
        </div>
    );
};

// 成本輸入組件
const CostInput = ({ label, quantity, unit, unitLabel, vendors = [], onChange, placeholder = {} }) => {
    const [selectedVendor, setSelectedVendor] = useState('');
    const [spec, setSpec] = useState('');
    const [price, setPrice] = useState('');
    const [note, setNote] = useState('');

    const subtotal = (parseFloat(price) || 0) * (parseFloat(quantity) || 0);

    // 當數值變更時通知父組件
    React.useEffect(() => {
        onChange?.({
            vendor: vendors.find(v => v.id === selectedVendor)?.name || '',
            vendorId: selectedVendor,
            spec,
            price: parseFloat(price) || 0,
            subtotal,
            note
        });
    }, [selectedVendor, spec, price, note, quantity]);

    return (
        <div className="bg-orange-50 rounded-lg p-3 space-y-3 border border-orange-100 mt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                <span className="bg-orange-200 text-orange-700 p-1 rounded">
                    <Calculator size={14} />
                </span>
                {label}成本估算
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">廠商選擇</label>
                    <select
                        value={selectedVendor}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white"
                    >
                        <option value="">選擇廠商...</option>
                        {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">規格/種類</label>
                    <input
                        type="text"
                        value={spec}
                        onChange={(e) => setSpec(e.target.value)}
                        placeholder={placeholder.spec || "例：3000psi"}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">單價 ({unitLabel || (unit ? `元/${unit}` : '元')})</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">備註</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="備註說明"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-orange-200/50">
                <div className="text-xs text-orange-600">
                    數量: {formatNumber(quantity)} {unit}
                </div>
                <div className="text-sm font-bold text-orange-700">
                    小計: $ {formatNumber(subtotal, 0)}
                </div>
            </div>
        </div>
    );
};


// 0️⃣ 構件計算器 - 結構部位詳細計算 (模板+鋼筋)
const ComponentCalculator = ({ onAddRecord, vendors = [] }) => {
    const [componentType, setComponentType] = useState('column');
    const [wastage, setWastage] = useState(10);
    const [useCustomWastage, setUseCustomWastage] = useState(false);

    // 柱子狀態
    const [columnRows, setColumnRows] = useState([{ id: 1, name: '', width: '', depth: '', height: '', count: '1', rebarType: 0 }]);
    // 樑狀態
    const [beamRows, setBeamRows] = useState([{ id: 1, name: '', width: '', height: '', length: '', count: '1', rebarType: 0 }]);
    // 樓板狀態
    const [slabRows, setSlabRows] = useState([{ id: 1, name: '', length: '', width: '', thickness: '15', rebarType: 1 }]);
    // 牆體狀態
    const [wallRows, setWallRows] = useState([{ id: 1, name: '', length: '', height: '', thickness: '20', rebarType: 2 }]);
    // 女兒牆狀態
    const [parapetRows, setParapetRows] = useState([{ id: 1, name: '', perimeter: '', height: '0.9', thickness: '15', rebarType: 1 }]);
    // 地樑狀態
    const [groundBeamRows, setGroundBeamRows] = useState([{ id: 1, name: '', width: '', depth: '', length: '', count: '1', rebarType: 0 }]);
    // 基礎狀態
    const [foundationRows, setFoundationRows] = useState([{ id: 1, name: '', length: '', width: '', depth: '', count: '1', foundationType: 0 }]);

    const currentWastage = useCustomWastage ? wastage : 10;

    // 計算函數
    const calculateColumn = (row) => {
        const w = parseFloat(row.width) / 100 || 0; // cm to m
        const d = parseFloat(row.depth) / 100 || 0;
        const h = parseFloat(row.height) || 0;
        const n = parseFloat(row.count) || 1;
        const rebarRate = COMPONENT_REBAR_RATES.column[row.rebarType]?.value || 120;

        const formwork = 2 * (w + d) * h * n;
        const concrete = w * d * h * n;
        const rebar = concrete * rebarRate;
        return { formwork, concrete, rebar };
    };

    const calculateBeam = (row) => {
        const w = parseFloat(row.width) / 100 || 0;
        const h = parseFloat(row.height) / 100 || 0;
        const l = parseFloat(row.length) || 0;
        const n = parseFloat(row.count) || 1;
        const rebarRate = COMPONENT_REBAR_RATES.beam[row.rebarType]?.value || 85;

        const formwork = (w + 2 * h) * l * n; // 底模+兩側模
        const concrete = w * h * l * n;
        const rebar = concrete * rebarRate;
        return { formwork, concrete, rebar };
    };

    const calculateSlab = (row) => {
        const l = parseFloat(row.length) || 0;
        const w = parseFloat(row.width) || 0;
        const t = parseFloat(row.thickness) / 100 || 0.15;
        const rebarRate = COMPONENT_REBAR_RATES.slab[row.rebarType]?.value || 17;

        const area = l * w;  // 底面積
        const perimeter = 2 * (l + w);  // 周長
        const edgeFormwork = perimeter * t;  // 側邊模板
        const formwork = area + edgeFormwork;  // 底模 + 側模
        const concrete = area * t;
        const rebar = area * rebarRate;
        return { formwork, concrete, rebar };
    };

    const calculateWall = (row) => {
        const l = parseFloat(row.length) || 0;
        const h = parseFloat(row.height) || 0;
        const t = parseFloat(row.thickness) / 100 || 0.2;
        const rebarRate = COMPONENT_REBAR_RATES.wall[row.rebarType]?.value || 34;

        const area = l * h;
        const formwork = 2 * area; // 雙面
        const concrete = area * t;
        const rebar = area * rebarRate;
        return { formwork, concrete, rebar };
    };

    const calculateParapet = (row) => {
        const p = parseFloat(row.perimeter) || 0;
        const h = parseFloat(row.height) || 0.9;
        const t = parseFloat(row.thickness) / 100 || 0.15;
        const rebarRate = COMPONENT_REBAR_RATES.parapet[row.rebarType]?.value || 22;

        const area = p * h;
        const formwork = 2 * area; // 內外雙面
        const concrete = area * t;
        const rebar = area * rebarRate;
        return { formwork, concrete, rebar };
    };

    const calculateGroundBeam = (row) => {
        const w = parseFloat(row.width) / 100 || 0;
        const d = parseFloat(row.depth) / 100 || 0;
        const l = parseFloat(row.length) || 0;
        const n = parseFloat(row.count) || 1;
        const rebarRate = COMPONENT_REBAR_RATES.groundBeam[row.rebarType]?.value || 90;

        const formwork = (w + 2 * d) * l * n; // 底模+兩側 (無頂)
        const concrete = w * d * l * n;
        const rebar = concrete * rebarRate;
        return { formwork, concrete, rebar };
    };

    const calculateFoundation = (row) => {
        const l = parseFloat(row.length) || 0;
        const w = parseFloat(row.width) || 0;
        const d = parseFloat(row.depth) || 0;
        const n = parseFloat(row.count) || 1;
        const rebarRate = COMPONENT_REBAR_RATES.foundation[row.foundationType]?.value || 80;

        const perimeter = 2 * (l + w);
        const formwork = perimeter * d * n; // 周長 × 深度
        const concrete = l * w * d * n;
        const rebar = concrete * rebarRate;
        return { formwork, concrete, rebar };
    };

    // 列操作通用函數
    const addRow = (rows, setRows, template) => {
        const newId = Math.max(...rows.map(r => r.id), 0) + 1;
        setRows([...rows, { ...template, id: newId }]);
    };
    const removeRow = (rows, setRows, id) => {
        if (rows.length <= 1) return;
        setRows(rows.filter(r => r.id !== id));
    };
    const updateRow = (rows, setRows, id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    // 計算結果
    const calculateResults = () => {
        let rows, calcFn;
        switch (componentType) {
            case 'column': rows = columnRows; calcFn = calculateColumn; break;
            case 'beam': rows = beamRows; calcFn = calculateBeam; break;
            case 'slab': rows = slabRows; calcFn = calculateSlab; break;
            case 'wall': rows = wallRows; calcFn = calculateWall; break;
            case 'parapet': rows = parapetRows; calcFn = calculateParapet; break;
            case 'groundBeam': rows = groundBeamRows; calcFn = calculateGroundBeam; break;
            case 'foundation': rows = foundationRows; calcFn = calculateFoundation; break;
            default: return { formwork: 0, concrete: 0, rebar: 0 };
        }
        return rows.reduce((acc, row) => {
            const r = calcFn(row);
            return { formwork: acc.formwork + r.formwork, concrete: acc.concrete + r.concrete, rebar: acc.rebar + r.rebar };
        }, { formwork: 0, concrete: 0, rebar: 0 });
    };

    const results = calculateResults();
    const formworkWithWastage = applyWastage(results.formwork, currentWastage);
    const rebarWithWastage = applyWastage(results.rebar, currentWastage);

    // 渲染輸入表單
    const renderInputForm = () => {
        const commonInputClass = "w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent";

        switch (componentType) {
            case 'column':
                return columnRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(columnRows, setColumnRows, row.id, 'name', e.target.value)} placeholder={`柱 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">寬度 (cm)</label>
                                <input type="number" value={row.width} onChange={e => updateRow(columnRows, setColumnRows, row.id, 'width', e.target.value)} placeholder="40" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">深度 (cm)</label>
                                <input type="number" value={row.depth} onChange={e => updateRow(columnRows, setColumnRows, row.id, 'depth', e.target.value)} placeholder="40" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">高度 (m)</label>
                                <input type="number" value={row.height} onChange={e => updateRow(columnRows, setColumnRows, row.id, 'height', e.target.value)} placeholder="3" className={commonInputClass} />
                            </div>
                            <div className="col-span-3 sm:col-span-1">
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input type="number" value={row.count} onChange={e => updateRow(columnRows, setColumnRows, row.id, 'count', e.target.value)} placeholder="1" className={commonInputClass} />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">配筋</label>
                                <select value={row.rebarType} onChange={e => updateRow(columnRows, setColumnRows, row.id, 'rebarType', parseInt(e.target.value))} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.column.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-3 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(columnRows, setColumnRows, row.id)} disabled={columnRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            case 'beam':
                return beamRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(beamRows, setBeamRows, row.id, 'name', e.target.value)} placeholder={`樑 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">寬度 (cm)</label>
                                <input type="number" value={row.width} onChange={e => updateRow(beamRows, setBeamRows, row.id, 'width', e.target.value)} placeholder="30" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">梁高 (cm)</label>
                                <input type="number" value={row.height} onChange={e => updateRow(beamRows, setBeamRows, row.id, 'height', e.target.value)} placeholder="60" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">長度 (m)</label>
                                <input type="number" value={row.length} onChange={e => updateRow(beamRows, setBeamRows, row.id, 'length', e.target.value)} placeholder="6" className={commonInputClass} />
                            </div>
                            <div className="col-span-3 sm:col-span-1">
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input type="number" value={row.count} onChange={e => updateRow(beamRows, setBeamRows, row.id, 'count', e.target.value)} placeholder="1" className={commonInputClass} />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">配筋</label>
                                <select value={row.rebarType} onChange={e => updateRow(beamRows, setBeamRows, row.id, 'rebarType', parseInt(e.target.value))} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.beam.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-3 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(beamRows, setBeamRows, row.id)} disabled={beamRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            case 'slab':
                return slabRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(slabRows, setSlabRows, row.id, 'name', e.target.value)} placeholder={`樓板 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">長度 (m)</label>
                                <input type="number" value={row.length} onChange={e => updateRow(slabRows, setSlabRows, row.id, 'length', e.target.value)} placeholder="10" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">寬度 (m)</label>
                                <input type="number" value={row.width} onChange={e => updateRow(slabRows, setSlabRows, row.id, 'width', e.target.value)} placeholder="8" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-3">
                                <label className="block text-xs text-gray-500 mb-1">厚度/配筋</label>
                                <select value={row.rebarType} onChange={e => { updateRow(slabRows, setSlabRows, row.id, 'rebarType', parseInt(e.target.value)); updateRow(slabRows, setSlabRows, row.id, 'thickness', COMPONENT_REBAR_RATES.slab[parseInt(e.target.value)]?.thickness || 15); }} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.slab.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-9 sm:col-span-2"></div>
                            <div className="col-span-3 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(slabRows, setSlabRows, row.id)} disabled={slabRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            case 'wall':
                return wallRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(wallRows, setWallRows, row.id, 'name', e.target.value)} placeholder={`牆 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">長度 (m)</label>
                                <input type="number" value={row.length} onChange={e => updateRow(wallRows, setWallRows, row.id, 'length', e.target.value)} placeholder="6" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">高度 (m)</label>
                                <input type="number" value={row.height} onChange={e => updateRow(wallRows, setWallRows, row.id, 'height', e.target.value)} placeholder="3" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-3">
                                <label className="block text-xs text-gray-500 mb-1">厚度/配筋</label>
                                <select value={row.rebarType} onChange={e => { updateRow(wallRows, setWallRows, row.id, 'rebarType', parseInt(e.target.value)); updateRow(wallRows, setWallRows, row.id, 'thickness', COMPONENT_REBAR_RATES.wall[parseInt(e.target.value)]?.thickness || 20); }} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.wall.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-9 sm:col-span-2"></div>
                            <div className="col-span-3 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(wallRows, setWallRows, row.id)} disabled={wallRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            case 'parapet':
                return parapetRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(parapetRows, setParapetRows, row.id, 'name', e.target.value)} placeholder={`女兒牆 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">周長 (m)</label>
                                <input type="number" value={row.perimeter} onChange={e => updateRow(parapetRows, setParapetRows, row.id, 'perimeter', e.target.value)} placeholder="50" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">高度</label>
                                <select value={row.height} onChange={e => updateRow(parapetRows, setParapetRows, row.id, 'height', e.target.value)} className={commonInputClass + " bg-white"}>
                                    {PARAPET_HEIGHTS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">厚度 (cm)</label>
                                <input type="number" value={row.thickness} onChange={e => updateRow(parapetRows, setParapetRows, row.id, 'thickness', e.target.value)} placeholder="15" className={commonInputClass} />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">配筋</label>
                                <select value={row.rebarType} onChange={e => updateRow(parapetRows, setParapetRows, row.id, 'rebarType', parseInt(e.target.value))} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.parapet.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-6 sm:col-span-2 flex justify-end">
                                <button onClick={() => removeRow(parapetRows, setParapetRows, row.id)} disabled={parapetRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            case 'groundBeam':
                return groundBeamRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(groundBeamRows, setGroundBeamRows, row.id, 'name', e.target.value)} placeholder={`地樑 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">寬度 (cm)</label>
                                <input type="number" value={row.width} onChange={e => updateRow(groundBeamRows, setGroundBeamRows, row.id, 'width', e.target.value)} placeholder="40" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">深度 (cm)</label>
                                <input type="number" value={row.depth} onChange={e => updateRow(groundBeamRows, setGroundBeamRows, row.id, 'depth', e.target.value)} placeholder="60" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">長度 (m)</label>
                                <input type="number" value={row.length} onChange={e => updateRow(groundBeamRows, setGroundBeamRows, row.id, 'length', e.target.value)} placeholder="8" className={commonInputClass} />
                            </div>
                            <div className="col-span-3 sm:col-span-1">
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input type="number" value={row.count} onChange={e => updateRow(groundBeamRows, setGroundBeamRows, row.id, 'count', e.target.value)} placeholder="1" className={commonInputClass} />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">配筋</label>
                                <select value={row.rebarType} onChange={e => updateRow(groundBeamRows, setGroundBeamRows, row.id, 'rebarType', parseInt(e.target.value))} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.groundBeam.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-3 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(groundBeamRows, setGroundBeamRows, row.id)} disabled={groundBeamRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            case 'foundation':
                return foundationRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(foundationRows, setFoundationRows, row.id, 'name', e.target.value)} placeholder={`基礎 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">長度 (m)</label>
                                <input type="number" value={row.length} onChange={e => updateRow(foundationRows, setFoundationRows, row.id, 'length', e.target.value)} placeholder="2" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">寬度 (m)</label>
                                <input type="number" value={row.width} onChange={e => updateRow(foundationRows, setFoundationRows, row.id, 'width', e.target.value)} placeholder="2" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">深度 (m)</label>
                                <input type="number" value={row.depth} onChange={e => updateRow(foundationRows, setFoundationRows, row.id, 'depth', e.target.value)} placeholder="0.5" className={commonInputClass} />
                            </div>
                            <div className="col-span-3 sm:col-span-1">
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input type="number" value={row.count} onChange={e => updateRow(foundationRows, setFoundationRows, row.id, 'count', e.target.value)} placeholder="1" className={commonInputClass} />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">基礎類型</label>
                                <select value={row.foundationType} onChange={e => updateRow(foundationRows, setFoundationRows, row.id, 'foundationType', parseInt(e.target.value))} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.foundation.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-3 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(foundationRows, setFoundationRows, row.id)} disabled={foundationRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            default:
                return null;
        }
    };

    const getAddRowHandler = () => {
        const templates = {
            column: { name: '', width: '', depth: '', height: '', count: '1', rebarType: 0 },
            beam: { name: '', width: '', height: '', length: '', count: '1', rebarType: 0 },
            slab: { name: '', length: '', width: '', thickness: '15', rebarType: 1 },
            wall: { name: '', length: '', height: '', thickness: '20', rebarType: 2 },
            parapet: { name: '', perimeter: '', height: '0.9', thickness: '15', rebarType: 1 },
            groundBeam: { name: '', width: '', depth: '', length: '', count: '1', rebarType: 0 },
            foundation: { name: '', length: '', width: '', depth: '', count: '1', foundationType: 0 },
        };
        const setters = { column: [columnRows, setColumnRows], beam: [beamRows, setBeamRows], slab: [slabRows, setSlabRows], wall: [wallRows, setWallRows], parapet: [parapetRows, setParapetRows], groundBeam: [groundBeamRows, setGroundBeamRows], foundation: [foundationRows, setFoundationRows] };
        return () => addRow(setters[componentType][0], setters[componentType][1], templates[componentType]);
    };

    const componentLabel = COMPONENT_TYPES.find(c => c.id === componentType)?.label || '構件';

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
            {/* 構件類型選擇 */}
            <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-3">
                {COMPONENT_TYPES.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setComponentType(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${componentType === c.id ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <span>{c.icon}</span> {c.label}
                    </button>
                ))}
            </div>

            {/* 公式說明 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info size={16} />
                {componentType === 'column' && '公式: 模板 = 2×(寬+深)×高×數量, 鋼筋 = 體積×配筋率'}
                {componentType === 'beam' && '公式: 模板 = (底寬+2×梁高)×長度, 鋼筋 = 體積×配筋率'}
                {componentType === 'slab' && '公式: 模板 = 底面積+側邊(周長×厚度), 鋼筋 = 面積×配筋率'}
                {componentType === 'wall' && '公式: 模板 = 2×面積 (雙面), 鋼筋 = 面積×配筋率'}
                {componentType === 'parapet' && '公式: 模板 = 2×周長×高度, 鋼筋 = 面積×配筋率'}
                {componentType === 'groundBeam' && '公式: 模板 = (底寬+2×深)×長度, 鋼筋 = 體積×配筋率'}
                {componentType === 'foundation' && '公式: 模板 = 周長×深度, 鋼筋 = 體積×配筋率'}
            </div>

            {/* 輸入表單 */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {renderInputForm()}
            </div>

            {/* 新增按鈕 */}
            <button onClick={getAddRowHandler()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> 新增{componentLabel}
            </button>

            {/* 損耗率控制 */}
            <WastageControl wastage={wastage} setWastage={setWastage} defaultValue={10} useCustom={useCustomWastage} setUseCustom={setUseCustomWastage} />

            {/* 結果顯示 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ResultDisplay label="模板面積" value={results.formwork} unit="m²" wastageValue={formworkWithWastage} subType="模板" onAddRecord={onAddRecord} />
                <ResultDisplay label="鋼筋重量" value={results.rebar} unit="kg" wastageValue={rebarWithWastage} subType="鋼筋" onAddRecord={onAddRecord} />
            </div>

            {/* 混凝土體積 (附加資訊) */}
            {results.concrete > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <span className="font-medium">混凝土體積:</span> {formatNumber(results.concrete, 3)} m³
                </div>
            )}
        </div>
    );
};

// 1️⃣ 結構工程計算器 (支援多列輸入)
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
                                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
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

// 2️⃣ 泥作工程計算器 (支援多列輸入)
const MasonryCalculator = ({ onAddRecord, vendors = [] }) => {
    const [calcType, setCalcType] = useState('mortar');

    // 打底砂漿 - 多列支援
    const [mortarRows, setMortarRows] = useState([
        { id: 1, name: '', area: '', thickness: '2.5' }
    ]);
    const [mortarWastage, setMortarWastage] = useState(DEFAULT_WASTAGE.cement);
    const [mortarCustomWastage, setMortarCustomWastage] = useState(false);
    const [mortarCost, setMortarCost] = useState(null);

    // 紅磚 - 多列支援
    const [brickRows, setBrickRows] = useState([
        { id: 1, name: '', area: '', wallType: '24' }
    ]);
    const [brickWastage, setBrickWastage] = useState(DEFAULT_WASTAGE.brick);
    const [brickCustomWastage, setBrickCustomWastage] = useState(false);
    const [brickCost, setBrickCost] = useState(null);

    // 快速估算
    const [quickArea, setQuickArea] = useState('');

    // 粉光配比計算器
    const [plasterRatio, setPlasterRatio] = useState('1:3');
    const [plasterArea, setPlasterArea] = useState('');
    const [plasterThickness, setPlasterThickness] = useState('1.5');
    const [plasterCost, setPlasterCost] = useState(null);

    // 計算每列砂漿結果
    const mortarRowResults = mortarRows.map(row => {
        const thicknessRatio = parseFloat(row.thickness) / 2.5;
        const area = parseFloat(row.area) || 0;
        const cement = area * 10.6 * thicknessRatio;
        const sand = area * 42.8 * thicknessRatio;
        return { ...row, cement, sand };
    });

    // 總計砂漿
    const totalCement = mortarRowResults.reduce((sum, row) => sum + row.cement, 0);
    const totalSand = mortarRowResults.reduce((sum, row) => sum + row.sand, 0);
    const currentMortarWastage = mortarCustomWastage ? mortarWastage : DEFAULT_WASTAGE.cement;
    const totalCementWithWastage = applyWastage(totalCement, currentMortarWastage);
    const totalSandWithWastage = applyWastage(totalSand, currentMortarWastage);

    // 砂漿列操作
    const addMortarRow = () => {
        const newId = Math.max(...mortarRows.map(r => r.id), 0) + 1;
        setMortarRows([...mortarRows, { id: newId, name: '', area: '', thickness: '2.5' }]);
    };
    const removeMortarRow = (id) => {
        if (mortarRows.length <= 1) return;
        setMortarRows(mortarRows.filter(row => row.id !== id));
    };
    const updateMortarRow = (id, field, value) => {
        setMortarRows(mortarRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    const clearMortarRows = () => {
        setMortarRows([{ id: 1, name: '', area: '', thickness: '2.5' }]);
    };

    // 計算每列紅磚結果
    const brickRowResults = brickRows.map(row => {
        const area = parseFloat(row.area) || 0;
        const count = area * (BRICK_PER_SQM[row.wallType]?.count || 128);
        return { ...row, count };
    });

    // 總計紅磚
    const totalBricks = brickRowResults.reduce((sum, row) => sum + row.count, 0);
    const currentBrickWastage = brickCustomWastage ? brickWastage : DEFAULT_WASTAGE.brick;
    const totalBricksWithWastage = applyWastage(totalBricks, currentBrickWastage);

    // 紅磚列操作
    const addBrickRow = () => {
        const newId = Math.max(...brickRows.map(r => r.id), 0) + 1;
        setBrickRows([...brickRows, { id: newId, name: '', area: '', wallType: '24' }]);
    };
    const removeBrickRow = (id) => {
        if (brickRows.length <= 1) return;
        setBrickRows(brickRows.filter(row => row.id !== id));
    };
    const updateBrickRow = (id, field, value) => {
        setBrickRows(brickRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    const clearBrickRows = () => {
        setBrickRows([{ id: 1, name: '', area: '', wallType: '24' }]);
    };

    // 快速估算
    const quickCement = (parseFloat(quickArea) || 0) * 0.4;
    const quickSand = (parseFloat(quickArea) || 0) * 0.05;

    // 粉光配比計算
    const selectedPlaster = PLASTER_RATIOS[plasterRatio];
    const plasterAreaNum = parseFloat(plasterArea) || 0;
    const plasterThicknessNum = parseFloat(plasterThickness) / 100; // cm to m
    const plasterVolume = plasterAreaNum * plasterThicknessNum; // m³
    const plasterCement = plasterVolume * selectedPlaster.cementPerM3;
    const plasterSand = plasterVolume * selectedPlaster.sandPerM3;

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'mortar', label: '打底砂漿' },
                    { id: 'plaster', label: '粉光配比' },
                    { id: 'brick', label: '紅磚用量' },
                    { id: 'quick', label: '快速估算' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCalcType(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${calcType === item.id ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 粉光配比計算器 */}
            {calcType === 'plaster' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        <div>
                            <p>1:2 粉光: 水泥 650kg/m³ + 砂 800kg/m³ (細緻)</p>
                            <p>1:3 打底: 水泥 450kg/m³ + 砂 950kg/m³ (一般)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <SelectField
                            label="配比選擇"
                            value={plasterRatio}
                            onChange={setPlasterRatio}
                            options={Object.entries(PLASTER_RATIOS).map(([k, v]) => ({ value: k, label: v.label }))}
                        />
                        <InputField label="施作面積" value={plasterArea} onChange={setPlasterArea} unit="m²" placeholder="0" />
                        <InputField label="塗抹厚度" value={plasterThickness} onChange={setPlasterThickness} unit="cm" placeholder="1.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay
                            label="水泥用量"
                            value={plasterCement}
                            unit="kg"
                            showWastage={false}
                            onAddRecord={(subType, label, value, unit, wastageValue) =>
                                onAddRecord(subType, label, value, unit, wastageValue, plasterCost)}
                            subType={`粉光 ${plasterRatio}`}
                        />
                        <ResultDisplay
                            label="砂用量"
                            value={plasterSand}
                            unit="kg"
                            showWastage={false}
                            onAddRecord={(subType, label, value, unit, wastageValue) =>
                                onAddRecord(subType, label, value, unit, wastageValue, plasterCost)}
                            subType={`粉光 ${plasterRatio}`}
                        />
                    </div>

                    <CostInput
                        label="水泥/砂"
                        quantity={plasterCement + plasterSand} // 簡易加總，實際可能需分開但此處簡化
                        unit="kg"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('水泥'))}
                        onChange={setPlasterCost}
                        placeholder={{ spec: '例：水泥+砂' }}
                    />
                </div>
            )}

            {/* 打底砂漿 - 多列模式 */}
            {calcType === 'mortar' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            公式: 1:3 砂漿, 基準: 2.5cm厚 → 水泥 10.6kg/m², 砂 42.8kg/m²
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{mortarRows.length} 列</span>
                            <button
                                onClick={() => mortarRows.length > 1 && removeMortarRow(mortarRows[mortarRows.length - 1].id)}
                                disabled={mortarRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button
                                onClick={addMortarRow}
                                className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                            {mortarRows.length > 1 && (
                                <button onClick={clearMortarRows} className="text-xs text-gray-500 hover:text-gray-700 ml-1">清空</button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {mortarRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => updateMortarRow(row.id, 'name', e.target.value)}
                                            placeholder={`區域 ${index + 1}`}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="col-span-5 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">施作面積</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={row.area}
                                                onChange={(e) => updateMortarRow(row.id, 'area', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">厚度</label>
                                        <select
                                            value={row.thickness}
                                            onChange={(e) => updateMortarRow(row.id, 'thickness', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="1.5">1.5cm</option>
                                            <option value="2.0">2.0cm</option>
                                            <option value="2.5">2.5cm</option>
                                            <option value="3.0">3.0cm</option>
                                            <option value="4.0">4.0cm</option>
                                        </select>
                                    </div>
                                    <div className="col-span-10 sm:col-span-3 flex items-center gap-2">
                                        <div className="flex-1 text-xs">
                                            <span className="text-gray-500">水泥:</span> <span className="font-bold text-orange-600">{formatNumber(mortarRowResults[index].cement, 1)}kg</span>
                                            <span className="text-gray-500 ml-2">砂:</span> <span className="font-bold text-orange-600">{formatNumber(mortarRowResults[index].sand, 1)}kg</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button
                                            onClick={() => removeMortarRow(row.id)}
                                            disabled={mortarRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addMortarRow}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <Plus size={16} />
                        +增加新欄位
                    </button>

                    <WastageControl
                        wastage={mortarWastage}
                        setWastage={setMortarWastage}
                        defaultValue={DEFAULT_WASTAGE.cement}
                        useCustom={mortarCustomWastage}
                        setUseCustom={setMortarCustomWastage}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay
                            label={`水泥用量 (共 ${mortarRowResults.filter(r => r.cement > 0).length} 項)`}
                            value={totalCement}
                            unit="kg"
                            wastageValue={totalCementWithWastage}
                            onAddRecord={(subType, label, value, unit, wastageValue) =>
                                onAddRecord(subType, label, value, unit, wastageValue, mortarCost)}
                            subType="打底砂漿"
                        />
                        <ResultDisplay
                            label={`砂用量 (共 ${mortarRowResults.filter(r => r.sand > 0).length} 項)`}
                            value={totalSand}
                            unit="kg"
                            wastageValue={totalSandWithWastage}
                            onAddRecord={(subType, label, value, unit, wastageValue) =>
                                onAddRecord(subType, label, value, unit, wastageValue, mortarCost)}
                            subType="打底砂漿"
                        />
                    </div>

                    <CostInput
                        label="水泥/砂"
                        quantity={totalCementWithWastage + totalSandWithWastage}
                        unit="kg"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('水泥'))}
                        onChange={setMortarCost}
                        placeholder={{ spec: '例：水泥+砂' }}
                    />

                    {mortarRowResults.filter(r => r.cement > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {mortarRowResults.filter(r => r.cement > 0).map((row, idx) => (
                                    <div key={row.id} className="flex justify-between text-gray-600">
                                        <span>{row.name || `區域 ${idx + 1}`} ({row.area}m² × {row.thickness}cm)</span>
                                        <span className="font-medium">水泥 {formatNumber(row.cement, 1)}kg, 砂 {formatNumber(row.sand, 1)}kg</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 紅磚用量 - 多列模式 */}
            {calcType === 'brick' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            12牆=64塊/m², 18牆=96塊/m², 24牆=128塊/m², 37牆=192塊/m²
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{brickRows.length} 列</span>
                            <button
                                onClick={() => brickRows.length > 1 && removeBrickRow(brickRows[brickRows.length - 1].id)}
                                disabled={brickRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button
                                onClick={addBrickRow}
                                className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                            {brickRows.length > 1 && (
                                <button onClick={clearBrickRows} className="text-xs text-gray-500 hover:text-gray-700 ml-1">清空</button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {brickRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => updateBrickRow(row.id, 'name', e.target.value)}
                                            placeholder={`牆面 ${index + 1}`}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="col-span-5 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">牆面面積</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={row.area}
                                                onChange={(e) => updateBrickRow(row.id, 'area', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">牆厚</label>
                                        <select
                                            value={row.wallType}
                                            onChange={(e) => updateBrickRow(row.id, 'wallType', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500"
                                        >
                                            {Object.entries(BRICK_PER_SQM).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-10 sm:col-span-3 flex items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">數量</label>
                                            <div className="text-sm font-bold text-orange-600">
                                                {brickRowResults[index].count > 0 ? `${formatNumber(brickRowResults[index].count, 0)} 塊` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button
                                            onClick={() => removeBrickRow(row.id)}
                                            disabled={brickRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addBrickRow}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <Plus size={16} />
                        +增加新欄位
                    </button>

                    <WastageControl
                        wastage={brickWastage}
                        setWastage={setBrickWastage}
                        defaultValue={DEFAULT_WASTAGE.brick}
                        useCustom={brickCustomWastage}
                        setUseCustom={setBrickCustomWastage}
                    />

                    <ResultDisplay
                        label={`紅磚數量 (共 ${brickRowResults.filter(r => r.count > 0).length} 項)`}
                        value={totalBricks}
                        unit="塊"
                        wastageValue={totalBricksWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, brickCost)}
                        subType="紅磚"
                    />

                    <CostInput
                        label="紅磚"
                        quantity={totalBricksWithWastage}
                        unit="塊"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('磚'))}
                        onChange={setBrickCost}
                        placeholder={{ spec: '例：2寸紅磚' }}
                    />

                    {brickRowResults.filter(r => r.count > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {brickRowResults.filter(r => r.count > 0).map((row, idx) => (
                                    <div key={row.id} className="flex justify-between text-gray-600">
                                        <span>{row.name || `牆面 ${idx + 1}`} ({row.area}m² × {BRICK_PER_SQM[row.wallType]?.label})</span>
                                        <span className="font-medium">{formatNumber(row.count, 0)} 塊</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {calcType === 'quick' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info size={16} />
                        裝修口訣: 水泥=面積×0.4, 砂=面積×0.05
                    </div>
                    <InputField label="建築面積" value={quickArea} onChange={setQuickArea} unit="m²" placeholder="0" />
                    <div className="grid grid-cols-2 gap-3">
                        <ResultDisplay label="水泥概估" value={quickCement} unit="包" showWastage={false} onAddRecord={onAddRecord} subType="快速估算" />
                        <ResultDisplay label="砂概估" value={quickSand} unit="m³" showWastage={false} onAddRecord={onAddRecord} subType="快速估算" />
                    </div>
                </div>
            )}
        </div>
    );
};


// 3️⃣ 磁磚工程計算器 (支援多列輸入)
const TileCalculator = ({ onAddRecord, vendors = [] }) => {
    const [calcType, setCalcType] = useState('tiles');

    // 磁磚片數 - 多列支援
    const [tileRows, setTileRows] = useState([
        { id: 1, name: '', area: '', unit: 'ping', sizeIdx: 3, method: 'none' }
    ]);
    const [customTileL, setCustomTileL] = useState('60');
    const [customTileW, setCustomTileW] = useState('60');
    const [tileWastage, setTileWastage] = useState(DEFAULT_WASTAGE.tile);
    const [tileCustomWastage, setTileCustomWastage] = useState(false);
    const [tileCost, setTileCost] = useState(null);

    // 填縫劑 - 多列支援
    const [groutRows, setGroutRows] = useState([
        { id: 1, name: '', area: '' }
    ]);
    const [groutTileL, setGroutTileL] = useState('60');
    const [groutTileW, setGroutTileW] = useState('60');
    const [groutWidth, setGroutWidth] = useState('3');
    const [groutDepth, setGroutDepth] = useState('5');
    const [groutWastage, setGroutWastage] = useState(DEFAULT_WASTAGE.grout);
    const [groutCustomWastage, setGroutCustomWastage] = useState(false);
    const [groutCost, setGroutCost] = useState(null);

    // 黏著劑 - 多列支援
    const [adhesiveRows, setAdhesiveRows] = useState([
        { id: 1, name: '', area: '', trowel: '4' }
    ]);
    const [adhesiveWastage, setAdhesiveWastage] = useState(DEFAULT_WASTAGE.adhesive);
    const [adhesiveCustomWastage, setAdhesiveCustomWastage] = useState(false);
    const [adhesiveCost, setAdhesiveCost] = useState(null);

    // 計算每列磁磚結果
    const tileRowResults = tileRows.map(row => {
        const selectedTile = TILE_SIZES[row.sizeIdx] || TILE_SIZES[3];
        const tileL = selectedTile.l || parseFloat(customTileL) || 60;
        const tileW = selectedTile.w || parseFloat(customTileW) || 60;
        const areaSqm = row.unit === 'ping' ? (parseFloat(row.area) || 0) * 3.30579 : (parseFloat(row.area) || 0);
        const tilesPerSqm = 10000 / (tileL * tileW);
        const count = areaSqm * tilesPerSqm;
        return { ...row, count, tileL, tileW };
    });

    // 總計磁磚
    const totalTiles = tileRowResults.reduce((sum, row) => sum + row.count, 0);
    const currentTileWastage = tileCustomWastage ? tileWastage : DEFAULT_WASTAGE.tile;
    const totalTilesWithWastage = applyWastage(totalTiles, currentTileWastage);
    const selectedTileForDisplay = TILE_SIZES[tileRows[0]?.sizeIdx || 3];
    const displayTileL = selectedTileForDisplay.l || parseFloat(customTileL) || 60;
    const displayTileW = selectedTileForDisplay.w || parseFloat(customTileW) || 60;
    const tileCountPerPing = 32400 / (displayTileL * displayTileW);
    const [tileLaborCost, setTileLaborCost] = useState(null);

    // 計算總坪數 (用於工資計算)
    const totalAreaPing = tileRowResults.reduce((sum, row) => {
        const area = parseFloat(row.area) || 0;
        return sum + (row.unit === 'ping' ? area : area * 0.3025);
    }, 0);

    // 磁磚列操作
    const addTileRow = () => {
        const newId = Math.max(...tileRows.map(r => r.id), 0) + 1;
        setTileRows([...tileRows, { id: newId, name: '', area: '', unit: 'ping', sizeIdx: 3, method: 'none' }]);
    };
    const removeTileRow = (id) => {
        if (tileRows.length <= 1) return;
        setTileRows(tileRows.filter(row => row.id !== id));
    };
    const updateTileRow = (id, field, value) => {
        setTileRows(tileRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    const clearTileRows = () => {
        setTileRows([{ id: 1, name: '', area: '', unit: 'ping', sizeIdx: 3 }]);
    };

    // 計算填縫劑結果
    const L = parseFloat(groutTileL) * 10 || 600;
    const W = parseFloat(groutTileW) * 10 || 600;
    const D = parseFloat(groutWidth) || 3;
    const C = parseFloat(groutDepth) || 5;
    const groutPerSqm = ((L + W) / (L * W)) * D * C * 1.7;

    const groutRowResults = groutRows.map(row => {
        const area = parseFloat(row.area) || 0;
        const amount = area * groutPerSqm;
        return { ...row, amount };
    });

    const totalGrout = groutRowResults.reduce((sum, row) => sum + row.amount, 0);
    const currentGroutWastage = groutCustomWastage ? groutWastage : DEFAULT_WASTAGE.grout;
    const totalGroutWithWastage = applyWastage(totalGrout, currentGroutWastage);

    // 填縫劑列操作
    const addGroutRow = () => {
        const newId = Math.max(...groutRows.map(r => r.id), 0) + 1;
        setGroutRows([...groutRows, { id: newId, name: '', area: '' }]);
    };
    const removeGroutRow = (id) => {
        if (groutRows.length <= 1) return;
        setGroutRows(groutRows.filter(row => row.id !== id));
    };
    const updateGroutRow = (id, field, value) => {
        setGroutRows(groutRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    const clearGroutRows = () => {
        setGroutRows([{ id: 1, name: '', area: '' }]);
    };

    // 計算黏著劑結果
    const adhesiveRowResults = adhesiveRows.map(row => {
        const perSqm = parseFloat(row.trowel) === 4 ? 2.5 : parseFloat(row.trowel) === 6 ? 6.25 : 4;
        const area = parseFloat(row.area) || 0;
        const amount = area * perSqm;
        return { ...row, amount };
    });

    const totalAdhesive = adhesiveRowResults.reduce((sum, row) => sum + row.amount, 0);
    const currentAdhesiveWastage = adhesiveCustomWastage ? adhesiveWastage : DEFAULT_WASTAGE.adhesive;
    const totalAdhesiveWithWastage = applyWastage(totalAdhesive, currentAdhesiveWastage);

    // 黏著劑列操作
    const addAdhesiveRow = () => {
        const newId = Math.max(...adhesiveRows.map(r => r.id), 0) + 1;
        setAdhesiveRows([...adhesiveRows, { id: newId, name: '', area: '', trowel: '4' }]);
    };
    const removeAdhesiveRow = (id) => {
        if (adhesiveRows.length <= 1) return;
        setAdhesiveRows(adhesiveRows.filter(row => row.id !== id));
    };
    const updateAdhesiveRow = (id, field, value) => {
        setAdhesiveRows(adhesiveRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };
    const clearAdhesiveRows = () => {
        setAdhesiveRows([{ id: 1, name: '', area: '', trowel: '4' }]);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: 'tiles', label: '磁磚片數' },
                    { id: 'grout', label: '填縫劑' },
                    { id: 'adhesive', label: '黏著劑' },
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

            {/* 磁磚片數 - 多列模式 */}
            {calcType === 'tiles' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            公式: 每坪片數 = 32400 ÷ (長cm × 寬cm)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{tileRows.length} 列</span>
                            <button
                                onClick={() => tileRows.length > 1 && removeTileRow(tileRows[tileRows.length - 1].id)}
                                disabled={tileRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button onClick={addTileRow} className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                                <Plus size={16} />
                            </button>
                            {tileRows.length > 1 && <button onClick={clearTileRows} className="text-xs text-gray-500 hover:text-gray-700 ml-1">清空</button>}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {tileRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-6 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input type="text" value={row.name} onChange={(e) => updateTileRow(row.id, 'name', e.target.value)}
                                            placeholder={`區域 ${index + 1}`} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                    </div>
                                    <div className="col-span-6 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">面積</label>
                                        <div className="relative">
                                            <input type="number" value={row.area} onChange={(e) => updateTileRow(row.id, 'area', e.target.value)}
                                                placeholder="0" min="0" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8" />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row.unit === 'ping' ? '坪' : 'm²'}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-4 sm:col-span-1">
                                        <label className="block text-xs text-gray-500 mb-1">單位</label>
                                        <select value={row.unit} onChange={(e) => updateTileRow(row.id, 'unit', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500">
                                            <option value="ping">坪</option>
                                            <option value="sqm">m²</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">磁磚尺寸</label>
                                        <select value={row.sizeIdx} onChange={(e) => updateTileRow(row.id, 'sizeIdx', parseInt(e.target.value))}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500">
                                            {TILE_SIZES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">施工方法</label>
                                        <select value={row.method} onChange={(e) => updateTileRow(row.id, 'method', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500">
                                            {TILE_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-10 sm:col-span-2 flex items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">片數</label>
                                            <div className="text-sm font-bold text-orange-600">
                                                {tileRowResults[index].count > 0 ? `${formatNumber(tileRowResults[index].count, 0)} 片` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button onClick={() => removeTileRow(row.id)} disabled={tileRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addTileRow} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Plus size={16} />+增加新欄位
                    </button>

                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        60×60cm 磁磚每坪約 <strong>{formatNumber(tileCountPerPing, 1)}</strong> 片
                    </div>

                    <WastageControl wastage={tileWastage} setWastage={setTileWastage} defaultValue={DEFAULT_WASTAGE.tile} useCustom={tileCustomWastage} setUseCustom={setTileCustomWastage} />

                    <ResultDisplay
                        label={`磁磚片數 (共 ${tileRowResults.filter(r => r.count > 0).length} 項)`}
                        value={totalTiles}
                        unit="片"
                        wastageValue={totalTilesWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, tileCost)}
                        subType="磁磚"
                    />

                    <CostInput
                        label="磁磚"
                        quantity={totalTilesWithWastage}
                        unit="片"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('磁磚'))}
                        onChange={setTileCost}
                        placeholder={{ spec: '例：60x60cm 拋光石英磚' }}
                    />

                    {/* 磁磚鋪貼工資 */}
                    <div className="bg-orange-50 rounded-lg p-3 space-y-3 border border-orange-100 mt-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                            <span className="bg-orange-200 text-orange-700 p-1 rounded">
                                <Layers size={14} />
                            </span>
                            磁磚鋪貼工資
                        </div>

                        <ResultDisplay
                            label="鋪貼工資合計"
                            value={tileLaborCost?.subtotal || 0}
                            unit="元"
                            showWastage={false}
                            onAddRecord={(subType, label, value, unit) =>
                                onAddRecord(subType, label, value, unit, value, tileLaborCost)}
                            subType="鋪貼工資"
                        />

                        <CostInput
                            label="施工"
                            quantity={totalAreaPing}
                            unit="坪"
                            vendors={vendors.filter(v => v.category === '工程工班' && (v.tradeType?.includes('泥作') || v.tradeType?.includes('磁磚')))}
                            onChange={setTileLaborCost}
                            placeholder={{ spec: '例：60x60cm 貼工' }}
                        />
                    </div>

                    {tileRowResults.filter(r => r.count > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {tileRowResults.filter(r => r.count > 0).map((row, idx) => (
                                    <div key={row.id} className="flex justify-between text-gray-600">
                                        <span>{row.name || `區域 ${idx + 1}`} ({row.area}{row.unit === 'ping' ? '坪' : 'm²'})</span>
                                        <span className="font-medium">{formatNumber(row.count, 0)} 片</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 填縫劑 - 多列模式 */}
            {calcType === 'grout' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            公式: U = (L+W)/(L×W) × 縫寬 × 縫深 × 1.7
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{groutRows.length} 列</span>
                            <button onClick={() => groutRows.length > 1 && removeGroutRow(groutRows[groutRows.length - 1].id)} disabled={groutRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button onClick={addGroutRow} className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                                <Plus size={16} />
                            </button>
                            {groutRows.length > 1 && <button onClick={clearGroutRows} className="text-xs text-gray-500 hover:text-gray-700 ml-1">清空</button>}
                        </div>
                    </div>

                    {/* 共用設定 */}
                    <div className="grid grid-cols-4 gap-2 bg-blue-50 p-3 rounded-lg">
                        <InputField label="磚長" value={groutTileL} onChange={setGroutTileL} unit="cm" />
                        <InputField label="磚寬" value={groutTileW} onChange={setGroutTileW} unit="cm" />
                        <InputField label="縫寬" value={groutWidth} onChange={setGroutWidth} unit="mm" />
                        <InputField label="縫深" value={groutDepth} onChange={setGroutDepth} unit="mm" />
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        此規格每平方公尺約 <strong>{formatNumber(groutPerSqm, 2)}</strong> kg
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {groutRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 sm:col-span-4">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input type="text" value={row.name} onChange={(e) => updateGroutRow(row.id, 'name', e.target.value)}
                                            placeholder={`區域 ${index + 1}`} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                    </div>
                                    <div className="col-span-5 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">施作面積</label>
                                        <div className="relative">
                                            <input type="number" value={row.area} onChange={(e) => updateGroutRow(row.id, 'area', e.target.value)}
                                                placeholder="0" min="0" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8" />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5 sm:col-span-4 flex items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">填縫劑用量</label>
                                            <div className="text-sm font-bold text-orange-600">
                                                {groutRowResults[index].amount > 0 ? `${formatNumber(groutRowResults[index].amount, 2)} kg` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button onClick={() => removeGroutRow(row.id)} disabled={groutRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addGroutRow} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Plus size={16} />+增加新欄位
                    </button>

                    <WastageControl wastage={groutWastage} setWastage={setGroutWastage} defaultValue={DEFAULT_WASTAGE.grout} useCustom={groutCustomWastage} setUseCustom={setGroutCustomWastage} />

                    <ResultDisplay
                        label={`填縫劑用量 (共 ${groutRowResults.filter(r => r.amount > 0).length} 項)`}
                        value={totalGrout}
                        unit="kg"
                        wastageValue={totalGroutWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, groutCost)}
                        subType="填縫劑"
                    />

                    <CostInput
                        label="填縫劑"
                        quantity={totalGroutWithWastage}
                        unit="kg"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('磁磚'))}
                        onChange={setGroutCost}
                        placeholder={{ spec: '例：本色填縫劑' }}
                    />
                    {groutRowResults.filter(r => r.amount > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {groutRowResults.filter(r => r.amount > 0).map((row, idx) => (
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

            {/* 黏著劑 - 多列模式 */}
            {calcType === 'adhesive' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info size={16} />
                            4mm鏝刀 ≈ 2.5kg/m², 6mm鏝刀 ≈ 6.25kg/m²
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{adhesiveRows.length} 列</span>
                            <button onClick={() => adhesiveRows.length > 1 && removeAdhesiveRow(adhesiveRows[adhesiveRows.length - 1].id)} disabled={adhesiveRows.length <= 1}
                                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <span className="text-lg font-bold leading-none">−</span>
                            </button>
                            <button onClick={addAdhesiveRow} className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                                <Plus size={16} />
                            </button>
                            {adhesiveRows.length > 1 && <button onClick={clearAdhesiveRows} className="text-xs text-gray-500 hover:text-gray-700 ml-1">清空</button>}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {adhesiveRows.map((row, index) => (
                            <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-12 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                        <input type="text" value={row.name} onChange={(e) => updateAdhesiveRow(row.id, 'name', e.target.value)}
                                            placeholder={`區域 ${index + 1}`} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                    </div>
                                    <div className="col-span-5 sm:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">施作面積</label>
                                        <div className="relative">
                                            <input type="number" value={row.area} onChange={(e) => updateAdhesiveRow(row.id, 'area', e.target.value)}
                                                placeholder="0" min="0" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8" />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5 sm:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">鏝刀規格</label>
                                        <select value={row.trowel} onChange={(e) => updateAdhesiveRow(row.id, 'trowel', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500">
                                            <option value="4">4mm</option>
                                            <option value="6">6mm</option>
                                        </select>
                                    </div>
                                    <div className="col-span-10 sm:col-span-3 flex items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">黏著劑用量</label>
                                            <div className="text-sm font-bold text-orange-600">
                                                {adhesiveRowResults[index].amount > 0 ? `${formatNumber(adhesiveRowResults[index].amount, 2)} kg` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button onClick={() => removeAdhesiveRow(row.id)} disabled={adhesiveRows.length <= 1}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addAdhesiveRow} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Plus size={16} />+增加新欄位
                    </button>

                    <WastageControl wastage={adhesiveWastage} setWastage={setAdhesiveWastage} defaultValue={DEFAULT_WASTAGE.adhesive} useCustom={adhesiveCustomWastage} setUseCustom={setAdhesiveCustomWastage} />

                    <ResultDisplay
                        label={`黏著劑用量 (共 ${adhesiveRowResults.filter(r => r.amount > 0).length} 項)`}
                        value={totalAdhesive}
                        unit="kg"
                        wastageValue={totalAdhesiveWithWastage}
                        onAddRecord={(subType, label, value, unit, wastageValue) =>
                            onAddRecord(subType, label, value, unit, wastageValue, adhesiveCost)}
                        subType="黏著劑"
                    />

                    <CostInput
                        label="黏著劑"
                        quantity={totalAdhesiveWithWastage}
                        unit="kg"
                        vendors={vendors.filter(v => v.category === '建材供應' || v.tradeType?.includes('磁磚'))}
                        onChange={setAdhesiveCost}
                        placeholder={{ spec: '例：高分子益膠泥' }}
                    />

                    {adhesiveRowResults.filter(r => r.amount > 0).length > 1 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-gray-700 mb-2">各項明細:</div>
                            <div className="space-y-1">
                                {adhesiveRowResults.filter(r => r.amount > 0).map((row, idx) => (
                                    <div key={row.id} className="flex justify-between text-gray-600">
                                        <span>{row.name || `區域 ${idx + 1}`} ({row.area}m² × {row.trowel}mm鏝刀)</span>
                                        <span className="font-medium">{formatNumber(row.amount, 2)} kg</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// 4️⃣ 裝修工程計算器 (支援多列輸入)
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


// 5️⃣ 建築概估計算器
const BuildingEstimator = ({ onAddRecord }) => {
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

