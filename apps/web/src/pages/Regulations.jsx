import { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ExternalLink,
  Tag,
  FileText,
  Filter,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useConfirm } from '../components/common/ConfirmModal';

// Edit Checklist Modal Component
const EditChecklistModal = ({ checklist, categories, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: checklist?.title || '',
    category: checklist?.category || 'SAFETY',
    project: checklist?.project || '',
    totalItems: checklist?.totalItems || 10,
    completedItems: checklist?.completedItems || 0,
    status: checklist?.status || 'IN_PROGRESS',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'totalItems' || name === 'completedItems' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch(`/regulations/checklists/${checklist.id}`, formData);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || '更新失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Scale size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">編輯檢查表</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">檢查表標題</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">法規類別</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="IN_PROGRESS">進行中</option>
                <option value="COMPLETED">已完成</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">總項目數</label>
              <input type="number" name="totalItems" value={formData.totalItems} onChange={handleChange} min="1" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">已完成項目</label>
              <input type="number" name="completedItems" value={formData.completedItems} onChange={handleChange} min="0" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
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

export const Regulations = ({ addToast }) => {
  const [regulations, setRegulations] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('regulations'); // 'regulations' | 'checklists'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // 法規類別
  const categories = [
    { value: 'BUILDING', label: '建築技術規則', color: 'blue' },
    { value: 'SAFETY', label: '職業安全衛生', color: 'orange' },
    { value: 'ENVIRONMENT', label: '環境保護', color: 'green' },
    { value: 'FIRE', label: '消防法規', color: 'red' },
    { value: 'LABOR', label: '勞動法規', color: 'purple' },
    { value: 'CONTRACT', label: '營建法規', color: 'indigo' },
  ];

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [regsRes, checkRes] = await Promise.all([
        api.get('/regulations').catch(() => null),
        api.get('/regulations/checklists').catch(() => null),
      ]);
      if (regsRes?.data) setRegulations(regsRes.data?.items || regsRes.data || []);
      if (checkRes?.data) setChecklists(checkRes.data?.items || checkRes.data || []);
      if (!regsRes?.data && !checkRes?.data) throw new Error('No API');
    } catch (error) {
      console.error('Failed to fetch regulations:', error);
      // No fallback to mock data - show empty state instead
      setRegulations([]);
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 篩選法規
  const filteredRegulations = useMemo(() => {
    return regulations.filter(r => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                          r.keywords.some(k => k.includes(search.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [regulations, search, categoryFilter]);

  // 篩選檢查表
  const filteredChecklists = useMemo(() => {
    return checklists.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.project.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || c.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [checklists, search, categoryFilter]);

  // 統計
  const stats = useMemo(() => {
    const completedChecklists = checklists.filter(c => c.status === 'COMPLETED').length;
    const totalItems = checklists.reduce((acc, c) => acc + c.totalItems, 0);
    const completedItems = checklists.reduce((acc, c) => acc + c.completedItems, 0);

    return {
      regulationCount: regulations.length,
      checklistCount: checklists.length,
      completedChecklists,
      complianceRate: Math.round((completedItems / Math.max(totalItems, 1)) * 100),
    };
  }, [regulations, checklists]);

  const getCategoryInfo = (cat) => categories.find(c => c.value === cat) || categories[0];

  const handleDeleteChecklist = async (id) => {
    const confirmed = await confirm({
      title: '刪除檢查表',
      message: '確定要刪除此檢查表嗎？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/regulations/checklists/${id}`);
      addToast?.('檢查表已刪除', 'success');
      fetchData();
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
            <Scale className="text-[#D4AF37]" size={28} />
            法規與合規
          </h1>
          <p className="text-gray-500 mt-1">營建法規查詢與合規檢查表</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增檢查表
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.regulationCount}</div>
          <div className="text-sm text-gray-500">法規資料庫</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.checklistCount}</div>
          <div className="text-sm text-gray-500">檢查表</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completedChecklists}</div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-zinc-700">{stats.complianceRate}%</div>
          <div className="text-sm text-gray-500">合規率</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('regulations')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'regulations' 
              ? 'border-[#D4AF37] text-zinc-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen size={16} className="inline mr-2" />
          法規資料庫
        </button>
        <button
          onClick={() => setActiveTab('checklists')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'checklists' 
              ? 'border-[#D4AF37] text-zinc-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle size={16} className="inline mr-2" />
          合規檢查表
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋法規或關鍵字..."
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

      {/* Content */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : activeTab === 'regulations' ? (
        /* Regulations List */
        filteredRegulations.length === 0 ? (
          <div className="card p-8 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="font-semibold text-gray-700 mb-2">找不到相關法規</h3>
            <p className="text-gray-500">請嘗試其他搜尋關鍵字</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegulations.map(reg => {
              const catInfo = getCategoryInfo(reg.category);
              return (
                <div key={reg.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{reg.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-${catInfo.color}-100 text-${catInfo.color}-700`}>
                          {catInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{reg.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>版本: {reg.version}</span>
                        <span>最後審閱: {reg.lastReviewed}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {reg.keywords.map((kw, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a
                      href={reg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Checklists */
        filteredChecklists.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="font-semibold text-gray-700 mb-2">尚無檢查表</h3>
            <p className="text-gray-500 mb-4">建立合規檢查表開始追蹤</p>
            <button className="btn-primary">新增檢查表</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChecklists.map(cl => {
              const catInfo = getCategoryInfo(cl.category);
              const progress = Math.round((cl.completedItems / cl.totalItems) * 100);
              return (
                <div key={cl.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{cl.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-${catInfo.color}-100 text-${catInfo.color}-700`}>
                          {catInfo.label}
                        </span>
                        {cl.status === 'COMPLETED' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已完成</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">進行中</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{cl.project}</div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>{cl.completedItems}/{cl.totalItems} 項目</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <Clock size={12} className="inline mr-1" />
                          {cl.lastChecked}
                        </div>
                      </div>
                    </div>
                    <button className="btn-secondary text-sm ml-4">
                      檢視
                    </button>
                    <button
                      onClick={() => setEditingChecklist(cl)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ml-2"
                      title="編輯"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteChecklist(cl.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add Modal - Enhanced Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Scale size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">新增檢查表</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = {
                  title: fd.get('title'),
                  category: fd.get('category'),
                  project: fd.get('project'),
                  totalItems: parseInt(fd.get('totalItems') || '10'),
                  completedItems: 0,
                  status: 'IN_PROGRESS',
                };
                try {
                  await api.post('/regulations/checklists', data);
                  addToast?.('檢查表建立成功', 'success');
                  setShowAddModal(false);
                } catch (error) {
                  addToast?.('建立失敗: ' + (error.response?.data?.message || error.message), 'error');
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  檢查表標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="營造工地安全衛生自主檢查表"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  法規類別 <span className="text-red-500">*</span>
                </label>
                <select name="category" required className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  所屬專案 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="project"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="信義豪宅案"
                />
              </div>

              {/* Total Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  檢查項目數
                </label>
                <input
                  type="number"
                  name="totalItems"
                  defaultValue="10"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-zinc-700 to-blue-600 text-white rounded-lg hover:from-zinc-800 hover:to-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  建立檢查表
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Checklist Modal */}
      {editingChecklist && (
        <EditChecklistModal
          checklist={editingChecklist}
          categories={categories}
          onClose={() => setEditingChecklist(null)}
          onSuccess={() => {
            setEditingChecklist(null);
            fetchData();
            addToast?.('檢查表已更新', 'success');
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Regulations;
