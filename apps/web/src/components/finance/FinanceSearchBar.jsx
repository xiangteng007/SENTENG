
import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

// 搜尋收支記錄元件
export const FinanceSearchBar = ({ onSearch, isSearching }) => {
    const [query, setQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        if (query.trim()) {
            onSearch(query, { startDate, endDate });
        }
    };

    const handleClear = () => {
        setQuery('');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="搜尋交易記錄（說明、分類、專案）..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Filter size={18} />
                </button>
                <button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSearching ? '搜尋中...' : '搜尋'}
                </button>
                {(query || startDate || endDate) && (
                    <button
                        onClick={handleClear}
                        className="px-3 py-2.5 text-gray-500 hover:text-gray-700"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">起始日期</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">結束日期</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceSearchBar;
