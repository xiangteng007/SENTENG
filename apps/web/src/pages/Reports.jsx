import React from 'react';
import { BarChart3, Download, Filter, Calendar } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Reports = ({ addToast }) => {
  const reportCategories = [
    { id: 'financial', label: '財務報表', count: 5 },
    { id: 'project', label: '專案報表', count: 3 },
    { id: 'vendor', label: '廠商報表', count: 2 },
    { id: 'custom', label: '自訂報表', count: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">報表中心</h1>
          <p className="text-gray-500 mt-1">產生和下載各類業務報表</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Calendar size={16} />
            選擇期間
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} />
            匯出報表
          </button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportCategories.map(cat => (
          <div key={cat.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">{cat.label}</span>
              <span className="text-sm text-gray-400">{cat.count}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-8">
        <EmptyState
          icon="chart"
          title="選擇報表類型"
          description="從上方選擇報表類別開始產生報表"
        />
      </div>
    </div>
  );
};

export default Reports;
