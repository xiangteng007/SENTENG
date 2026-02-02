import React from 'react';
import { Recycle, Plus, Filter, Search, Truck } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Waste = ({ addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">廢棄物管理</h1>
          <p className="text-gray-500 mt-1">營建廢棄物追蹤和處理記錄</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增記錄
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">本月清運量</p>
          <p className="text-2xl font-bold text-gray-800">0 噸</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">待清運</p>
          <p className="text-2xl font-bold text-amber-600">0 趟</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">本月費用</p>
          <p className="text-2xl font-bold text-gray-800">$0</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">合作廠商</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="搜尋記錄..." className="input pl-10 w-full" />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選專案
        </button>
      </div>

      <div className="card p-8">
        <EmptyState
          icon="file"
          title="尚無廢棄物記錄"
          description="記錄營建廢棄物的產生、清運和處理"
          actionLabel="新增記錄"
          onAction={() => addToast?.('功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default Waste;
