
import { useState } from 'react';
import { Calendar as CalendarIcon, Wallet, StickyNote, Plus, Trash2, ArrowUpRight, ArrowDownRight, Briefcase, Users, Activity } from 'lucide-react';
import { Badge } from '../common/Badge';

export const WidgetDailySchedule = ({ events, size }) => {
    const today = new Date().toISOString().split('T')[0];
    const dailyEvents = events ? events.filter(e => e.date === "2025-12-07") : []; // Mock today 

    if (size === 'S') return (
        <div className="h-full flex flex-col justify-between p-2">
            <div className="flex items-center gap-2 text-morandi-blue-600">
                <CalendarIcon size={20} />
                <span className="font-bold text-sm">今日行程</span>
            </div>
            <div className="text-3xl font-bold text-morandi-text-primary">{dailyEvents.length}</div>
            <div className="text-xs text-gray-500">待辦事項</div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="text-sm font-bold text-gray-500 mb-2">{today} (模擬)</div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {dailyEvents.length === 0 ? <div className="text-gray-400 text-sm text-center py-4">無行程</div> : dailyEvents.map(evt => (
                    <div key={evt.id} className="flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 transition-colors border-l-2 border-morandi-blue-500 pl-2">
                        <div className="text-xs font-mono font-bold text-morandi-text-accent mt-0.5">{evt.time}</div>
                        <div className="text-sm text-gray-700">{evt.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const WidgetMemo = ({ size }) => {
    const [memos, setMemos] = useState([]);
    const [newMemo, setNewMemo] = useState("");

    const addMemo = (e) => {
        if (e.key === 'Enter' && newMemo.trim()) {
            setMemos([...memos, newMemo.trim()]);
            setNewMemo("");
        }
    };

    if (size === 'S') return (
        <div className="h-full flex flex-col justify-between p-2 relative bg-yellow-50/50">
            <StickyNote className="text-yellow-500 absolute top-2 right-2 opacity-50" size={24} />
            <div className="font-bold text-gray-700">備忘錄</div>
            <div className="text-3xl font-bold text-gray-800">{memos.length}</div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-yellow-50/30 -m-4 p-4">
            <div className="flex-1 overflow-y-auto space-y-2 mb-2 custom-scrollbar">
                {memos.map((m, i) => (
                    <div key={i} className="bg-white/80 p-2 shadow-sm rounded border border-yellow-100/50 flex justify-between group">
                        <span className="text-sm text-gray-700">{m}</span>
                        <button onClick={() => setMemos(memos.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <input
                value={newMemo}
                onChange={e => setNewMemo(e.target.value)}
                onKeyDown={addMemo}
                placeholder="+ 新增備忘..."
                className="w-full bg-white/60 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 placeholder-yellow-600/50"
            />
        </div>
    );
};

export const WidgetOverviewStats = ({ finance, projects, clients, size }) => {
    // Finance Calculation
    const totalBalance = finance?.accounts?.reduce((acc, c) => acc + c.balance, 0) || 0;
    const monthlyIncome = finance?.transactions?.filter(t => t.type === '收入').reduce((acc, c) => acc + c.amount, 0) || 0;

    // Projects Calculation
    const activeProjects = projects?.filter(p => p.status === '施工中' || p.status === '進行中').length || 0;

    // Clients
    const newClients = clients?.filter(c => c.status === '洽談中').length || 0;

    if (size === 'S') return (
        <div className="h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 text-morandi-green-600">
                <Wallet size={20} />
                <span className="font-bold text-sm">本月營收</span>
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-800">${(monthlyIncome / 10000).toFixed(1)}萬</div>
                <div className="text-xs text-gray-400">本月統計</div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Briefcase size={18} /></div>
                    <div>
                        <div className="text-xs text-gray-500">進行中專案</div>
                        <div className="text-lg font-bold text-gray-800">{activeProjects} <span className="text-xs font-normal text-gray-400">案</span></div>
                    </div>
                </div>
                <div className="h-8 w-[1px] bg-gray-200"></div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Wallet size={18} /></div>
                    <div>
                        <div className="text-xs text-gray-500">總資產結餘</div>
                        <div className="text-lg font-bold text-gray-800">${(totalBalance / 10000).toFixed(1)}萬</div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2 text-gray-600">
                    <Users size={16} />
                    <span className="text-sm">新客戶洽談</span>
                </div>
                <Badge color="orange">{newClients} 位</Badge>
            </div>
        </div>
    );
};

export const WidgetRecentActivity = ({ logs, size }) => {
    // Use real logs if provided, otherwise show empty state
    const activities = logs || [];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 text-gray-500">
                <Activity size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">最新動態</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {activities.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">暫無動態</div>
                ) : activities.map(log => (
                    <div key={log.id} className="flex gap-3 text-sm">
                        <div className="w-12 text-[10px] text-gray-400 text-right pt-0.5 shrink-0">{log.time}</div>
                        <div className="relative pl-3 border-l border-gray-100">
                            <div className={`absolute left-[-2.5px] top-1.5 w-1.5 h-1.5 rounded-full ${log.type === 'finance' ? 'bg-green-400' : 'bg-morandi-blue-400'}`}></div>
                            <div className="text-gray-700 leading-snug">{log.text}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
