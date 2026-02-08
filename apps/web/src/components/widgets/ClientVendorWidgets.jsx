
import { useState } from 'react';
import { Users, HardHat, Plus, Search, Trash2, Edit2, Star, UserPlus } from 'lucide-react';
import { Badge } from '../common/Badge';

// --- CLIENT WIDGETS ---
export const WidgetClientStats = ({ data, size }) => {
    const signed = data.filter(c => c.status === '已簽約').length;
    const total = data.length;
    if (size === 'S') return <div className="h-full flex flex-col justify-between"><Users size={24} className="text-morandi-blue-500" /><div><div className="text-3xl font-bold text-morandi-text-primary">{total}</div><div className="text-xs text-gray-500">客戶總數</div></div></div>;
    return <div className="h-full flex flex-col justify-center gap-2"><div className="flex justify-between items-center p-3 bg-morandi-green-100 rounded-xl"><span className="text-xs text-morandi-green-600 font-bold">已簽約</span><span className="text-xl font-bold text-morandi-green-600">{signed}</span></div><div className="flex justify-between items-center p-3 bg-morandi-blue-100 rounded-xl"><span className="text-xs text-morandi-blue-600 font-bold">洽談中</span><span className="text-xl font-bold text-morandi-blue-600">{total - signed}</span></div></div>;
};

export const WidgetClientList = ({ data, size, onSelectClient, onAddClient, onDeleteClient }) => {
    if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-12 h-12 rounded-full bg-morandi-blue-100 text-morandi-blue-600 flex items-center justify-center cursor-pointer hover:bg-morandi-blue-200 transition-colors" onClick={onAddClient}><Plus size={24} /></div><button className="text-xs font-bold text-gray-600 hover:text-morandi-blue-600" onClick={onAddClient}>新增客戶</button></div>;
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between mb-3 items-center"><h4 className="font-bold text-gray-600 text-xs">列表 ({data.length})</h4>{size === 'L' && <button onClick={onAddClient} className="bg-morandi-text-accent text-white px-2.5 py-1 text-xs rounded-lg hover:bg-gray-700 flex items-center gap-1 transition-colors"><UserPlus size={12} /> 新增</button>}</div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {data.map(c => (
                    <div key={c.id} className="group flex justify-between items-center bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-morandi-blue-200 transition-all cursor-pointer" onClick={() => onSelectClient(c)}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{c.name[0]}</div>
                            <div><div className="font-bold text-sm text-gray-700">{c.name}</div><div className="text-[10px] text-gray-400">{c.phone}</div></div>
                        </div>
                        <div className="flex items-center gap-2"><Badge color={c.status === '已簽約' ? 'green' : 'blue'}>{c.status}</Badge>{size === 'L' && <button onClick={(e) => { e.stopPropagation(); onDeleteClient(c.id); }} className="p-1.5 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- VENDOR WIDGETS ---
export const WidgetVendorStats = ({ data, size }) => {
    const total = data.length;
    // Fixed logic to actually show stats
    if (size === 'S') return <div className="h-full flex flex-col justify-between"><HardHat size={24} className="text-morandi-orange-600" /><div><div className="text-3xl font-bold text-morandi-text-primary">{total}</div><div className="text-xs text-gray-500">合作廠商</div></div></div>;

    const categories = {};
    data.forEach(v => { categories[v.category] = (categories[v.category] || 0) + 1; });

    return (
        <div className="h-full flex flex-col justify-center gap-2">
            {Object.entries(categories).map(([k, count]) => (
                <div key={k} className="flex justify-between items-center p-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{k}</span>
                    <span className="font-bold text-gray-800">{count}</span>
                </div>
            ))}
        </div>
    );
};

export const WidgetVendorList = ({ data, size, onAdd, onEdit, onDelete }) => {
    const [search, setSearch] = useState("");
    const filtered = data.filter(v => v.name.includes(search) || v.tradeType.includes(search));

    if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={onAdd}><Plus size={24} /></div><button className="text-xs font-bold text-gray-600" onClick={onAdd}>新增廠商</button></div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between mb-4 gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="搜尋..." className="w-full text-sm pl-9 p-2 border-none bg-gray-100 rounded-xl focus:ring-2 focus:ring-morandi-blue-200 transition-all" onChange={e => setSearch(e.target.value)} />
                </div>
                <button onClick={onAdd} className="bg-morandi-text-accent text-white px-3 py-1 text-sm rounded-xl flex items-center gap-2 hover:bg-gray-700 transition-colors"><Plus size={16} /> 新增</button>
            </div>
            <div className={`overflow-y-auto pr-1 pb-2 custom-scrollbar ${size === 'L' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
                {filtered.map(vendor => (
                    <div key={vendor.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-all bg-white relative group">
                        <div className="absolute top-3 right-3 flex gap-1">
                            <button onClick={() => onEdit(vendor)} className="p-1.5 text-gray-300 hover:text-morandi-blue-600 hover:bg-morandi-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(vendor.id); }} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>}
                        </div>
                        <div className="flex justify-between items-start mb-2 pr-14"><Badge color="blue">{vendor.tradeType}</Badge></div>
                        <h3 className="font-bold text-morandi-text-primary text-sm mb-1">{vendor.name}</h3>
                        <div className="flex items-center gap-1 text-orange-400 text-xs mb-3"><Star size={12} fill="currentColor" /><span className="font-bold text-gray-700">{vendor.rating}</span></div>
                        <div className="bg-gray-50/50 rounded-lg p-2 flex items-center gap-2 mb-2">
                            <div className="text-xs">
                                <div className="font-medium text-gray-900">{vendor.contactPerson}</div>
                                <div className="text-gray-400 font-mono scale-90 origin-left">{vendor.phone}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
