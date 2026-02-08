import React, { useState } from 'react';
import {
    Calculator, Info, ChevronDown, ChevronUp, Copy, Check, Plus, RefreshCw
} from 'lucide-react';
import { UNIT_CONVERSIONS, DEFAULT_WASTAGE, formatNumber, applyWastage } from '../constants';


// ============================================
// 子組件
// ============================================

// 輸入欄位組件
export const InputField = ({ label, value, onChange, unit, placeholder, type = 'number', min = 0, step = 'any' }) => (
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
export const SelectField = ({ label, value, onChange, options }) => (
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

// 選項詳細說明卡片組件
export const OptionDetailCard = ({ selectedOption, configRate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // 合併兩種格式的資料來源
    const option = selectedOption || {};
    const hasDetails = option.specs || option.method || option.application || option.regulations;
    
    if (!hasDetails) return null;
    
    return (
        <div className="mt-2 bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                        {option.label} - 工程說明
                    </span>
                    {configRate && (
                        <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                            {configRate} kg/m{option.thickness ? '²' : '³'}
                        </span>
                    )}
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
            </button>
            
            {isExpanded && (
                <div className="px-3 pb-3 space-y-2 text-sm">
                    {option.specs && (
                        <div className="flex items-start gap-2">
                            <span className="text-blue-700 font-medium whitespace-nowrap">📐 規格：</span>
                            <span className="text-gray-700">{option.specs}</span>
                        </div>
                    )}
                    
                    {option.method && (
                        <div className="flex items-start gap-2">
                            <span className="text-blue-700 font-medium whitespace-nowrap">🔧 工法：</span>
                            <span className="text-gray-700">{option.method}</span>
                        </div>
                    )}
                    
                    {option.application && (
                        <div className="flex items-start gap-2">
                            <span className="text-blue-700 font-medium whitespace-nowrap">🏗️ 適用：</span>
                            <span className="text-gray-700">{option.application}</span>
                        </div>
                    )}
                    
                    {option.regulations && (
                        <div className="flex items-start gap-2 pt-2 border-t border-blue-200 mt-2">
                            <span className="text-blue-600 font-medium whitespace-nowrap">📜 法規：</span>
                            <span className="text-gray-600 text-xs">{option.regulations}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 損耗率控制組件
export const WastageControl = ({ wastage, setWastage, defaultValue, useCustom, setUseCustom }) => (
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

// 🧮 單位轉換工具組件
export const UnitConverter = () => {
    const [converterOpen, setConverterOpen] = useState(false);
    const [areaValue, setAreaValue] = useState('');
    const [areaUnit, setAreaUnit] = useState('sqm');
    const [lengthValue, setLengthValue] = useState('');
    const [lengthUnit, setLengthUnit] = useState('m');
    const [rebarDiameter, setRebarDiameter] = useState('');
    const [rebarLength, setRebarLength] = useState('');

    // 面積轉換
    const convertArea = (value, fromUnit) => {
        const v = parseFloat(value) || 0;
        const sqm = fromUnit === 'sqm' ? v : fromUnit === 'ping' ? v * UNIT_CONVERSIONS.pingToSqm : v * UNIT_CONVERSIONS.caiToSqm;
        return {
            sqm: sqm.toFixed(3),
            ping: (sqm * UNIT_CONVERSIONS.sqmToPing).toFixed(3),
            cai: (sqm * UNIT_CONVERSIONS.sqmToCai).toFixed(2),
        };
    };

    // 長度轉換
    const convertLength = (value, fromUnit) => {
        const v = parseFloat(value) || 0;
        const m = fromUnit === 'm' ? v : v * UNIT_CONVERSIONS.taiwanFootToM;
        return {
            m: m.toFixed(3),
            cm: (m * 100).toFixed(1),
            taiwanFoot: (m * UNIT_CONVERSIONS.mToTaiwanFoot).toFixed(2),
        };
    };

    // 鋼筋重量計算
    const calculateRebarWeight = () => {
        const d = parseFloat(rebarDiameter) || 0; // mm
        const l = parseFloat(rebarLength) || 0;   // m
        const weight = 0.00617 * (d / 10) * (d / 10) * l; // kg
        return weight.toFixed(2);
    };

    const areaResults = convertArea(areaValue, areaUnit);
    const lengthResults = convertLength(lengthValue, lengthUnit);
    const rebarWeight = calculateRebarWeight();

    if (!converterOpen) {
        return (
            <button
                onClick={() => setConverterOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
                <Calculator size={16} />
                <span className="text-sm font-medium">單位換算工具</span>
            </button>
        );
    }

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-700">
                    <Calculator size={18} />
                    <span className="font-medium">單位換算工具</span>
                </div>
                <button onClick={() => setConverterOpen(false)} className="text-purple-400 hover:text-purple-600">
                    <ChevronUp size={18} />
                </button>
            </div>

            {/* 面積轉換 */}
            <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-purple-600">📐 面積單位</div>
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        value={areaValue}
                        onChange={e => setAreaValue(e.target.value)}
                        placeholder="輸入數值"
                        className="flex-1 px-2 py-1.5 border rounded text-sm"
                    />
                    <select value={areaUnit} onChange={e => setAreaUnit(e.target.value)} className="px-2 py-1.5 border rounded text-sm bg-white">
                        <option value="sqm">m²</option>
                        <option value="ping">坪</option>
                        <option value="cai">才</option>
                    </select>
                </div>
                {areaValue && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-purple-50 p-2 rounded text-center">
                            <div className="font-bold text-purple-700">{areaResults.sqm}</div>
                            <div className="text-purple-500">m²</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded text-center">
                            <div className="font-bold text-purple-700">{areaResults.ping}</div>
                            <div className="text-purple-500">坪</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded text-center">
                            <div className="font-bold text-purple-700">{areaResults.cai}</div>
                            <div className="text-purple-500">才</div>
                        </div>
                    </div>
                )}
            </div>

            {/* 長度轉換 */}
            <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-purple-600">📏 長度單位</div>
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        value={lengthValue}
                        onChange={e => setLengthValue(e.target.value)}
                        placeholder="輸入數值"
                        className="flex-1 px-2 py-1.5 border rounded text-sm"
                    />
                    <select value={lengthUnit} onChange={e => setLengthUnit(e.target.value)} className="px-2 py-1.5 border rounded text-sm bg-white">
                        <option value="m">公尺</option>
                        <option value="taiwanFoot">台尺</option>
                    </select>
                </div>
                {lengthValue && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-purple-50 p-2 rounded text-center">
                            <div className="font-bold text-purple-700">{lengthResults.m}</div>
                            <div className="text-purple-500">公尺</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded text-center">
                            <div className="font-bold text-purple-700">{lengthResults.cm}</div>
                            <div className="text-purple-500">公分</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded text-center">
                            <div className="font-bold text-purple-700">{lengthResults.taiwanFoot}</div>
                            <div className="text-purple-500">台尺</div>
                        </div>
                    </div>
                )}
            </div>

            {/* 鋼筋重量計算 */}
            <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-purple-600">🧱 鋼筋重量 (每米重 = 0.00617 × d²)</div>
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        value={rebarDiameter}
                        onChange={e => setRebarDiameter(e.target.value)}
                        placeholder="直徑 (mm)"
                        className="flex-1 px-2 py-1.5 border rounded text-sm"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <input
                        type="number"
                        value={rebarLength}
                        onChange={e => setRebarLength(e.target.value)}
                        placeholder="長度 (m)"
                        className="flex-1 px-2 py-1.5 border rounded text-sm"
                    />
                </div>
                {rebarDiameter && rebarLength && (
                    <div className="bg-purple-100 p-2 rounded text-center">
                        <span className="font-bold text-purple-800">{rebarWeight} kg</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// 結果顯示組件
export const ResultDisplay = ({ label, value, unit, wastageValue, showWastage = true, onAddRecord, subType = '' }) => {
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
export const CostInput = ({ label, quantity, unit, unitLabel, vendors = [], onChange, placeholder = {} }) => {
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