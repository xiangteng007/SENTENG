import React from 'react';
import { CalendarDays, Plus, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Schedules = ({ addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工程進度</h1>
          <p className="text-gray-500 mt-1">甘特圖檢視和里程碑管理</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-1 px-3">
            <ChevronLeft size={16} />
          </button>
          <button className="btn-secondary px-3">本週</button>
          <button className="btn-secondary flex items-center gap-1 px-3">
            <ChevronRight size={16} />
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            新增里程碑
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="搜尋專案..." className="input pl-10 w-full" />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選專案
        </button>
      </div>

      <div className="card p-8">
        <EmptyState
          icon="calendar"
          title="尚無工程進度"
          description="建立專案里程碑來追蹤工程進度"
          actionLabel="新增里程碑"
          onAction={() => addToast?.('功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default Schedules;
