/**
 * ComponentModal — Add/Edit structural component modal dialog
 */
import React from 'react';
import { Calculator, X, Save } from 'lucide-react';
import { COMPONENT_TYPES, CONCRETE_GRADES, REBAR_GRADES, REBAR_RATES, COMPONENT_PRESETS } from './constants';

const ComponentModal = ({
    editingId,
    newComponent,
    setNewComponent,
    components,
    onClose,
    onSave,
    renderComponentForm,
}) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Calculator size={20} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                            {editingId ? '編輯構件' : '新增構件'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X size={20} className="text-white" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* 構件類型選擇 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">構件類型</label>
                    <div className="grid grid-cols-4 gap-2">
                        {COMPONENT_TYPES.map(t => {
                            const defaultRebarLayers = {
                                column: 'apartment', beam: 'main', slab: '15_single',
                                wall: '20_double', parapet: 'standard', groundBeam: 'normal',
                                foundation: 'isolated', stairs: 'plate',
                            };
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        const defaultLayer = defaultRebarLayers[t.id];
                                        const defaultRate = defaultLayer && REBAR_RATES[t.id]?.[defaultLayer]?.value || 120;
                                        setNewComponent(prev => ({
                                            ...prev,
                                            type: t.id,
                                            presetId: '',
                                            rebarLayer: defaultLayer || prev.rebarLayer,
                                            rebarRate: defaultRate
                                        }));
                                    }}
                                    className={`p-2 rounded-lg text-center transition-all ${newComponent.type === t.id ? 'bg-orange-100 border-2 border-orange-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                                >
                                    <span className="text-xl block">{t.icon}</span>
                                    <span className="text-xs">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 混凝土強度 + 鋼筋等級 */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">混凝土強度</label>
                        <select
                            value={newComponent.concreteGrade}
                            onChange={e => setNewComponent(prev => ({ ...prev, concreteGrade: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        >
                            {CONCRETE_GRADES.map(g => (
                                <option key={g.id} value={g.id}>{g.strength} kgf/cm²</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">鋼筋等級</label>
                        <select
                            value={newComponent.rebarGrade}
                            onChange={e => setNewComponent(prev => ({ ...prev, rebarGrade: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        >
                            {REBAR_GRADES.map(g => (
                                <option key={g.id} value={g.id}>{g.id}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 常用規格預設 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">常用規格</label>
                    <select
                        value={newComponent.presetId}
                        onChange={e => {
                            const presetId = e.target.value;
                            const presets = COMPONENT_PRESETS[newComponent.type] || [];
                            const preset = presets.find(p => p.id === presetId);
                            if (preset && !preset.custom) {
                                setNewComponent(prev => ({
                                    ...prev, presetId,
                                    width: preset.width || prev.width,
                                    depth: preset.depth || prev.depth,
                                    height: preset.height || prev.height,
                                    length: preset.length || prev.length,
                                    thickness: preset.thickness || prev.thickness,
                                    perimeter: preset.perimeter || prev.perimeter,
                                    rebarRate: preset.rebarRate || prev.rebarRate,
                                    stairType: preset.stairType || prev.stairType,
                                }));
                            } else {
                                setNewComponent(prev => ({ ...prev, presetId }));
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                    >
                        <option value="">-- 選擇規格或自訂 --</option>
                        {(COMPONENT_PRESETS[newComponent.type] || []).map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>

                {/* 名稱 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">名稱 (選填)</label>
                    <input
                        type="text"
                        value={newComponent.name}
                        onChange={e => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={`${COMPONENT_TYPES.find(t => t.id === newComponent.type)?.label} ${components.length + 1}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                </div>

                {/* 尺寸參數 */}
                {(newComponent.presetId === 'custom' || newComponent.presetId === '') && renderComponentForm()}

                {/* 配筋選擇 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">配筋方式</label>
                    <select
                        value={newComponent.rebarLayer}
                        onChange={e => {
                            const layer = e.target.value;
                            const rate = REBAR_RATES[newComponent.type]?.[layer]?.value || 100;
                            setNewComponent(prev => ({ ...prev, rebarLayer: layer, rebarRate: rate }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                    >
                        {Object.entries(REBAR_RATES[newComponent.type] || {}).map(([key, opt]) => {
                            const unit = ['slab', 'wall', 'parapet'].includes(newComponent.type) ? 'kg/m²' : 'kg/m³';
                            return (
                                <option key={key} value={key}>
                                    {opt.label} ({opt.value} {unit}) - {opt.desc}
                                </option>
                            );
                        })}
                    </select>

                    {/* 工法說明 */}
                    {newComponent.rebarLayer &&
                        REBAR_RATES[newComponent.type]?.[newComponent.rebarLayer]?.method && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm space-y-2">
                                <div>
                                    <span className="font-medium text-blue-700">📐 工法說明：</span>
                                    <p className="text-gray-700 mt-1">
                                        {REBAR_RATES[newComponent.type][newComponent.rebarLayer].method}
                                    </p>
                                </div>
                                {REBAR_RATES[newComponent.type][newComponent.rebarLayer].materials && (
                                    <div>
                                        <span className="font-medium text-blue-700">🔩 材料規格：</span>
                                        <p className="text-gray-700 mt-1">
                                            {REBAR_RATES[newComponent.type][newComponent.rebarLayer].materials}
                                        </p>
                                    </div>
                                )}
                                {REBAR_RATES[newComponent.type][newComponent.rebarLayer].regulations && (
                                    <div>
                                        <span className="font-medium text-blue-700">📖 法規規定：</span>
                                        <ul className="mt-1 text-gray-700 list-disc list-inside space-y-0.5">
                                            {REBAR_RATES[newComponent.type][newComponent.rebarLayer].regulations.map((reg, idx) => (
                                                <li key={idx} className="text-xs">{reg}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    取消
                </button>
                <button
                    onClick={onSave}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    {editingId ? '更新' : '加入清單'}
                </button>
            </div>
        </div>
    </div>
);

export default ComponentModal;
