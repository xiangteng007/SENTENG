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
export // 0️⃣ 構件計算器 - 結構部位詳細計算 (模板+鋼筋)
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
    // 牆體狀態 (含開口扣除)
    const [wallRows, setWallRows] = useState([{ id: 1, name: '', length: '', height: '', thickness: '20', rebarType: 2, openings: '' }]);
    // 樓梯狀態
    const [stairRows, setStairRows] = useState([{ id: 1, name: '', width: '', length: '', riseHeight: '', steps: '10', stairType: 0 }]);
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
        const openingsArea = parseFloat(row.openings) || 0; // 開口扣除面積
        const rebarRate = COMPONENT_REBAR_RATES.wall[row.rebarType]?.value || 34;

        const grossArea = l * h;
        const netArea = Math.max(0, grossArea - openingsArea); // 淨面積 = 總面積 - 開口
        const formwork = 2 * netArea; // 雙面
        const concrete = netArea * t;
        const rebar = netArea * rebarRate;
        return { formwork, concrete, rebar, openingsDeducted: openingsArea };
    };

    const calculateStair = (row) => {
        const w = parseFloat(row.width) || 0;  // 梯寬 m
        const l = parseFloat(row.length) || 0; // 水平長度 m
        const rh = parseFloat(row.riseHeight) || 0; // 垂直高度 m
        const steps = parseFloat(row.steps) || 10;
        const stairConfig = COMPONENT_REBAR_RATES.stair[row.stairType] || COMPONENT_REBAR_RATES.stair[0];
        const t = (stairConfig.thickness || 15) / 100; // 斜板厚度
        const rebarRate = stairConfig.value || 40;

        // 斜長計算 (梯段斜向長度)
        const diagonalLength = Math.sqrt(l * l + rh * rh);
        // 斜面面積 = 斜長 × 寬
        const slopeArea = diagonalLength * w;
        // 踏步面積 = 踏步數 × 踏深 × 梯寬 (約增加30%)
        const stepArea = steps * (l / steps) * w * 0.3;
        
        const formwork = slopeArea + stepArea; // 斜板模 + 踏步模
        const concrete = slopeArea * t + (steps * 0.5 * (rh / steps) * (l / steps) * w); // 斜板 + 踏步
        const rebar = slopeArea * rebarRate;
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
            case 'stair': rows = stairRows; calcFn = calculateStair; break;
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
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">開口扣除 (m²)</label>
                                <input type="number" value={row.openings} onChange={e => updateRow(wallRows, setWallRows, row.id, 'openings', e.target.value)} placeholder="0" className={commonInputClass} title="門窗開口總面積" />
                            </div>
                            <div className="col-span-3 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(wallRows, setWallRows, row.id)} disabled={wallRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ));
            case 'stair':
                return stairRows.map((row, idx) => (
                    <div key={row.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">名稱</label>
                                <input type="text" value={row.name} onChange={e => updateRow(stairRows, setStairRows, row.id, 'name', e.target.value)} placeholder={`樓梯 ${idx + 1}`} className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">梯寬 (m)</label>
                                <input type="number" value={row.width} onChange={e => updateRow(stairRows, setStairRows, row.id, 'width', e.target.value)} placeholder="1.2" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">水平長 (m)</label>
                                <input type="number" value={row.length} onChange={e => updateRow(stairRows, setStairRows, row.id, 'length', e.target.value)} placeholder="3" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">垂直高 (m)</label>
                                <input type="number" value={row.riseHeight} onChange={e => updateRow(stairRows, setStairRows, row.id, 'riseHeight', e.target.value)} placeholder="3" className={commonInputClass} />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">踏步數</label>
                                <input type="number" value={row.steps} onChange={e => updateRow(stairRows, setStairRows, row.id, 'steps', e.target.value)} placeholder="18" className={commonInputClass} />
                            </div>
                            <div className="col-span-6 sm:col-span-1">
                                <label className="block text-xs text-gray-500 mb-1">類型</label>
                                <select value={row.stairType} onChange={e => updateRow(stairRows, setStairRows, row.id, 'stairType', parseInt(e.target.value))} className={commonInputClass + " bg-white"}>
                                    {COMPONENT_REBAR_RATES.stair.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex justify-end">
                                <button onClick={() => removeRow(stairRows, setStairRows, row.id)} disabled={stairRows.length <= 1} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
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
            wall: { name: '', length: '', height: '', thickness: '20', rebarType: 2, openings: '' },
            stair: { name: '', width: '', length: '', riseHeight: '', steps: '10', stairType: 0 },
            parapet: { name: '', perimeter: '', height: '0.9', thickness: '15', rebarType: 1 },
            groundBeam: { name: '', width: '', depth: '', length: '', count: '1', rebarType: 0 },
            foundation: { name: '', length: '', width: '', depth: '', count: '1', foundationType: 0 },
        };
        const setters = { column: [columnRows, setColumnRows], beam: [beamRows, setBeamRows], slab: [slabRows, setSlabRows], wall: [wallRows, setWallRows], stair: [stairRows, setStairRows], parapet: [parapetRows, setParapetRows], groundBeam: [groundBeamRows, setGroundBeamRows], foundation: [foundationRows, setFoundationRows] };
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
                {componentType === 'stair' && '公式: 模板 = 斜長×梯寬+踏步, 混凝土 = 斜板+踏步體積, 鋼筋 = 面積×配筋率'}
                {componentType === 'parapet' && '公式: 模板 = 2×周長×高度, 鋼筋 = 面積×配筋率'}
                {componentType === 'groundBeam' && '公式: 模板 = (底寬+2×深)×長度, 鋼筋 = 體積×配筋率'}
                {componentType === 'foundation' && '公式: 模板 = 周長×深度, 鋼筋 = 體積×配筋率'}
            </div>

            {/* 輸入表單 */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {renderInputForm()}
            </div>

            {/* 選項工程說明 - 顯示當前構件類型的配置說明 */}
            {(() => {
                // 取得當前構件對應的第一筆資料中的選項
                const currentRows = {
                    column: columnRows, beam: beamRows, slab: slabRows,
                    wall: wallRows, parapet: parapetRows, groundBeam: groundBeamRows, foundation: foundationRows
                };
                const rows = currentRows[componentType];
                if (rows && rows.length > 0) {
                    // 取得第一筆資料的選中配筋/類型
                    const firstRow = rows[0];
                    const rateKey = componentType === 'foundation' ? 'foundationType' : 'rebarType';
                    const selectedIdx = firstRow[rateKey] || 0;
                    const selectedOption = COMPONENT_REBAR_RATES[componentType]?.[selectedIdx];
                    if (selectedOption) {
                        return <OptionDetailCard selectedOption={selectedOption} configRate={selectedOption.value} />;
                    }
                }
                return null;
            })()}

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
