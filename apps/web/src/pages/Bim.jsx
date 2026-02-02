import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Layers,
  Maximize2,
  Settings,
  FileText,
  RefreshCw,
  Filter
} from 'lucide-react';

export const Bim = ({ addToast }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedModel, setSelectedModel] = useState(null);
  const [viewerMode, setViewerMode] = useState(false);

  // 模型類別
  const categories = [
    { value: 'ARCH', label: '建築模型', color: 'blue' },
    { value: 'STRUCT', label: '結構模型', color: 'orange' },
    { value: 'MEP', label: '機電模型', color: 'green' },
    { value: 'COMBINED', label: '整合模型', color: 'purple' },
    { value: 'SITE', label: '基地模型', color: 'emerald' },
  ];

  // Mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setModels([
        {
          id: '1',
          name: '信義豪宅案_建築模型',
          project: '信義豪宅案',
          category: 'ARCH',
          version: 'v3.2',
          lastUpdated: '2026-02-01',
          fileSize: '245 MB',
          format: 'IFC',
          elements: 12580,
          status: 'CURRENT',
          thumbnail: null,
        },
        {
          id: '2',
          name: '信義豪宅案_結構模型',
          project: '信義豪宅案',
          category: 'STRUCT',
          version: 'v2.8',
          lastUpdated: '2026-01-28',
          fileSize: '189 MB',
          format: 'IFC',
          elements: 8920,
          status: 'CURRENT',
          thumbnail: null,
        },
        {
          id: '3',
          name: '信義豪宅案_MEP模型',
          project: '信義豪宅案',
          category: 'MEP',
          version: 'v2.5',
          lastUpdated: '2026-01-25',
          fileSize: '312 MB',
          format: 'IFC',
          elements: 24150,
          status: 'CURRENT',
          thumbnail: null,
        },
        {
          id: '4',
          name: '信義豪宅案_整合模型',
          project: '信義豪宅案',
          category: 'COMBINED',
          version: 'v1.9',
          lastUpdated: '2026-02-02',
          fileSize: '756 MB',
          format: 'IFC',
          elements: 45650,
          status: 'PROCESSING',
          thumbnail: null,
        },
        {
          id: '5',
          name: '大同商辦案_建築模型',
          project: '大同商辦案',
          category: 'ARCH',
          version: 'v2.1',
          lastUpdated: '2026-01-20',
          fileSize: '198 MB',
          format: 'RVT',
          elements: 9800,
          status: 'CURRENT',
          thumbnail: null,
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  // 篩選
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchSearch = model.name.toLowerCase().includes(search.toLowerCase()) ||
                          model.project.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || model.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [models, search, categoryFilter]);

  // 統計
  const stats = useMemo(() => {
    return {
      total: models.length,
      totalElements: models.reduce((acc, m) => acc + m.elements, 0),
      totalSize: models.reduce((acc, m) => acc + parseFloat(m.fileSize), 0).toFixed(0),
      processing: models.filter(m => m.status === 'PROCESSING').length,
    };
  }, [models]);

  const getCategoryInfo = (cat) => categories.find(c => c.value === cat) || categories[0];

  const handleView = (model) => {
    setSelectedModel(model);
    setViewerMode(true);
    addToast?.('3D 檢視器開啟中...', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Box className="text-purple-500" size={28} />
            BIM 模型管理
          </h1>
          <p className="text-gray-500 mt-1">建築資訊模型檢視與管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => addToast?.('上傳功能開發中', 'info')}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={18} />
            上傳模型
          </button>
          <button 
            onClick={() => addToast?.('功能開發中', 'info')}
            className="btn-primary flex items-center gap-2"
          >
            <Layers size={18} />
            開啟檢視器
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">模型總數</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalElements.toLocaleString()}</div>
          <div className="text-sm text-gray-500">總元件數</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalSize} MB</div>
          <div className="text-sm text-gray-500">總容量</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.processing}</div>
          <div className="text-sm text-gray-500">處理中</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋模型或專案..."
            className="input pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input min-w-[150px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">所有類別</option>
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredModels.length === 0 ? (
        <div className="card p-8 text-center">
          <Box className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="font-semibold text-gray-700 mb-2">尚無 BIM 模型</h3>
          <p className="text-gray-500 mb-4">上傳 IFC 或 RVT 檔案開始使用</p>
          <button className="btn-primary">上傳模型</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map(model => {
            const catInfo = getCategoryInfo(model.category);
            return (
              <div key={model.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail / Placeholder */}
                <div className={`h-36 bg-gradient-to-br from-${catInfo.color}-100 to-${catInfo.color}-200 flex items-center justify-center relative`}>
                  <Box className={`text-${catInfo.color}-400`} size={48} />
                  {model.status === 'PROCESSING' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <RefreshCw className="text-white animate-spin" size={24} />
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-${catInfo.color}-100 text-${catInfo.color}-700`}>
                    {catInfo.label}
                  </span>
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate" title={model.name}>{model.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{model.project}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                    <span>{model.version}</span>
                    <span>{model.format}</span>
                    <span>{model.fileSize}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>{model.elements.toLocaleString()} 元件</span>
                    <span>{model.lastUpdated}</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleView(model)}
                      className="flex-1 btn-primary text-sm py-1.5 flex items-center justify-center gap-1"
                    >
                      <Eye size={14} />
                      檢視
                    </button>
                    <button
                      onClick={() => addToast?.('下載功能開發中', 'info')}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => addToast?.('設定功能開發中', 'info')}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer Modal Placeholder */}
      {viewerMode && selectedModel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold">{selectedModel.name}</h2>
              <button 
                onClick={() => setViewerMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 bg-gray-900 flex items-center justify-center text-white">
              <div className="text-center">
                <Box size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">3D IFC 檢視器</p>
                <p className="text-sm text-gray-400 mt-2">整合 IFC.js 或 xeokit 引擎</p>
                <p className="text-xs text-gray-500 mt-4">功能開發中...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bim;
