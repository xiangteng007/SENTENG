
import { Plus, X, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const WidgetProjectVendors = ({ vendors = [], size: _size, onAddVendor, onRemoveVendor }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case '進行中': return <Clock size={14} className="text-blue-500" />;
            case '已完成': return <CheckCircle size={14} className="text-green-500" />;
            case '待開始': return <AlertCircle size={14} className="text-gray-400" />;
            default: return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case '進行中': return 'bg-blue-50 text-blue-600 border-blue-100';
            case '已完成': return 'bg-green-50 text-green-600 border-green-100';
            case '待開始': return 'bg-gray-50 text-gray-600 border-gray-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-600" />
                    <h4 className="text-xs font-bold text-gray-600">參與廠商</h4>
                </div>
                {onAddVendor && (
                    <button
                        onClick={onAddVendor}
                        className="text-morandi-blue-600 hover:bg-morandi-blue-50 p-1.5 rounded-lg transition-colors"
                        title="新增廠商"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {vendors.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        <Users size={32} className="mx-auto mb-2 opacity-30" />
                        <p>尚未新增廠商</p>
                    </div>
                ) : (
                    vendors.map((vendor, idx) => (
                        <div
                            key={vendor.vendorId || idx}
                            className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-morandi-blue-200 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-gray-800">{vendor.name}</div>
                                    <div className="text-xs text-gray-500">{vendor.role}</div>
                                </div>
                                {onRemoveVendor && (
                                    <button
                                        onClick={() => onRemoveVendor(vendor.vendorId)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                                        title="移除廠商"
                                    >
                                        <X size={12} className="text-red-500" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">加入：{vendor.joinDate}</span>
                                <span className={`px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(vendor.status)}`}>
                                    {getStatusIcon(vendor.status)}
                                    {vendor.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
