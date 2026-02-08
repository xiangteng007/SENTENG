/**
 * LaborDisputes - 勞資爭議記錄
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: 勞動法規專家 H) 建議
 */

import { useState, useMemo } from 'react';
import { 
  Scale, Users, Calendar, FileText, MessageSquare,
  Plus, Search, AlertTriangle, CheckCircle, Clock,
  ChevronRight, Filter
} from 'lucide-react';

// 案件狀態
const caseStatus = {
  open: { label: '處理中', color: 'bg-blue-100 text-blue-600', icon: Clock },
  negotiating: { label: '協商中', color: 'bg-amber-100 text-amber-600', icon: MessageSquare },
  mediation: { label: '調解中', color: 'bg-purple-100 text-purple-600', icon: Scale },
  resolved: { label: '已解決', color: 'bg-green-100 text-green-600', icon: CheckCircle },
  escalated: { label: '需上訴', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
};

// 案件類型
const caseTypes = {
  wage: { label: '工資爭議', icon: '💰' },
  termination: { label: '解僱爭議', icon: '🚪' },
  workplace: { label: '職場霸凌', icon: '⚠️' },
  injury: { label: '職災糾紛', icon: '🏥' },
  benefits: { label: '福利爭議', icon: '📦' },
  contract: { label: '契約糾紛', icon: '📄' },
};

// 案件卡片
const DisputeCard = ({ dispute, onClick }) => {
  const status = caseStatus[dispute.status] || caseStatus.open;
  const type = caseTypes[dispute.type] || caseTypes.wage;
  const StatusIcon = status.icon;

  return (
    <div 
      onClick={() => onClick(dispute)}
      className="bg-white rounded-xl border border-zinc-100 p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-2xl">
          {type.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-zinc-900">{dispute.title}</h4>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${status.color}`}>
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{dispute.employee} vs. 公司</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-600">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {dispute.filedDate}
            </span>
            <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
              {type.label}
            </span>
          </div>
        </div>
      </div>
      
      {/* Amount if applicable */}
      {dispute.claimAmount && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-sm text-zinc-500">請求金額</span>
          <span className="text-lg font-semibold text-[#D4AF37]">
            NT$ {dispute.claimAmount.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

// 時間線
const Timeline = ({ events }) => (
  <div className="space-y-4">
    {events.map((event, i) => (
      <div key={i} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full ${
            event.type === 'resolved' ? 'bg-green-500' :
            event.type === 'alert' ? 'bg-red-500' :
            'bg-zinc-400'
          }`} />
          {i < events.length - 1 && <div className="w-0.5 h-full bg-zinc-200" />}
        </div>
        <div className="pb-4">
          <p className="text-sm font-medium text-zinc-900">{event.title}</p>
          <p className="text-xs text-zinc-500">{event.date}</p>
          {event.description && (
            <p className="text-sm text-zinc-600 mt-1">{event.description}</p>
          )}
        </div>
      </div>
    ))}
  </div>
);

export const LaborDisputes = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);

  const mockDisputes = [
    { id: 1, title: '加班費爭議', employee: '王小明', type: 'wage', status: 'negotiating', filedDate: '2026-01-15', claimAmount: 85000, description: '員工主張 2025 年加班費未足額給付' },
    { id: 2, title: '不當解僱申訴', employee: '李大華', type: 'termination', status: 'mediation', filedDate: '2026-01-20', claimAmount: 200000, description: '員工主張解僱理由不當' },
    { id: 3, title: '職災醫療補償', employee: '張美玲', type: 'injury', status: 'open', filedDate: '2026-02-01', claimAmount: 150000, description: '工地意外導致骨折，請求醫療補償' },
    { id: 4, title: '年終獎金爭議', employee: '陳志偉', type: 'benefits', status: 'resolved', filedDate: '2025-12-20', claimAmount: 50000, description: '已協商解決' },
    { id: 5, title: '特休假結算', employee: '林小芳', type: 'contract', status: 'open', filedDate: '2026-02-02', claimAmount: 30000, description: '未休特休假結算爭議' },
  ];

  const mockTimeline = [
    { date: '2026-02-02', title: '收到申訴', type: 'info' },
    { date: '2026-02-05', title: '初次協商', description: '雙方同意進行內部協商', type: 'info' },
    { date: '2026-02-10', title: '協商未果', description: '轉交勞工局調解', type: 'alert' },
    { date: '2026-02-15', title: '調解會議', description: '訂於下週一召開', type: 'info' },
  ];

  const filteredDisputes = useMemo(() => {
    return mockDisputes.filter(d => {
      const matchesSearch = d.title.includes(searchTerm) || d.employee.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
      const matchesType = filterType === 'all' || d.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchTerm, filterStatus, filterType]);

  const stats = useMemo(() => ({
    total: mockDisputes.length,
    open: mockDisputes.filter(d => d.status === 'open' || d.status === 'negotiating' || d.status === 'mediation').length,
    resolved: mockDisputes.filter(d => d.status === 'resolved').length,
    totalClaim: mockDisputes.reduce((sum, d) => sum + (d.claimAmount || 0), 0),
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Scale className="text-[#D4AF37]" />
            勞資爭議管理
          </h1>
          <p className="text-zinc-500 mt-1">案件追蹤與調解記錄</p>
        </div>
        <button 
          onClick={() => addToast?.('新增案件功能開發中', 'info')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增案件
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-5 text-white">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-zinc-400">總案件數</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <p className="text-3xl font-bold">{stats.open}</p>
          <p className="text-sm text-amber-100">處理中</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <p className="text-3xl font-bold">{stats.resolved}</p>
          <p className="text-sm text-green-100">已解決</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
          <p className="text-2xl font-bold">NT$ {(stats.totalClaim / 10000).toFixed(0)}萬</p>
          <p className="text-sm text-red-100">總請求金額</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="搜尋案件或員工..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="all">全部狀態</option>
            {Object.entries(caseStatus).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="all">全部類型</option>
            {Object.entries(caseTypes).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Case List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredDisputes.map(dispute => (
            <DisputeCard 
              key={dispute.id} 
              dispute={dispute}
              onClick={setSelectedDispute}
            />
          ))}
          {filteredDisputes.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
              <Scale size={48} className="mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500">沒有符合條件的案件</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#D4AF37]" />
            案件時程
          </h3>
          <Timeline events={mockTimeline} />
          
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <h4 className="font-medium text-zinc-900 mb-3">快速行動</h4>
            <div className="space-y-2">
              <button className="w-full py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm hover:bg-zinc-200 transition-colors">
                📝 新增處理記錄
              </button>
              <button className="w-full py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm hover:bg-zinc-200 transition-colors">
                📅 預約協商會議
              </button>
              <button className="w-full py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm hover:bg-zinc-200 transition-colors">
                📤 匯出案件報告
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaborDisputes;
