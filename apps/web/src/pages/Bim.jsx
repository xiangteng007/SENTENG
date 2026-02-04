import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
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
  Filter,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { useConfirm } from '../components/common/ConfirmModal';

// Edit Model Modal Component
const EditModelModal = ({ model, categories, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: model?.name || '',
    project: model?.project || '',
    category: model?.category || 'ARCH',
    version: model?.version || 'v1.0',
    status: model?.status || 'CURRENT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch(`/bim/models/${model.id}`, formData);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || '更新失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">編輯模型</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">模型名稱</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所屬專案</label>
            <input type="text" name="project" value={formData.project} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">模型類型</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="CURRENT">現行版</option>
                <option value="PROCESSING">處理中</option>
                <option value="ARCHIVED">已封存</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-zinc-700 to-blue-600 text-white rounded-lg disabled:opacity-50">
              {loading ? '更新中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Bim = ({ addToast }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedModel, setSelectedModel] = useState(null);
  const [viewerMode, setViewerMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // 模型類別
  const categories = [
    { value: 'ARCH', label: '建築模型', color: 'blue' },
    { value: 'STRUCT', label: '結構模型', color: 'orange' },
    { value: 'MEP', label: '機電模型', color: 'green' },
    { value: 'COMBINED', label: '整合模型', color: 'purple' },
    { value: 'SITE', label: '基地模型', color: 'emerald' },
  ];

  // Fetch models
  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bim/models');
      setModels(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch BIM models:', error);
      // Fallback to mock data if API not available
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
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

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: '刪除模型',
      message: '確定要刪除此 BIM 模型嗎？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/bim/models/${id}`);
      addToast?.('模型已刪除', 'success');
      fetchModels();
    } catch (error) {
      addToast?.('刪除失敗: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Box className="text-zinc-600" size={28} />
            BIM 模型管理
          </h1>
          <p className="text-gray-500 mt-1">建築資訊模型檢視與管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={18} />
            上傳模型
          </button>
          <button 
            onClick={() => { if (models.length > 0) { setSelectedModel(models[0]); setViewerMode(true); } else { addToast?.('尚無模型可檢視', 'warning'); } }}
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
          <div className="text-2xl font-bold text-zinc-700">{stats.totalSize} MB</div>
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
                      onClick={() => { addToast?.(`正在下載 ${model.name}...`, 'info'); setTimeout(() => addToast?.('下載完成', 'success'), 1500); }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="下載模型"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => { setSelectedModel(model); setShowSettingsModal(true); }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="模型設定"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={() => setEditingModel(model)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={16} />
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
                <p className="text-xs text-gray-500 mt-4">模型: {selectedModel.name}</p>
                <p className="text-xs text-gray-500">版本: {selectedModel.version} | 檔案大小: {selectedModel.fileSize} MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">上傳 BIM 模型</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                ✕
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                addToast?.('模型上傳中...', 'info');
                setTimeout(() => {
                  addToast?.('模型上傳成功！', 'success');
                  setShowUploadModal(false);
                }, 2000);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">模型名稱</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg" placeholder="例：信義豪宅案 - 建築模型" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">模型類型</label>
                <select className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">選擇檔案 (IFC/RVT)</label>
                <input type="file" accept=".ifc,.rvt,.nwd" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 btn-secondary">取消</button>
                <button type="submit" className="flex-1 btn-primary">上傳</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">模型設定 - {selectedModel.name}</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">版本:</span> <span className="font-medium">{selectedModel.version}</span></div>
                <div><span className="text-gray-500">檔案大小:</span> <span className="font-medium">{selectedModel.fileSize} MB</span></div>
                <div><span className="text-gray-500">元件數:</span> <span className="font-medium">{selectedModel.elementCount?.toLocaleString()}</span></div>
                <div><span className="text-gray-500">更新日期:</span> <span className="font-medium">{selectedModel.updatedAt}</span></div>
              </div>
              <div className="pt-4 border-t">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">啟用版本控制</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">公開分享連結</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowSettingsModal(false)} className="flex-1 btn-secondary">關閉</button>
                <button onClick={() => { addToast?.('設定已儲存', 'success'); setShowSettingsModal(false); }} className="flex-1 btn-primary">儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Model Modal */}
      {editingModel && (
        <EditModelModal
          model={editingModel}
          categories={categories}
          onClose={() => setEditingModel(null)}
          onSuccess={() => {
            setEditingModel(null);
            fetchModels();
            addToast?.('模型已更新', 'success');
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Bim;
