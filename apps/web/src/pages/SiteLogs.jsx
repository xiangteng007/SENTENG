import React from 'react';
import { ClipboardList, Plus, Filter, Search, Calendar } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const SiteLogs = ({ addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工地日誌</h1>
          <p className="text-gray-500 mt-1">記錄每日工地施工進度和事項</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增日誌
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="搜尋日誌內容..." className="input pl-10 w-full" />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Calendar size={16} />
          選擇日期
        </button>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選專案
        </button>
      </div>

      <div className="card p-8">
        <EmptyState
          icon="file"
          title="尚無工地日誌"
          description="開始記錄每日工地進度和施工紀錄"
          actionLabel="新增日誌"
          onAction={() => addToast?.('功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default SiteLogs;
