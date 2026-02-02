import React from 'react';
import { Camera, Upload, Filter, Search, Play, Image } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Drone = ({ addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">空拍管理</h1>
          <p className="text-gray-500 mt-1">無人機空拍影像和資料管理</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Upload size={18} />
          上傳影像
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="搜尋影像..." className="input pl-10 w-full" />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選專案
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Image size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-500">照片</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Play size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-500">影片</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <EmptyState
          icon="camera"
          title="尚無空拍影像"
          description="上傳無人機拍攝的照片或影片"
          actionLabel="上傳影像"
          onAction={() => addToast?.('功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default Drone;
