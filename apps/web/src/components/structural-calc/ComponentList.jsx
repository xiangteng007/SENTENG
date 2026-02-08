/**
 * ComponentList — Displays the list of added structural components
 */
import React from 'react';
import { Calculator, Plus, Edit3, Trash2, FileSpreadsheet } from 'lucide-react';
import { formatNumber } from './utils';

const ComponentList = ({
    components,
    onAdd,
    onEdit,
    onDelete,
}) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-gray-500" />
                構件清單 ({components.length} 項)
            </h3>
            <button
                onClick={onAdd}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-1"
            >
                <Plus size={16} /> 新增構件
            </button>
        </div>

        {components.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
                <Calculator size={48} className="mx-auto mb-3 opacity-30" />
                <p>尚無構件，點擊「新增構件」開始計算</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-100">
                {components.map((comp) => (
                    <div key={comp.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{comp.icon}</span>
                                <div>
                                    <div className="font-medium text-gray-800">{comp.name}</div>
                                    <div className="text-xs text-gray-500">
                                        模板 {formatNumber(comp.formwork)} m² · 鋼筋 {formatNumber(comp.rebar)} kg · 混凝土 {formatNumber(comp.concrete, 3)} m³
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onEdit(comp)}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => onDelete(comp.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default ComponentList;
