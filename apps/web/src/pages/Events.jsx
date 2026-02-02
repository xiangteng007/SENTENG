import React from 'react';
import { Calendar, Plus, Filter, Search } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Events = ({ addToast }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">活動管理</h1>
          <p className="text-gray-500 mt-1">管理公司活動、會議和行程安排</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增活動
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋活動..."
            className="input pl-10 w-full"
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選
        </button>
      </div>

      {/* Content */}
      <div className="card p-8">
        <EmptyState
          icon="calendar"
          title="尚無活動"
          description="開始規劃您的第一個公司活動或會議"
          actionLabel="新增活動"
          onAction={() => addToast?.('功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default Events;
