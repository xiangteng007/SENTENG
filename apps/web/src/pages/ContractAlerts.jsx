/**
 * ContractAlerts - 合約到期提醒
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: Lawyer 建議 - 合約到期自動通知功能
 */

import React, { useState, useMemo } from 'react';
import { 
  Bell, FileText, Calendar, Clock,
  AlertTriangle, CheckCircle, ChevronRight,
  Filter, Download, Mail, Settings
} from 'lucide-react';

// 提醒狀態
const alertStatus = {
  critical: { label: '緊急', color: 'bg-red-100 text-red-700 border-red-200', days: '7天內到期' },
  warning: { label: '警告', color: 'bg-amber-100 text-amber-700 border-amber-200', days: '30天內到期' },
  notice: { label: '通知', color: 'bg-blue-100 text-blue-700 border-blue-200', days: '60天內到期' },
  ok: { label: '正常', color: 'bg-green-100 text-green-700 border-green-200', days: '60天以上' },
};

// 合約類型
const contractTypes = {
  vendor: { label: '廠商合約', icon: '🏭' },
  client: { label: '客戶合約', icon: '🤝' },
  lease: { label: '租賃合約', icon: '🏠' },
  insurance: { label: '保險合約', icon: '🛡️' },
  license: { label: '許可證照', icon: '📋' },
  labor: { label: '勞動契約', icon: '👥' },
};

// 計算剩餘天數
const getDaysRemaining = (endDate) => {
  const end = new Date(endDate);
  const today = new Date();
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
};

// 獲取提醒狀態
const getAlertStatus = (daysRemaining) => {
  if (daysRemaining <= 0) return 'critical';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  if (daysRemaining <= 60) return 'notice';
  return 'ok';
};

// 合約提醒卡片
const ContractAlertCard = ({ contract, onAction }) => {
  const daysRemaining = getDaysRemaining(contract.endDate);
  const statusKey = getAlertStatus(daysRemaining);
  const status = alertStatus[statusKey];
  const type = contractTypes[contract.type] || contractTypes.vendor;

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all ${status.color}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
          {type.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-zinc-900">{contract.name}</h4>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {daysRemaining <= 0 ? '已到期' : `剩餘 ${daysRemaining} 天`}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{contract.party}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {contract.endDate}
            </span>
            <span className="flex items-center gap-1">
              <FileText size={14} />
              {type.label}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-100 flex gap-2">
        <button 
          onClick={() => onAction(contract, 'view')}
          className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          查看合約
        </button>
        <button 
          onClick={() => onAction(contract, 'renew')}
          className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          續約
        </button>
        <button 
          onClick={() => onAction(contract, 'notify')}
          className="p-2 border border-zinc-200 rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          <Mail size={18} />
        </button>
      </div>
    </div>
  );
};

// 統計卡片
const StatsCard = ({ title, value, icon: Icon, color, trend }) => (
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

// 提醒設定
const AlertSettings = ({ onClose }) => (
  <div className="bg-white rounded-2xl border border-zinc-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
        <Settings className="text-[#D4AF37]" size={20} />
        提醒設定
      </h3>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
        <div>
          <p className="font-medium text-zinc-900">郵件通知</p>
          <p className="text-sm text-zinc-500">合約到期前自動發送郵件提醒</p>
        </div>
        <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37]" />
      </div>
      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
        <div>
          <p className="font-medium text-zinc-900">系統通知</p>
          <p className="text-sm text-zinc-500">在系統內顯示待辦提醒</p>
        </div>
        <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37]" />
      </div>
      <div className="p-4 bg-zinc-50 rounded-xl">
        <p className="font-medium text-zinc-900 mb-3">提前提醒天數</p>
        <div className="grid grid-cols-3 gap-2">
          {[7, 30, 60].map(days => (
            <label key={days} className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37]" />
              <span className="text-sm text-zinc-600">{days} 天</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ContractAlerts = ({ addToast }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  const mockContracts = [
    { id: 1, name: '工程材料供應合約', party: '台北建材行', type: 'vendor', endDate: '2026-02-10' },
    { id: 2, name: '住宅裝修工程合約', party: '張先生', type: 'client', endDate: '2026-02-28' },
    { id: 3, name: '辦公室租賃合約', party: '興隆大樓', type: 'lease', endDate: '2026-03-15' },
    { id: 4, name: '營造業責任險', party: '國泰產險', type: 'insurance', endDate: '2026-04-01' },
    { id: 5, name: '特種建築師執照', party: '內政部營建署', type: 'license', endDate: '2026-05-20' },
    { id: 6, name: '水電技師契約', party: '李大華', type: 'labor', endDate: '2026-06-30' },
  ];

  const filteredContracts = useMemo(() => {
    return mockContracts.filter(contract => {
      const matchesType = typeFilter === 'all' || contract.type === typeFilter;
      const statusKey = getAlertStatus(getDaysRemaining(contract.endDate));
      const matchesStatus = statusFilter === 'all' || statusKey === statusFilter;
      return matchesType && matchesStatus;
    }).sort((a, b) => getDaysRemaining(a.endDate) - getDaysRemaining(b.endDate));
  }, [typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const critical = mockContracts.filter(c => getAlertStatus(getDaysRemaining(c.endDate)) === 'critical').length;
    const warning = mockContracts.filter(c => getAlertStatus(getDaysRemaining(c.endDate)) === 'warning').length;
    const notice = mockContracts.filter(c => getAlertStatus(getDaysRemaining(c.endDate)) === 'notice').length;
    return { critical, warning, notice, total: mockContracts.length };
  }, []);

  const handleAction = (contract, action) => {
    const messages = {
      view: `查看合約: ${contract.name}`,
      renew: `啟動續約流程: ${contract.name}`,
      notify: `發送提醒通知給: ${contract.party}`,
    };
    addToast?.(messages[action], 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Bell className="text-[#D4AF37]" />
            合約到期提醒
          </h1>
          <p className="text-zinc-500 mt-1">管理合約到期時間與自動提醒通知</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="btn-outline flex items-center gap-2"
        >
          <Settings size={18} />
          提醒設定
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="全部合約" value={stats.total} icon={FileText} color="from-zinc-800 to-zinc-900" />
        <StatsCard title="緊急 (7天內)" value={stats.critical} icon={AlertTriangle} color="from-red-500 to-red-600" />
        <StatsCard title="警告 (30天內)" value={stats.warning} icon={Clock} color="from-amber-500 to-amber-600" />
        <StatsCard title="通知 (60天內)" value={stats.notice} icon={Bell} color="from-blue-500 to-blue-600" />
      </div>

      {/* Settings Panel */}
      {showSettings && <AlertSettings />}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="all">全部類型</option>
            {Object.entries(contractTypes).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="all">全部狀態</option>
            {Object.entries(alertStatus).map(([key, val]) => (
              <option key={key} value={key}>{val.label} ({val.days})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contract List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredContracts.map(contract => (
          <ContractAlertCard 
            key={contract.id} 
            contract={contract}
            onAction={handleAction}
          />
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <p className="text-zinc-500">沒有需要關注的合約</p>
        </div>
      )}
    </div>
  );
};

export default ContractAlerts;
