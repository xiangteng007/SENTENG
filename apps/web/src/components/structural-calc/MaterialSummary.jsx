/**
 * MaterialSummary — Material totals, wastage control, and pricing table
 */
import React from 'react';
import { DollarSign, Copy, Check } from 'lucide-react';
import { formatNumber } from './utils';
import { CONCRETE_GRADES } from './constants';

const MaterialSummary = ({
    concreteGrade,
    rebarGrade,
    wastage,
    setWastage,
    totalsWithWastage,
    prices,
    setPrices,
    totalCost,
    copied,
    onCopy,
}) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
            <h3 className="font-medium text-orange-800 flex items-center gap-2">
                <DollarSign size={18} />
                材料匯總與報價
            </h3>
            <button
                onClick={onCopy}
                className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1"
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '已複製' : '複製清單'}
            </button>
        </div>

        {/* 損耗率設定 */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">損耗率:</span>
                {[5, 10, 15].map(w => (
                    <button
                        key={w}
                        onClick={() => setWastage(w)}
                        className={`px-3 py-1 rounded-lg text-sm ${wastage === w ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                    >
                        {w}%
                    </button>
                ))}
            </div>
        </div>

        {/* 單價設定與計算表 */}
        <div className="p-4">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                        <th className="text-left py-2 font-medium">材料</th>
                        <th className="text-right py-2 font-medium">數量 (含損耗)</th>
                        <th className="text-right py-2 font-medium w-32">單價</th>
                        <th className="text-right py-2 font-medium">小計</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <tr>
                        <td className="py-3">模板</td>
                        <td className="text-right">{formatNumber(totalsWithWastage.formwork)} m²</td>
                        <td className="text-right">
                            <input
                                type="number"
                                value={prices.formwork}
                                onChange={e => setPrices(prev => ({ ...prev, formwork: parseFloat(e.target.value) || 0 }))}
                                className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                            />
                        </td>
                        <td className="text-right font-medium">${formatNumber(totalCost.formwork, 0)}</td>
                    </tr>
                    <tr>
                        <td className="py-3">鋼筋 ({rebarGrade})</td>
                        <td className="text-right">{formatNumber(totalsWithWastage.rebar)} kg</td>
                        <td className="text-right">
                            <input
                                type="number"
                                value={prices.rebar}
                                onChange={e => setPrices(prev => ({ ...prev, rebar: parseFloat(e.target.value) || 0 }))}
                                className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                            />
                        </td>
                        <td className="text-right font-medium">${formatNumber(totalCost.rebar, 0)}</td>
                    </tr>
                    <tr>
                        <td className="py-3">混凝土 ({CONCRETE_GRADES.find(g => g.id === concreteGrade)?.label.split(' ')[0]})</td>
                        <td className="text-right">{formatNumber(totalsWithWastage.concrete, 3)} m³</td>
                        <td className="text-right">
                            <input
                                type="number"
                                value={prices.concrete}
                                onChange={e => setPrices(prev => ({ ...prev, concrete: parseFloat(e.target.value) || 0 }))}
                                className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                            />
                        </td>
                        <td className="text-right font-medium">${formatNumber(totalCost.concrete, 0)}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-orange-200 bg-orange-50">
                        <td colSpan="3" className="py-3 font-bold text-orange-800">總計 (未稅)</td>
                        <td className="text-right font-bold text-orange-800 text-lg">${formatNumber(totalCost.total, 0)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
);

export default MaterialSummary;
