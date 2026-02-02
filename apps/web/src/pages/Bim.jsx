import React from 'react';
import { Building2, Upload, Filter, Search, Box } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const Bim = ({ addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">BIM 建模</h1>
          <p className="text-gray-500 mt-1">建築資訊模型管理與檢視</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Upload size={18} />
          上傳模型
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="搜尋模型..." className="input pl-10 w-full" />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          篩選專案
        </button>
      </div>

      <div className="card p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <Box size={36} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">BIM 檢視器</h3>
          <p className="text-gray-500 mb-4">上傳 IFC 或 Revit 檔案來檢視 3D 模型</p>
          <button 
            onClick={() => addToast?.('BIM 功能開發中', 'info')}
            className="btn-primary"
          >
            上傳模型檔案
          </button>
          <p className="text-xs text-gray-400 mt-3">支援格式：.ifc, .rvt, .nwd</p>
        </div>
      </div>
    </div>
  );
};

export default Bim;
