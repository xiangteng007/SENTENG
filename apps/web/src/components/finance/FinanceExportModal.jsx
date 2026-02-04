
import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Calendar, FileSpreadsheet, Search, Download, Filter, X } from 'lucide-react';

// 日期區間選項
const DATE_RANGE_OPTIONS = [
    { id: 'today', label: '今日' },
    { id: 'week', label: '本週' },
    { id: 'month', label: '本月' },
    { id: 'custom', label: '自訂' }
];

// 日期區間計算
const getDateRange = (rangeType, customStart, customEnd) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (rangeType) {
        case 'today':
            return {
                startDate: today.toISOString().slice(0, 10),
                endDate: today.toISOString().slice(0, 10)
            };
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return {
                startDate: weekStart.toISOString().slice(0, 10),
                endDate: today.toISOString().slice(0, 10)
            };
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return {
                startDate: monthStart.toISOString().slice(0, 10),
                endDate: today.toISOString().slice(0, 10)
            };
        case 'custom':
            return { startDate: customStart, endDate: customEnd };
        default:
            return { startDate: '', endDate: '' };
    }
};

export const FinanceExportModal = ({
    isOpen,
    onClose,
    transactions = [],
    accounts = [],
    projects = [],
    onExport
}) => {
    const [rangeType, setRangeType] = useState('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // 計算日期範圍
    const dateRange = useMemo(() => {
        return getDateRange(rangeType, customStartDate, customEndDate);
    }, [rangeType, customStartDate, customEndDate]);

    // 建立帳戶和專案的查詢映射
    const accountsMap = useMemo(() => {
        const map = {};
        accounts.forEach(acc => { map[acc.id] = acc.name; });
        return map;
    }, [accounts]);

    const projectsMap = useMemo(() => {
        const map = {};
        projects.forEach(p => { map[p.id] = p.name; });
        return map;
    }, [projects]);

    // 篩選交易
    const filteredTransactions = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return transactions;

        return transactions.filter(tx => {
            const txDate = tx.date;
            return txDate >= dateRange.startDate && txDate <= dateRange.endDate;
        });
    }, [transactions, dateRange]);

    // 計算統計
    const stats = useMemo(() => {
        let income = 0, expense = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === '收入') income += tx.amount;
            else expense += tx.amount;
        });
        return { income, expense, net: income - expense, count: filteredTransactions.length };
    }, [filteredTransactions]);

    // 處理匯出
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await onExport(filteredTransactions, {
                dateRange,
                accountsMap,
                projectsMap
            });
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="📊 匯出財務報表"
            onConfirm={handleExport}
            confirmDisabled={isExporting || filteredTransactions.length === 0}
            confirmText={isExporting ? '匯出中...' : '匯出到 Google Sheet'}
        >
            <div className="space-y-5">
                {/* 日期區間選擇 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar size={14} className="inline mr-1" />
                        日期區間
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {DATE_RANGE_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setRangeType(option.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${rangeType === option.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 自訂日期輸入 */}
                {rangeType === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">起始日期</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">結束日期</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* 預覽統計 */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="text-sm font-medium text-gray-700 mb-3">匯出預覽</div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                            <div className="text-xl font-bold text-gray-800">{stats.count}</div>
                            <div className="text-xs text-gray-500">筆交易</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-green-600">
                                ${stats.income.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">總收入</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-red-500">
                                ${stats.expense.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">總支出</div>
                        </div>
                        <div>
                            <div className={`text-xl font-bold ${stats.net >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                ${stats.net.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">淨額</div>
                        </div>
                    </div>
                </div>

                {/* 提示訊息 */}
                <div className="text-xs text-gray-500 flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <FileSpreadsheet size={14} className="text-yellow-600" />
                    報表將匯出到 Google Drive「財務報表」資料夾，並按月份自動分類
                </div>
            </div>
        </Modal>
    );
};

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

export default FinanceExportModal;
