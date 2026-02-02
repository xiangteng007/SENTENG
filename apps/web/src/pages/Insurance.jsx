import React from 'react';
import { Shield, Plus, Filter, Search, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Insurance = ({ addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">保險管理</h1>
          <p className="text-gray-500 mt-1">管理工程保險和責任險</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增保單
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">有效保單</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">即將到期</p>
          <p className="text-2xl font-bold text-amber-600">0</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">理賠進行中</p>
          <p className="text-2xl font-bold text-blue-600">0</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">本年保費</p>
          <p className="text-2xl font-bold text-gray-800">$0</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="搜尋保單..." className="input pl-10 w-full" />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選
        </button>
      </div>

      <div className="card p-8">
        <EmptyState
          icon="file"
          title="尚無保險資料"
          description="新增工程險、責任險等保單記錄"
          actionLabel="新增保單"
          onAction={() => addToast?.('功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default Insurance;
