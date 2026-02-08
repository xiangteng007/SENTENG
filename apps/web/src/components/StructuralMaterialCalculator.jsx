/**
 * 結構材料統合計算器
 * 整合構件計算、材料匯總與報價功能
 *
 * 模組化結構：
 *  - ./structural-calc/constants.js — 常數與工程數據
 *  - ./structural-calc/utils.js — 工具函數與計算引擎
 *  - ./structural-calc/ComponentList.jsx — 構件清單
 *  - ./structural-calc/MaterialSummary.jsx — 材料匯總報價
 *  - ./structural-calc/ComponentModal.jsx — 新增/編輯對話框
 */

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import {
    CONCRETE_GRADES,
    COMPONENT_TYPES,
} from './structural-calc/constants';
import { formatNumber, generateId, calculateComponent } from './structural-calc/utils';
import ComponentList from './structural-calc/ComponentList';
import MaterialSummary from './structural-calc/MaterialSummary';
import ComponentModal from './structural-calc/ComponentModal';

// ============================================
// 主元件
// ============================================
const StructuralMaterialCalculator = () => {
    // 材料規格選擇
    const [concreteGrade, _setConcreteGrade] = useState('c280');
    const [rebarGrade, _setRebarGrade] = useState('SD420W');

    // 構件清單
    const [components, setComponents] = useState([]);

    // 新增構件對話框
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // 新構件表單
    const [newComponent, setNewComponent] = useState({
        type: 'column',
        name: '',
        presetId: '',
        concreteGrade: 'c280',
        rebarGrade: 'SD420W',
        width: '',
        depth: '',
        height: '',
        length: '',
        count: '1',
        thickness: '15',
        perimeter: '',
        rebarRate: 120,
        rebarLayer: '15_single',
    });

    // 單價設定
    const [prices, setPrices] = useState({
        formwork: 850,
        rebar: 27,
        concrete: CONCRETE_GRADES.find(g => g.id === 'c280')?.price || 2900,
    });

    // 損耗率 & 複製狀態
    const [wastage, setWastage] = useState(10);
    const [copied, setCopied] = useState(false);

    // 計算匯總
    const totals = useMemo(() =>
        components.reduce((acc, comp) => ({
            formwork: acc.formwork + comp.formwork,
            concrete: acc.concrete + comp.concrete,
            rebar: acc.rebar + comp.rebar,
        }), { formwork: 0, concrete: 0, rebar: 0 }),
    [components]);

    // 含損耗的數量
    const totalsWithWastage = useMemo(() => ({
        formwork: totals.formwork * (1 + wastage / 100),
        concrete: totals.concrete * (1 + wastage / 100),
        rebar: totals.rebar * (1 + wastage / 100),
    }), [totals, wastage]);

    // 總價計算
    const totalCost = useMemo(() => ({
        formwork: totalsWithWastage.formwork * prices.formwork,
        concrete: totalsWithWastage.concrete * prices.concrete,
        rebar: totalsWithWastage.rebar * prices.rebar,
        get total() { return this.formwork + this.concrete + this.rebar; }
    }), [totalsWithWastage, prices]);

    // ===== Handlers =====
    const resetForm = () => {
        setNewComponent({
            type: 'column', name: '', width: '', depth: '', height: '',
            length: '', count: '1', thickness: '15', perimeter: '',
            rebarRate: 120, rebarLayer: '15_single',
        });
    };

    const handleAddComponent = () => {
        const calc = calculateComponent(newComponent.type, {
            width: parseFloat(newComponent.width) || 0,
            depth: parseFloat(newComponent.depth) || 0,
            height: parseFloat(newComponent.height) || 0,
            length: parseFloat(newComponent.length) || 0,
            count: parseFloat(newComponent.count) || 1,
            thickness: parseFloat(newComponent.thickness) || 15,
            perimeter: parseFloat(newComponent.perimeter) || 0,
            rebarRate: parseFloat(newComponent.rebarRate) || 100,
        });

        const typeInfo = COMPONENT_TYPES.find(t => t.id === newComponent.type);
        const component = {
            id: editingId || generateId(),
            type: newComponent.type,
            typeName: typeInfo?.label || '',
            icon: typeInfo?.icon || '',
            name: newComponent.name || `${typeInfo?.label} ${components.length + 1}`,
            params: { ...newComponent },
            ...calc,
        };

        if (editingId) {
            setComponents(prev => prev.map(c => c.id === editingId ? component : c));
            setEditingId(null);
        } else {
            setComponents(prev => [...prev, component]);
        }

        resetForm();
        setShowAddModal(false);
    };

    const handleEditComponent = (comp) => {
        setNewComponent({ type: comp.type, name: comp.name, ...comp.params });
        setEditingId(comp.id);
        setShowAddModal(true);
    };

    const handleDeleteComponent = (id) => {
        setComponents(prev => prev.filter(c => c.id !== id));
    };

    const copyToClipboard = () => {
        const text = components.map(c =>
            `${c.name}: 模板${formatNumber(c.formwork)}m², 鋼筋${formatNumber(c.rebar)}kg, 混凝土${formatNumber(c.concrete, 3)}m³`
        ).join('\n') + `\n\n總計: 模板${formatNumber(totals.formwork)}m², 鋼筋${formatNumber(totals.rebar)}kg, 混凝土${formatNumber(totals.concrete, 3)}m³`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 渲染構件輸入表單 (passed down to modal)
    const renderComponentForm = () => {
        const type = newComponent.type;
        const isVolumetric = ['column', 'beam', 'groundBeam', 'foundation'].includes(type);
        const isArea = ['slab', 'wall', 'parapet'].includes(type);
        const isStairs = type === 'stairs';

        return (
            <div className="space-y-3">
                {isVolumetric && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">寬度 (cm)</label>
                                <input type="number" value={newComponent.width}
                                    onChange={e => setNewComponent(prev => ({ ...prev, width: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="40" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">深度 (cm)</label>
                                <input type="number" value={newComponent.depth}
                                    onChange={e => setNewComponent(prev => ({ ...prev, depth: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="60" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">{type === 'beam' || type === 'groundBeam' ? '長度 (m)' : '高度 (m)'}</label>
                                <input type="number" value={newComponent.height}
                                    onChange={e => setNewComponent(prev => ({ ...prev, height: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="3.5" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input type="number" value={newComponent.count}
                                    onChange={e => setNewComponent(prev => ({ ...prev, count: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="1" />
                            </div>
                        </div>
                    </>
                )}
                {isArea && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">長度 (m)</label>
                                <input type="number" value={newComponent.length}
                                    onChange={e => setNewComponent(prev => ({ ...prev, length: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="6" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">{type === 'wall' || type === 'parapet' ? '高度 (m)' : '寬度 (m)'}</label>
                                <input type="number" value={newComponent.width}
                                    onChange={e => setNewComponent(prev => ({ ...prev, width: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="4" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">厚度 (cm)</label>
                                <input type="number" value={newComponent.thickness}
                                    onChange={e => setNewComponent(prev => ({ ...prev, thickness: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="15" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input type="number" value={newComponent.count}
                                    onChange={e => setNewComponent(prev => ({ ...prev, count: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="1" />
                            </div>
                        </div>
                    </>
                )}
                {isStairs && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">寬度 (m)</label>
                                <input type="number" value={newComponent.width}
                                    onChange={e => setNewComponent(prev => ({ ...prev, width: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="1.2" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">高度 (m)</label>
                                <input type="number" value={newComponent.height}
                                    onChange={e => setNewComponent(prev => ({ ...prev, height: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="3" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">厚度 (cm)</label>
                                <input type="number" value={newComponent.thickness}
                                    onChange={e => setNewComponent(prev => ({ ...prev, thickness: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="15" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">數量</label>
                                <input type="number" value={newComponent.count}
                                    onChange={e => setNewComponent(prev => ({ ...prev, count: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="1" />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* 標題 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calculator className="text-orange-500" size={24} />
                        結構材料統合計算器
                    </h2>
                    <p className="text-sm text-gray-500">逐項添加構件，自動匯整材料清單與報價</p>
                </div>
            </div>

            {/* 構件清單 */}
            <ComponentList
                components={components}
                onAdd={() => { resetForm(); setEditingId(null); setShowAddModal(true); }}
                onEdit={handleEditComponent}
                onDelete={handleDeleteComponent}
            />

            {/* 材料匯總 */}
            {components.length > 0 && (
                <MaterialSummary
                    concreteGrade={concreteGrade}
                    rebarGrade={rebarGrade}
                    wastage={wastage}
                    setWastage={setWastage}
                    totalsWithWastage={totalsWithWastage}
                    prices={prices}
                    setPrices={setPrices}
                    totalCost={totalCost}
                    copied={copied}
                    onCopy={copyToClipboard}
                />
            )}

            {/* 新增/編輯構件對話框 */}
            {showAddModal && (
                <ComponentModal
                    editingId={editingId}
                    newComponent={newComponent}
                    setNewComponent={setNewComponent}
                    components={components}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddComponent}
                    renderComponentForm={renderComponentForm}
                />
            )}
        </div>
    );
};

export default StructuralMaterialCalculator;
