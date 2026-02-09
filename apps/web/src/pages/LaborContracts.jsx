/**
 * LaborContracts - 勞動契約範本管理
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: Labor Law Attorney 建議
 */

import { useState, useMemo } from 'react';
import {
    FileText, Users, Calendar, Clock, Plus, Search, Download, Eye, CheckCircle, AlertTriangle
} from 'lucide-react';

// 契約類型
const contractTypes = {
  fulltime: { label: '正職契約', color: 'bg-green-100 text-green-700' },
  parttime: { label: '兼職契約', color: 'bg-blue-100 text-blue-700' },
  temporary: { label: '臨時契約', color: 'bg-amber-100 text-amber-700' },
  internship: { label: '實習契約', color: 'bg-zinc-100 text-zinc-700' },
  contractor: { label: '承攬契約', color: 'bg-[#D4AF37]/15 text-[#B8960C]' },
};

// 契約狀態
const statusConfig = {
  active: { label: '有效', color: 'text-green-600', icon: CheckCircle },
  expiring: { label: '即將到期', color: 'text-amber-600', icon: AlertTriangle },
  expired: { label: '已到期', color: 'text-red-600', icon: AlertTriangle },
  draft: { label: '草稿', color: 'text-zinc-500', icon: FileText },
};

// 範本卡片
const TemplateCard = ({ template, onUse }) => (
  <div className="bg-white rounded-xl border border-zinc-100 p-5 hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
        <FileText className="text-zinc-600" size={24} />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-zinc-900">{template.name}</h4>
        <p className="text-sm text-zinc-500 mt-1">{template.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className={`px-2 py-1 rounded-full text-xs ${contractTypes[template.type]?.color}`}>
            {contractTypes[template.type]?.label}
          </span>
          <span className="text-xs text-zinc-400">更新: {template.updated}</span>
        </div>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-zinc-100 flex gap-2">
      <button 
        onClick={() => onUse(template)}
        className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
      >
        使用範本
      </button>
      <button className="p-2 border border-zinc-200 rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors">
        <Eye size={18} />
      </button>
      <button className="p-2 border border-zinc-200 rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors">
        <Download size={18} />
      </button>
    </div>
  </div>
);

// 員工契約卡片
const EmployeeContractCard = ({ contract, onClick }) => {
  const status = statusConfig[contract.status] || statusConfig.active;
  const type = contractTypes[contract.type] || contractTypes.fulltime;
  const StatusIcon = status.icon;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-zinc-100 p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-sm font-medium text-zinc-600">
          {contract.employeeName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-zinc-900">{contract.employeeName}</h4>
          <p className="text-sm text-zinc-500">{contract.position}</p>
        </div>
        <span className={`flex items-center gap-1 text-sm ${status.color}`}>
          <StatusIcon size={14} />
          {status.label}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-600">
          <FileText size={14} className="text-zinc-400" />
          <span className={`px-1.5 py-0.5 rounded text-xs ${type.color}`}>{type.label}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <Calendar size={14} className="text-zinc-400" />
          <span>到期: {contract.endDate}</span>
        </div>
      </div>
    </div>
  );
};

// 工時追蹤組件
const OvertimeTracker = () => {
  const employees = [
    { name: '王小明', regularHours: 168, overtimeHours: 12, limit: 46 },
    { name: '李大華', regularHours: 168, overtimeHours: 38, limit: 46 },
    { name: '張美玲', regularHours: 168, overtimeHours: 46, limit: 46 },
    { name: '陳志偉', regularHours: 168, overtimeHours: 52, limit: 46 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
          <Clock className="text-[#D4AF37]" size={20} />
          本月加班時數
        </h3>
        <span className="text-xs text-zinc-500">上限: 46 小時/月</span>
      </div>
      <div className="space-y-4">
        {employees.map((emp, i) => {
          const isOver = emp.overtimeHours > emp.limit;
          const percentage = (emp.overtimeHours / emp.limit) * 100;
          return (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-sm font-medium text-zinc-600">
                {emp.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-900">{emp.name}</span>
                  <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-zinc-600'}`}>
                    {emp.overtimeHours}h / {emp.limit}h
                    {isOver && ' ⚠️'}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isOver ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LaborContracts = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');

  const mockTemplates = [
    { id: 1, name: '標準勞動契約書', type: 'fulltime', description: '符合勞基法規定之正職員工契約', updated: '2026-01-15' },
    { id: 2, name: '兼職人員契約書', type: 'parttime', description: '適用於部分工時人員', updated: '2026-01-10' },
    { id: 3, name: '定期契約書', type: 'temporary', description: '適用於臨時性、季節性工作', updated: '2025-12-20' },
    { id: 4, name: '實習生契約書', type: 'internship', description: '適用於建教合作實習生', updated: '2025-12-15' },
    { id: 5, name: '承攬契約書', type: 'contractor', description: '適用於承攬工作關係', updated: '2025-11-30' },
  ];

  const mockContracts = [
    { id: 1, employeeName: '王小明', position: '工地主任', type: 'fulltime', status: 'active', endDate: '2027-01-15' },
    { id: 2, employeeName: '李大華', position: '水電技師', type: 'fulltime', status: 'expiring', endDate: '2026-03-01' },
    { id: 3, employeeName: '張美玲', position: '會計', type: 'fulltime', status: 'active', endDate: '2026-12-31' },
    { id: 4, employeeName: '陳志偉', position: '臨時工', type: 'temporary', status: 'expired', endDate: '2026-01-31' },
    { id: 5, employeeName: '林小芳', position: '實習生', type: 'internship', status: 'active', endDate: '2026-06-30' },
  ];

  const filteredItems = useMemo(() => {
    const items = activeTab === 'templates' ? mockTemplates : mockContracts;
    return items.filter(item => {
      const searchField = activeTab === 'templates' ? item.name : item.employeeName;
      return searchField.toLowerCase().includes(searchTerm.toLowerCase());
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <FileText className="text-[#D4AF37]" />
            勞動契約管理
          </h1>
          <p className="text-zinc-500 mt-1">契約範本、員工契約與工時追蹤</p>
        </div>
        <button 
          onClick={() => addToast?.('新增契約功能開發中', 'info')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增契約
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'templates', label: '契約範本', icon: FileText },
          { id: 'contracts', label: '員工契約', icon: Users },
          { id: 'overtime', label: '工時追蹤', icon: Clock },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                isActive 
                  ? 'bg-zinc-900 text-white' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#D4AF37]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#D4AF37]' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'overtime' ? (
        <OvertimeTracker />
      ) : (
        <>
          {/* Search */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder={activeTab === 'templates' ? '搜尋範本名稱...' : '搜尋員工姓名...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'templates' ? (
              filteredItems.map(template => (
                <TemplateCard 
                  key={template.id} 
                  template={template}
                  onUse={(t) => addToast?.(`使用範本: ${t.name}`, 'info')}
                />
              ))
            ) : (
              filteredItems.map(contract => (
                <EmployeeContractCard 
                  key={contract.id} 
                  contract={contract}
                  onClick={() => addToast?.(`查看: ${contract.employeeName}`, 'info')}
                />
              ))
            )}
          </div>

          {filteredItems.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
              <FileText size={48} className="mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500">沒有符合條件的{activeTab === 'templates' ? '範本' : '契約'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LaborContracts;
