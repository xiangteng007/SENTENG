import React from 'react';
import { Construction as ConstructionIcon, Plus, Filter, Search } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Construction = ({ addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">施工管理</h1>
          <p className="text-gray-500 mt-1">追蹤施工進度和品質管控</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增施工項目
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="搜尋施工項目..." className="input pl-10 w-full" />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選
        </button>
      </div>

      <div className="card p-8">
        <EmptyState
          icon="file"
          title="尚無施工項目"
          description="建立施工項目來追蹤進度和品質"
          actionLabel="新增項目"
          onAction={() => addToast?.('功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default Construction;
