/**
 * FireSafetyRecords - 消防檢測記錄
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: Fire Protection Engineer 建議
 */

import { useState, useMemo } from 'react';
import { 
  Flame, FileText, Calendar, AlertTriangle, 
  Plus, Search, CheckCircle, Clock, Settings,
  Bell, ChevronRight, AlertCircle
} from 'lucide-react';

// 設備狀態配置
const statusConfig = {
  normal: { label: '正常', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  warning: { label: '待檢', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  overdue: { label: '逾期', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
  maintenance: { label: '維修中', color: 'bg-zinc-100 text-zinc-600', icon: Settings },
};

// 設備類型
const equipmentTypes = {
  extinguisher: { label: '滅火器', icon: '🧯' },
  hydrant: { label: '消防栓', icon: '🚒' },
  alarm: { label: '火警警報', icon: '🔔' },
  sprinkler: { label: '灑水系統', icon: '💧' },
  exit: { label: '逃生設備', icon: '🚪' },
  smoke: { label: '排煙設備', icon: '💨' },
};

// 設備卡片
const EquipmentCard = ({ equipment, onClick }) => {
  const status = statusConfig[equipment.status] || statusConfig.normal;
  const type = equipmentTypes[equipment.type] || equipmentTypes.extinguisher;
  const StatusIcon = status.icon;

  const isOverdue = equipment.status === 'overdue';
  const isWarning = equipment.status === 'warning';

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer ${
        isOverdue ? 'border-red-200 bg-red-50/30' : 
        isWarning ? 'border-amber-200 bg-amber-50/30' : 
        'border-zinc-100 hover:border-[#D4AF37]/30'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-2xl">
          {type.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-zinc-900">{equipment.name}</h4>
          <p className="text-sm text-zinc-500">{type.label} · {equipment.location}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-600">
          <Calendar size={14} className="text-zinc-400" />
          <span>上次: {equipment.lastCheck}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <Clock size={14} className="text-zinc-400" />
          <span>下次: {equipment.nextCheck}</span>
        </div>
      </div>

      {(isOverdue || isWarning) && (
        <div className={`mt-3 pt-3 border-t ${isOverdue ? 'border-red-200' : 'border-amber-200'}`}>
          <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
            {isOverdue ? '⚠️ 已逾期，請立即安排檢測' : '📅 即將到期，請提前安排'}
          </p>
        </div>
      )}
    </div>
  );
};

// 檢測統計
const InspectionStats = ({ equipment }) => {
  const stats = useMemo(() => {
    const total = equipment.length;
    const normal = equipment.filter(e => e.status === 'normal').length;
    const warning = equipment.filter(e => e.status === 'warning').length;
    const overdue = equipment.filter(e => e.status === 'overdue').length;
    return { total, normal, warning, overdue };
  }, [equipment]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-5 text-white">
        <Flame className="mb-2 text-[#D4AF37]" size={24} />
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-sm text-zinc-400">設備總數</p>
      </div>
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white">
        <CheckCircle className="mb-2" size={24} />
        <p className="text-2xl font-bold">{stats.normal}</p>
        <p className="text-sm text-green-200">正常運作</p>
      </div>
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
        <AlertCircle className="mb-2" size={24} />
        <p className="text-2xl font-bold">{stats.warning}</p>
        <p className="text-sm text-amber-200">待檢設備</p>
      </div>
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
        <AlertTriangle className="mb-2" size={24} />
        <p className="text-2xl font-bold">{stats.overdue}</p>
        <p className="text-sm text-red-200">逾期未檢</p>
      </div>
    </div>
  );
};

// 即將到期提醒
const UpcomingReminders = ({ equipment }) => {
  const upcoming = equipment
    .filter(e => e.status === 'warning' || e.status === 'overdue')
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
          <Bell className="text-[#D4AF37]" size={20} />
          檢測提醒
        </h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
          {upcoming.length} 項待處理
        </span>
      </div>

      <div className="space-y-3">
        {upcoming.length > 0 ? upcoming.map((eq, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
            <span className="text-xl">{equipmentTypes[eq.type]?.icon || '🔧'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900">{eq.name}</p>
              <p className="text-xs text-zinc-500">{eq.location}</p>
            </div>
            <span className={`text-xs ${eq.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
              {eq.nextCheck}
            </span>
          </div>
        )) : (
          <p className="text-center text-zinc-400 py-4">暫無待檢設備</p>
        )}
      </div>
    </div>
  );
};

export const FireSafetyRecords = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const mockEquipment = [
    { id: 1, name: '1F 大廳滅火器 A', type: 'extinguisher', location: '1F 大廳', status: 'normal', lastCheck: '2025-12-15', nextCheck: '2026-06-15' },
    { id: 2, name: '2F 辦公區消防栓', type: 'hydrant', location: '2F 走廊', status: 'warning', lastCheck: '2025-06-10', nextCheck: '2026-02-10' },
    { id: 3, name: '全棟火警警報系統', type: 'alarm', location: '中控室', status: 'normal', lastCheck: '2026-01-05', nextCheck: '2026-07-05' },
    { id: 4, name: 'B1 停車場灑水系統', type: 'sprinkler', location: 'B1 停車場', status: 'overdue', lastCheck: '2025-07-01', nextCheck: '2026-01-01' },
    { id: 5, name: '緊急照明設備', type: 'exit', location: '全棟樓梯間', status: 'normal', lastCheck: '2025-11-20', nextCheck: '2026-05-20' },
    { id: 6, name: '屋頂排煙設備', type: 'smoke', location: 'RF', status: 'warning', lastCheck: '2025-08-15', nextCheck: '2026-02-15' },
    { id: 7, name: '3F 會議室滅火器', type: 'extinguisher', location: '3F 會議室', status: 'maintenance', lastCheck: '2025-12-01', nextCheck: '2026-06-01' },
  ];

  const filteredEquipment = useMemo(() => {
    return mockEquipment.filter(eq => {
      const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           eq.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || eq.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Flame className="text-[#D4AF37]" />
            消防檢測記錄
          </h1>
          <p className="text-zinc-500 mt-1">消防設備檢測、維護與定期追蹤</p>
        </div>
        <button 
          onClick={() => addToast?.('新增設備功能開發中', 'info')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增設備
        </button>
      </div>

      {/* Stats */}
      <InspectionStats equipment={mockEquipment} />

      {/* Reminders & Filters */}
      <div className="grid lg:grid-cols-3 gap-6">
        <UpcomingReminders equipment={mockEquipment} />
        
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="搜尋設備或位置..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="all">全部類型</option>
              {Object.entries(equipmentTypes).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="all">全部狀態</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Equipment Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredEquipment.map(eq => (
              <EquipmentCard 
                key={eq.id} 
                equipment={eq}
                onClick={() => addToast?.(`查看: ${eq.name}`, 'info')}
              />
            ))}
          </div>

          {filteredEquipment.length === 0 && (
            <div className="py-12 text-center">
              <Flame size={48} className="mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500">沒有符合條件的設備</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FireSafetyRecords;
