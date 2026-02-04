/**
 * MilestoneTracker - 履約管理里程碑追蹤
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: 公共工程專家 H) 建議
 */

import React, { useState, useMemo } from 'react';
import { 
  Flag, Calendar, CheckCircle, Clock, AlertTriangle,
  Plus, ChevronRight, Edit, Trash2, FileText
} from 'lucide-react';

// 里程碑狀態
const statusConfig = {
  pending: { label: '待執行', color: 'bg-zinc-100 text-zinc-600', icon: Clock },
  inProgress: { label: '進行中', color: 'bg-blue-100 text-blue-600', icon: Flag },
  review: { label: '審核中', color: 'bg-amber-100 text-amber-600', icon: FileText },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600', icon: CheckCircle },
  delayed: { label: '逾期', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
};

// 里程碑卡片
const MilestoneCard = ({ milestone, onEdit, onComplete }) => {
  const status = statusConfig[milestone.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  const daysRemaining = useMemo(() => {
    const due = new Date(milestone.dueDate);
    const today = new Date();
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  }, [milestone.dueDate]);

  return (
    <div className={`bg-white rounded-xl border-l-4 p-4 shadow-sm hover:shadow-md transition-all ${
      milestone.status === 'completed' ? 'border-green-500' :
      milestone.status === 'delayed' ? 'border-red-500' :
      milestone.status === 'inProgress' ? 'border-blue-500' :
      'border-zinc-300'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.color}`}>
          <StatusIcon size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-zinc-900">{milestone.name}</h4>
            <span className={`px-2.5 py-1 rounded-full text-xs ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{milestone.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-zinc-600">
              <Calendar size={14} />
              {milestone.dueDate}
            </span>
            {milestone.status !== 'completed' && (
              <span className={`flex items-center gap-1 ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-amber-600' : 'text-zinc-600'}`}>
                {daysRemaining < 0 ? `逾期 ${Math.abs(daysRemaining)} 天` : `剩餘 ${daysRemaining} 天`}
              </span>
            )}
            {milestone.amount && (
              <span className="text-[#D4AF37] font-medium">
                NT$ {milestone.amount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar for in-progress items */}
      {milestone.status === 'inProgress' && milestone.progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-zinc-500">進度</span>
            <span className="font-medium text-zinc-700">{milestone.progress}%</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${milestone.progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex gap-2">
        {milestone.status !== 'completed' && (
          <button 
            onClick={() => onComplete(milestone.id)}
            className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            標記完成
          </button>
        )}
        <button 
          onClick={() => onEdit(milestone)}
          className="p-2 border border-zinc-200 rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          <Edit size={16} />
        </button>
      </div>
    </div>
  );
};

// 甘特圖簡化版
const GanttChart = ({ milestones }) => {
  const today = new Date();
  const startDate = new Date(Math.min(...milestones.map(m => new Date(m.startDate || m.dueDate))));
  const endDate = new Date(Math.max(...milestones.map(m => new Date(m.dueDate))));
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 overflow-x-auto">
      <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
        <Calendar className="text-[#D4AF37]" size={20} />
        時程甘特圖
      </h3>
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="flex items-center border-b border-zinc-200 pb-2 mb-4">
          <div className="w-48 text-sm font-medium text-zinc-600">里程碑</div>
          <div className="flex-1 flex">
            {Array.from({ length: Math.min(12, Math.ceil(totalDays / 30)) }).map((_, i) => (
              <div key={i} className="flex-1 text-xs text-zinc-400 text-center">
                {new Date(startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW', { month: 'short' })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {milestones.map(milestone => {
          const start = new Date(milestone.startDate || milestone.dueDate);
          const due = new Date(milestone.dueDate);
          const startOffset = ((start - startDate) / (1000 * 60 * 60 * 24)) / totalDays * 100;
          const width = ((due - start) / (1000 * 60 * 60 * 24) || 1) / totalDays * 100;
          
          return (
            <div key={milestone.id} className="flex items-center py-2 hover:bg-zinc-50 rounded">
              <div className="w-48 text-sm text-zinc-700 truncate pr-2">{milestone.name}</div>
              <div className="flex-1 relative h-6">
                <div 
                  className={`absolute h-5 rounded ${
                    milestone.status === 'completed' ? 'bg-green-400' :
                    milestone.status === 'delayed' ? 'bg-red-400' :
                    milestone.status === 'inProgress' ? 'bg-blue-400' :
                    'bg-zinc-300'
                  }`}
                  style={{ left: `${startOffset}%`, width: `${Math.max(width, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {/* Today marker */}
        <div className="relative h-0">
          <div 
            className="absolute top-0 w-0.5 h-full bg-red-500 -mt-32"
            style={{ left: `${((today - startDate) / (1000 * 60 * 60 * 24)) / totalDays * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const MilestoneTracker = ({ addToast }) => {
  const [viewMode, setViewMode] = useState('list'); // list, gantt
  const [filterStatus, setFilterStatus] = useState('all');

  const mockMilestones = [
    { id: 1, name: '設計圖送審', description: '結構設計圖送建築師審核', dueDate: '2026-02-15', startDate: '2026-01-20', status: 'completed', amount: 0 },
    { id: 2, name: '地基開挖完成', description: '基礎開挖與地樁施工', dueDate: '2026-03-01', startDate: '2026-02-16', status: 'inProgress', progress: 65, amount: 500000 },
    { id: 3, name: '主體結構完成', description: 'RC 結構體澆置完成', dueDate: '2026-05-15', startDate: '2026-03-02', status: 'pending', amount: 2000000 },
    { id: 4, name: '水電管線配置', description: '機電工程管線佈設', dueDate: '2026-04-10', startDate: '2026-03-15', status: 'delayed', amount: 800000 },
    { id: 5, name: '外牆裝修', description: '外牆磁磚與防水工程', dueDate: '2026-06-30', startDate: '2026-05-16', status: 'pending', amount: 600000 },
    { id: 6, name: '驗收完成', description: '業主驗收與移交', dueDate: '2026-07-31', startDate: '2026-07-01', status: 'pending', amount: 0 },
  ];

  const filteredMilestones = useMemo(() => {
    if (filterStatus === 'all') return mockMilestones;
    return mockMilestones.filter(m => m.status === filterStatus);
  }, [filterStatus]);

  const stats = useMemo(() => {
    const total = mockMilestones.length;
    const completed = mockMilestones.filter(m => m.status === 'completed').length;
    const delayed = mockMilestones.filter(m => m.status === 'delayed').length;
    const inProgress = mockMilestones.filter(m => m.status === 'inProgress').length;
    return { total, completed, delayed, inProgress, progress: Math.round(completed / total * 100) };
  }, []);

  const handleComplete = (id) => {
    addToast?.(`里程碑 #${id} 已標記完成`, 'success');
  };

  const handleEdit = (milestone) => {
    addToast?.(`編輯: ${milestone.name}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Flag className="text-[#D4AF37]" />
            履約管理
          </h1>
          <p className="text-zinc-500 mt-1">專案里程碑追蹤與進度管理</p>
        </div>
        <button 
          onClick={() => addToast?.('新增里程碑功能開發中', 'info')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增里程碑
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-5 text-white">
          <p className="text-3xl font-bold">{stats.progress}%</p>
          <p className="text-sm text-zinc-400">整體進度</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <p className="text-3xl font-bold">{stats.completed}/{stats.total}</p>
          <p className="text-sm text-green-100">已完成</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <p className="text-3xl font-bold">{stats.inProgress}</p>
          <p className="text-sm text-blue-100">進行中</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
          <p className="text-3xl font-bold">{stats.delayed}</p>
          <p className="text-sm text-red-100">逾期</p>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === 'list' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#D4AF37]'
            }`}
          >
            列表
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === 'gantt' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#D4AF37]'
            }`}
          >
            甘特圖
          </button>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
        >
          <option value="all">全部狀態</option>
          {Object.entries(statusConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {viewMode === 'gantt' ? (
        <GanttChart milestones={mockMilestones} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredMilestones.map(milestone => (
            <MilestoneCard 
              key={milestone.id} 
              milestone={milestone}
              onEdit={handleEdit}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestoneTracker;
