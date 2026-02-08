// React 17+ JSX transform
import { Plus, Package, TrendingDown, TrendingUp, Clock } from 'lucide-react';

export const WidgetProjectInventory = ({ inventory = [], size, onAddRecord }) => {
    const getTypeIcon = (type) => {
        return type === '出'
            ? <TrendingDown size={14} className="text-red-500" />
            : <TrendingUp size={14} className="text-green-500" />;
    };

    const getTypeColor = (type) => {
        return type === '出'
            ? 'bg-red-50 text-red-600 border-red-100'
            : 'bg-green-50 text-green-600 border-green-100';
    };

    // 按日期分組
    const groupedByDate = inventory.reduce((acc, item) => {
        if (!acc[item.date]) {
            acc[item.date] = [];
        }
        acc[item.date].push(item);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-600" />
                    <h4 className="text-xs font-bold text-gray-600">庫存物品進出</h4>
                </div>
                {onAddRecord && (
                    <button
                        onClick={onAddRecord}
                        className="text-morandi-blue-600 hover:bg-morandi-blue-50 p-1.5 rounded-lg transition-colors"
                        title="新增記錄"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {inventory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                        <p>尚無物品進出記錄</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedDates.map(date => (
                            <div key={date}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={12} className="text-gray-400" />
                                    <span className="text-xs text-gray-500 font-medium">{date}</span>
                                </div>
                                <div className="space-y-2">
                                    {groupedByDate[date].map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-xs border flex items-center gap-1 ${getTypeColor(item.type)}`}>
                                                        {getTypeIcon(item.type)}
                                                        {item.type}
                                                    </span>
                                                    <span className="font-medium text-xs text-gray-800">{item.itemName}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">x{item.quantity}</span>
                                            </div>

                                            {item.note && (
                                                <div className="text-xs text-gray-500 mt-1">{item.note}</div>
                                            )}

                                            <div className="text-xs text-gray-400 mt-1">
                                                操作人：{item.operator}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
