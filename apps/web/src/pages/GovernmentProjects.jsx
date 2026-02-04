/**
 * GovernmentProjects - 政府標案專區
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: Public Works Project Manager 建議
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, FileText, Calendar, DollarSign, 
  Plus, Search, Filter, ChevronRight, Clock,
  CheckCircle, AlertTriangle, FileCheck, Users
} from 'lucide-react';

// 專案狀態標籤
const statusConfig = {
  bidding: { label: '投標中', color: 'bg-blue-100 text-blue-700', icon: FileText },
  awarded: { label: '已得標', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  inProgress: { label: '執行中', color: 'bg-[#D4AF37]/15 text-[#B8960C]', icon: Clock },
  completed: { label: '已結案', color: 'bg-zinc-100 text-zinc-700', icon: FileCheck },
  failed: { label: '未得標', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
};

// 標案卡片
const ProjectCard = ({ project, onClick }) => {
  const status = statusConfig[project.status] || statusConfig.bidding;
  const StatusIcon = status.icon;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-lg hover:border-[#D4AF37]/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Building2 className="text-[#D4AF37]" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">{project.name}</h3>
            <p className="text-sm text-zinc-500">{project.agency}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-600">
          <FileText size={14} className="text-zinc-400" />
          <span>標案編號: {project.bidNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <DollarSign size={14} className="text-zinc-400" />
          <span>預算金額: NT$ {project.budget?.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <Calendar size={14} className="text-zinc-400" />
          <span>截標日期: {project.deadline}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center">
        <div className="flex -space-x-2">
          {project.team?.slice(0, 3).map((member, i) => (
            <div key={i} className="w-7 h-7 bg-zinc-200 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-zinc-600">
              {member.charAt(0)}
            </div>
          ))}
          {project.team?.length > 3 && (
            <div className="w-7 h-7 bg-[#D4AF37]/20 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-[#B8960C]">
              +{project.team.length - 3}
            </div>
          )}
        </div>
        <button className="text-zinc-500 hover:text-[#D4AF37] flex items-center gap-1 text-sm">
          詳情 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// 統計卡片
const StatCard = ({ title, value, icon: Icon, trend, color = 'from-zinc-800 to-zinc-900' }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{trend}</span>
      )}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-white/70">{title}</p>
  </div>
);

export const GovernmentProjects = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 模擬資料
  const mockProjects = [
    {
      id: 1,
      name: '台北市立圖書館整修工程',
      agency: '台北市政府工務局',
      bidNumber: 'TPE-2026-0001',
      budget: 15000000,
      deadline: '2026-03-15',
      status: 'bidding',
      team: ['王經理', '李工程師', '張設計師']
    },
    {
      id: 2,
      name: '新北市道路修繕計畫',
      agency: '新北市政府交通局',
      bidNumber: 'NTP-2026-0023',
      budget: 8500000,
      deadline: '2026-02-28',
      status: 'awarded',
      team: ['陳主任', '林工程師']
    },
    {
      id: 3,
      name: '桃園國際機場航廈改善',
      agency: '交通部民航局',
      bidNumber: 'MOTC-2026-0005',
      budget: 120000000,
      deadline: '2026-04-01',
      status: 'inProgress',
      team: ['黃總監', '周經理', '吳工程師', '謝設計師']
    },
    {
      id: 4,
      name: '高雄港區物流中心',
      agency: '交通部航港局',
      bidNumber: 'TPH-2025-0089',
      budget: 45000000,
      deadline: '2025-12-31',
      status: 'completed',
      team: ['蔡經理', '楊工程師']
    }
  ];

  const filteredProjects = useMemo(() => {
    return mockProjects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.bidNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: mockProjects.length,
    bidding: mockProjects.filter(p => p.status === 'bidding').length,
    awarded: mockProjects.filter(p => p.status === 'awarded').length,
    inProgress: mockProjects.filter(p => p.status === 'inProgress').length,
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Building2 className="text-[#D4AF37]" />
            政府標案專區
          </h1>
          <p className="text-zinc-500 mt-1">管理公共工程標案、採購與履約</p>
        </div>
        <button 
          onClick={() => addToast?.('功能開發中', 'info')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增標案
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="全部標案" value={stats.total} icon={Building2} />
        <StatCard title="投標中" value={stats.bidding} icon={FileText} color="from-blue-600 to-blue-700" />
        <StatCard title="已得標" value={stats.awarded} icon={CheckCircle} color="from-green-600 to-green-700" />
        <StatCard title="執行中" value={stats.inProgress} icon={Clock} color="from-[#D4AF37] to-[#B8960C]" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="搜尋標案名稱、機關或編號..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="all">全部狀態</option>
            <option value="bidding">投標中</option>
            <option value="awarded">已得標</option>
            <option value="inProgress">執行中</option>
            <option value="completed">已結案</option>
            <option value="failed">未得標</option>
          </select>
        </div>
      </div>

      {/* Project List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredProjects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project}
            onClick={() => addToast?.(`查看: ${project.name}`, 'info')}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
          <Building2 size={48} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500">沒有符合條件的標案</p>
        </div>
      )}
    </div>
  );
};

export default GovernmentProjects;
