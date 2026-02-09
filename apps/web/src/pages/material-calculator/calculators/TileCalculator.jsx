import { useState } from 'react';
import {
    Plus, Trash2, Info, Layers
} from 'lucide-react';
import {
    TILE_SIZES, TILE_METHODS, DEFAULT_WASTAGE,
    formatNumber, applyWastage
} from '../constants';
import {
    InputField, WastageControl, ResultDisplay, CostInput
} from '../components/shared';
// 3️⃣ 磁磚工程計算器 (支援多列輸入)
export const TileCalculator = ({ onAddRecord, vendors = [] }) => {
    const [calcType, setCalcType] = useState('tiles');

    // 磁磚片數 - 多列支援
    const [tileRows, setTileRows] = useState([
        { id: 1, name: '', area: '', unit: 'ping', sizeIdx: 3, method: 'none' }
    ]);
    const [customTileL, ] = useState('60');
    const [customTileW, ] = useState('60');
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

