
import React from 'react';
import { Briefcase, Plus, FileText, Image as ImageIcon, Upload, Edit2, ChevronLeft } from 'lucide-react';
import { ProgressBar } from '../common/Indicators';

// --- MAIN PROJECT LIST WIDGETS ---
export const WidgetProjectStats = ({ data, size }) => {
    if (!Array.isArray(data)) return null;
    const activeCount = data.filter(p => ["設計中", "施工中"].includes(p.status)).length;
    if (size === 'S') return <div className="h-full flex flex-col justify-between"><Briefcase size={24} className="text-morandi-blue-500" /><div><div className="text-3xl font-bold text-morandi-text-primary">{activeCount}</div><div className="text-xs text-gray-500">進行中專案</div></div></div>;

    const designCount = data.filter(p => p.status === "設計中").length;
    const constructionCount = data.filter(p => p.status === "施工中").length;

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-end">
                <div><div className="text-3xl font-bold text-morandi-text-primary">{activeCount}</div><div className="text-xs text-gray-500">總進行中</div></div>
                <div className="space-y-1 text-right">
                    <div className="text-xs"><span className="font-bold text-morandi-blue-600">{designCount}</span> 設計中</div>
                    <div className="text-xs"><span className="font-bold text-morandi-orange-600">{constructionCount}</span> 施工中</div>
                </div>
            </div>
            {size === 'L' && (
                <div className="mt-4 flex gap-1">
                    <div style={{ width: `${(designCount / activeCount || 0) * 100}%` }} className="bg-morandi-blue-500 h-2 rounded-l-full"></div>
                    <div style={{ width: `${(constructionCount / activeCount || 0) * 100}%` }} className="bg-morandi-orange-500 h-2 rounded-r-full"></div>
                </div>
            )}
        </div>
    );
};

export const WidgetProjectList = ({ data, size, onSelectProject, onAdd }) => {
    if (!Array.isArray(data)) return null;
    if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={onAdd}><Plus size={24} /></div><button className="text-xs font-bold text-gray-600 hover:text-morandi-blue-600" onClick={onAdd}>新增專案</button></div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between mb-4 gap-2">
                <span className="font-bold text-gray-500 text-xs">最近更新 ({data.length})</span>
                {size === 'L' && <button onClick={onAdd} className="bg-morandi-text-accent text-white px-2 py-1 text-xs rounded-lg flex items-center gap-1 hover:bg-gray-700 transition-colors"><Plus size={12} /> 新增</button>}
            </div>
            <div className={`overflow-y-auto pr-1 pb-2 custom-scrollbar ${size === 'L' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
                {data.map(p => (
                    <div key={p.id} onClick={() => onSelectProject && onSelectProject(p)} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-morandi-blue-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${p.status === '施工中' ? 'bg-morandi-orange-500' : 'bg-morandi-blue-500'}`}></span>
                            <h4 className="font-bold text-morandi-text-primary text-sm truncate">{p.name}</h4>
                        </div>
                        <p className="text-xs text-gray-400 font-mono mb-4">{p.code}</p>
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>進度</span><span>{p.progress}%</span></div>
                        <ProgressBar value={p.progress} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- PROJECT DETAIL WIDGETS ---
export const WidgetProjectInfo = ({ project, size }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-xl"><span className="text-xs text-gray-500 block mb-1">業主</span><span className="font-bold text-gray-800">{project.clientName}</span></div>
            <div className="bg-gray-50 p-3 rounded-xl"><span className="text-xs text-gray-500 block mb-1">類型</span><span className="font-bold text-gray-800">{project.type}</span></div>
        </div>
        <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1"><span>專案進度</span><span>{project.progress}%</span></div>
            <ProgressBar value={project.progress} />
        </div>
    </div>
);

export const WidgetProjectFiles = ({ files, size, onUpload }) => {
    if (size === 'S') return <div className="h-full flex flex-col justify-center items-center gap-2"><div className="w-10 h-10 bg-morandi-orange-100 text-morandi-orange-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-morandi-orange-500 hover:text-white transition-colors" onClick={onUpload}><Upload size={18} /></div><span className="text-xs text-gray-500">上傳檔案</span></div>;
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between mb-3 items-center"><h4 className="text-xs font-bold text-gray-600">Drive 檔案</h4><button onClick={onUpload} className="text-morandi-orange-600 hover:bg-morandi-orange-100 p-1.5 rounded-lg transition-colors"><Upload size={14} /></button></div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 cursor-pointer transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><FileText size={16} /></div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-700 truncate">{f.name}</div>
                            <div className="text-[10px] text-gray-400">{f.size} · {f.date}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
