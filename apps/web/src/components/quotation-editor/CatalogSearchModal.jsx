/**
 * 工項庫搜尋 Modal
 */

import { useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { CATALOG_CATEGORIES, DEFAULT_CATALOG_ITEMS } from '../../services/QuotationService';

const CatalogSearchModal = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [results, setResults] = useState(DEFAULT_CATALOG_ITEMS);

    useEffect(() => {
        const filtered = DEFAULT_CATALOG_ITEMS.filter(item => {
            const matchSearch = !searchTerm ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = !selectedCategory || item.category === selectedCategory;
            return matchSearch && matchCategory;
        });
        setResults(filtered);
    }, [searchTerm, selectedCategory]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Search size={20} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white">從工項庫選擇</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-3 border-b border-gray-100">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜尋工項..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                        >
                            <option value="">全部分類</option>
                            {CATALOG_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                        {results.map(item => {
                            const category = CATALOG_CATEGORIES.find(c => c.id === item.category);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { onSelect(item); onClose(); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors text-left"
                                >
                                    <span className="text-lg">{category?.icon || '📦'}</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.unit} · 參考價 ${item.refPrice.toLocaleString()}</div>
                                    </div>
                                    <Plus size={16} className="text-orange-500" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatalogSearchModal;
