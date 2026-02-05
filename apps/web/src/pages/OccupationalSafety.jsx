/**
 * OccupationalSafety - 職安衛檔案管理
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: Labor Inspector / OSH Specialist 建議
 */

import React, { useState, useMemo } from 'react';
import { 
  Shield, FileText, Calendar, AlertTriangle, 
  Plus, Search, CheckCircle, Clock, Users,
  Download, Upload, Eye, ChevronRight
} from 'lucide-react';

// 文件類型配置
const documentTypes = {
  checklist: { label: '自檢表', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  training: { label: '教育訓練', icon: Users, color: 'bg-blue-100 text-blue-700' },
  inspection: { label: '勞檢紀錄', icon: FileText, color: 'bg-[#D4AF37]/15 text-[#B8960C]' },
  equipment: { label: '設備檢查', icon: Shield, color: 'bg-zinc-100 text-zinc-700' },
  incident: { label: '事故報告', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
};

// 文件卡片
const DocumentCard = ({ doc, onView }) => {
  const type = documentTypes[doc.type] || documentTypes.checklist;
  const TypeIcon = type.icon;

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
          <TypeIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-zinc-900 truncate">{doc.name}</h4>
          <p className="text-sm text-zinc-500">{doc.date}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${type.color}`}>
          {type.label}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{doc.size}</span>
        <div className="flex gap-2">
          <button 
            onClick={() => onView(doc)}
            className="p-1.5 text-zinc-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
          >
            <Eye size={16} />
          </button>
          <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 勞檢自評表組件
const SelfAssessmentChecklist = () => {
  const [items, setItems] = useState([]);

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const completedCount = items.filter(i => i.checked).length;
  const completionRate = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
            <CheckCircle className="text-[#D4AF37]" size={20} />
            勞檢自評表
          </h3>
          <p className="text-sm text-zinc-500">準備勞動檢查所需文件</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#D4AF37]">{completionRate}%</span>
          <p className="text-xs text-zinc-500">{completedCount}/{items.length} 完成</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-zinc-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] transition-all duration-500"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {items.map(item => (
          <label 
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              className="w-5 h-5 rounded border-zinc-300 text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <div className="flex-1">
              <p className={`text-sm font-medium ${item.checked ? 'text-zinc-900' : 'text-zinc-600'}`}>
                {item.item}
              </p>
              <p className="text-xs text-zinc-400">{item.category}</p>
            </div>
            {item.checked && <CheckCircle size={16} className="text-green-500" />}
          </label>
        ))}
      </div>
    </div>
  );
};

// 教育訓練時數追蹤
const TrainingHoursTracker = () => {
  const [employees, setEmployees] = useState([]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="text-[#D4AF37]" size={20} />
            教育訓練時數
          </h3>
          <p className="text-sm text-zinc-500">本年度安全衛生訓練</p>
        </div>
        <button className="text-sm text-zinc-600 hover:text-[#D4AF37] flex items-center gap-1">
          查看全部 <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {employees.map((emp, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-sm font-medium text-zinc-600">
              {emp.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-900">{emp.name}</span>
                <span className={`text-xs ${emp.status === 'complete' ? 'text-green-600' : 'text-amber-600'}`}>
                  {emp.hours}/{emp.required} 小時
                </span>
              </div>
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    emp.status === 'complete' ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${(emp.hours / emp.required) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OccupationalSafety = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const mockDocuments = [
    { id: 1, name: '2026年度安全衛生管理計畫', type: 'checklist', date: '2026-01-15', size: '2.3 MB' },
    { id: 2, name: '新進人員教育訓練紀錄_張美玲', type: 'training', date: '2026-01-20', size: '512 KB' },
    { id: 3, name: '2026年1月勞檢紀錄', type: 'inspection', date: '2026-01-25', size: '1.8 MB' },
    { id: 4, name: '吊車年度檢查報告', type: 'equipment', date: '2026-01-10', size: '3.2 MB' },
    { id: 5, name: '112年度職災事故報告', type: 'incident', date: '2025-12-15', size: '892 KB' },
    { id: 6, name: '在職訓練紀錄_2025Q4', type: 'training', date: '2025-12-20', size: '1.5 MB' },
  ];

  const filteredDocs = useMemo(() => {
    return mockDocuments.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || doc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Shield className="text-[#D4AF37]" />
            職安衛檔案管理
          </h1>
          <p className="text-zinc-500 mt-1">勞動檢查準備、教育訓練與安全文件</p>
        </div>
        <button 
          onClick={() => addToast?.('上傳功能開發中', 'info')}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={18} />
          上傳文件
        </button>
      </div>

      {/* Stats & Checklist */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SelfAssessmentChecklist />
        <TrainingHoursTracker />
      </div>

      {/* Document Filter */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="搜尋文件..."
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
            {Object.entries(documentTypes).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => (
          <DocumentCard 
            key={doc.id} 
            doc={doc}
            onView={(d) => addToast?.(`查看: ${d.name}`, 'info')}
          />
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
          <FileText size={48} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500">沒有符合條件的文件</p>
        </div>
      )}
    </div>
  );
};

export default OccupationalSafety;
