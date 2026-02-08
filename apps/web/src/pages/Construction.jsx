import { useState, useEffect, useMemo } from 'react';
import { 
  Construction as ConstructionIcon, 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  Edit2, 
  Trash2, 
  ChevronDown,
  BarChart3,
  Users,
  FileText,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { useConfirm } from '../components/common/ConfirmModal';

export const Construction = ({ addToast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // 施工類型選項
  const constructionTypes = [
    { value: 'STRUCTURE', label: '結構工程', color: 'blue' },
    { value: 'MEP', label: '機電工程', color: 'orange' },
    { value: 'INTERIOR', label: '室內裝修', color: 'purple' },
    { value: 'EXTERIOR', label: '外觀工程', color: 'green' },
    { value: 'LANDSCAPE', label: '景觀工程', color: 'emerald' },
    { value: 'OTHER', label: '其他', color: 'gray' },
  ];

  // 狀態選項
  const statusTypes = [
    { value: 'NOT_STARTED', label: '未開始', color: 'gray' },
    { value: 'IN_PROGRESS', label: '進行中', color: 'blue' },
    { value: 'ON_HOLD', label: '暫停', color: 'orange' },
    { value: 'COMPLETED', label: '已完成', color: 'green' },
    { value: 'DELAYED', label: '延遲', color: 'red' },
  ];

  // Fetch data
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/construction/items');
      setItems(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch construction items:', error);
      // No fallback to mock data - show empty state instead
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 篩選邏輯
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.projectName?.toLowerCase().includes(search.toLowerCase()) ||
                          item.location?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchType = typeFilter === 'all' || item.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [items, search, statusFilter, typeFilter]);

  // 統計資料
  const stats = useMemo(() => {
    return {
      total: items.length,
      completed: items.filter(i => i.status === 'COMPLETED').length,
      inProgress: items.filter(i => i.status === 'IN_PROGRESS').length,
      delayed: items.filter(i => i.status === 'DELAYED').length,
      avgProgress: Math.round(items.reduce((acc, i) => acc + (i.percentComplete || 0), 0) / Math.max(items.length, 1)),
      totalPunchList: items.reduce((acc, i) => acc + (i.punchListCount || 0), 0),
    };
  }, [items]);

  // CRUD 操作
  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        await api.put(`/construction/items/${editingItem.id}`, formData).catch(() => {});
        setItems(prev => prev.map(item => 
          item.id === editingItem.id ? { ...item, ...formData } : item
        ));
        addToast?.('施工項目已更新', 'success');
      } else {
        const res = await api.post('/construction/items', formData).catch(() => null);
        const newItem = {
          id: res?.data?.id || `new-${Date.now()}`,
          ...formData,
          punchListCount: 0,
        };
        setItems(prev => [newItem, ...prev]);
        addToast?.('施工項目已新增', 'success');
      }
    } catch (error) {
      addToast?.('操作失敗', 'error');
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: '確認刪除',
      message: '確定要刪除此施工項目？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
    });
    if (confirmed) {
      await api.delete(`/construction/items/${id}`).catch(() => {});
      setItems(prev => prev.filter(item => item.id !== id));
      addToast?.('施工項目已刪除', 'info');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const getTypeInfo = (type) => constructionTypes.find(t => t.value === type) || constructionTypes[5];
  const getStatusInfo = (status) => statusTypes.find(s => s.value === status) || statusTypes[0];

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 70) return 'bg-blue-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ConstructionIcon className="text-orange-500" size={28} />
            施工管理
          </h1>
          <p className="text-gray-500 mt-1">追蹤施工進度和品質管控</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增施工項目
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">總項目</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-500">進行中</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
          <div className="text-sm text-gray-500">延遲</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-zinc-700">{stats.avgProgress}%</div>
          <div className="text-sm text-gray-500">平均進度</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.totalPunchList}</div>
          <div className="text-sm text-gray-500">待處理缺失</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋施工項目、專案、位置..."
            className="input pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input min-w-[150px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">所有狀態</option>
          {statusTypes.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          className="input min-w-[150px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">所有類型</option>
          {constructionTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-8 text-center">
          <ConstructionIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="font-semibold text-gray-700 mb-2">尚無施工項目</h3>
          <p className="text-gray-500 mb-4">建立施工項目來追蹤進度和品質</p>
          <button 
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="btn-primary"
          >
            新增項目
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const typeInfo = getTypeInfo(item.type);
            const statusInfo = getStatusInfo(item.status);
            return (
              <div key={item.id} className="card overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <ConstructionIcon className={`text-${typeInfo.color}-600`} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                            {typeInfo.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {item.projectName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {item.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {item.assignedTeam}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">{item.percentComplete}%</div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(item.percentComplete)}`}
                            style={{ width: `${item.percentComplete}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronDown
                          size={18}
                          className={`text-gray-400 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedItem === item.id && (
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">計劃期間</p>
                        <p className="text-sm font-medium">{item.plannedStart} ~ {item.plannedEnd}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">實際開始</p>
                        <p className="text-sm font-medium">{item.actualStart || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">實際完成</p>
                        <p className="text-sm font-medium">{item.actualEnd || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">待處理缺失</p>
                        <p className={`text-sm font-medium ${item.punchListCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {item.punchListCount} 項
                        </p>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-1">備註</p>
                        <p className="text-sm text-gray-700">{item.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ConstructionModal
          item={editingItem}
          constructionTypes={constructionTypes}
          statusTypes={statusTypes}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

// Modal Component - Enhanced Design
const ConstructionModal = ({ item, constructionTypes, statusTypes, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    type: item?.type || 'STRUCTURE',
    status: item?.status || 'NOT_STARTED',
    projectName: item?.projectName || '',
    location: item?.location || '',
    plannedStart: item?.plannedStart || '',
    plannedEnd: item?.plannedEnd || '',
    actualStart: item?.actualStart || '',
    actualEnd: item?.actualEnd || '',
    percentComplete: item?.percentComplete || 0,
    assignedTeam: item?.assignedTeam || '',
    notes: item?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.projectName) {
      alert('請填寫必填欄位');
      return;
    }
    onSave(formData);
  };

  const getTypeColor = (type) => {
    const colors = {
      STRUCTURE: 'bg-blue-100 text-blue-700 ring-blue-500',
      MEP: 'bg-orange-100 text-orange-700 ring-orange-500',
      INTERIOR: 'bg-purple-100 text-purple-700 ring-purple-500',
      EXTERIOR: 'bg-green-100 text-green-700 ring-green-500',
      LANDSCAPE: 'bg-emerald-100 text-emerald-700 ring-emerald-500',
      OTHER: 'bg-gray-100 text-gray-700 ring-gray-500',
    };
    return colors[type] || colors.OTHER;
  };

  const getStatusColor = (status) => {
    const colors = {
      NOT_STARTED: 'bg-gray-100 text-gray-700 ring-gray-500',
      IN_PROGRESS: 'bg-blue-100 text-blue-700 ring-blue-500',
      ON_HOLD: 'bg-orange-100 text-orange-700 ring-orange-500',
      COMPLETED: 'bg-green-100 text-green-700 ring-green-500',
      DELAYED: 'bg-red-100 text-red-700 ring-red-500',
    };
    return colors[status] || colors.NOT_STARTED;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <ConstructionIcon size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {item ? '編輯施工項目' : '新增施工項目'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              項目名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="輸入施工項目名稱"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Type - Visual Pills */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">工程類型</label>
            <div className="grid grid-cols-3 gap-2">
              {constructionTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.value })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    formData.type === t.value
                      ? 'ring-2 ring-offset-2 ' + getTypeColor(t.value)
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status - Visual Pills */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">進度狀態</label>
            <div className="grid grid-cols-5 gap-2">
              {statusTypes.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: s.value })}
                  className={`px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                    formData.status === s.value
                      ? 'ring-2 ring-offset-1 ' + getStatusColor(s.value)
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText size={14} className="text-gray-400" />
                所屬專案 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="專案名稱"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin size={14} className="text-gray-400" />
                施工位置
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="例：1F 大廳、B2 機房"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar size={14} className="text-gray-400" />
                計劃開始
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.plannedStart}
                onChange={(e) => setFormData({ ...formData, plannedStart: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar size={14} className="text-gray-400" />
                計劃完成
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={formData.plannedEnd}
                onChange={(e) => setFormData({ ...formData, plannedEnd: e.target.value })}
              />
            </div>
          </div>

          {/* Team & Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users size={14} className="text-gray-400" />
                施工團隊
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="例：A班組、王師傅團隊"
                value={formData.assignedTeam}
                onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <BarChart3 size={14} className="text-gray-400" />
                完成進度
                <span className="ml-auto text-orange-600 font-bold">{formData.percentComplete}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                value={formData.percentComplete}
                onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) || 0 })}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">備註說明</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none h-24"
              placeholder="施工注意事項、材料需求等..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Button Area */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-orange-500/25"
            >
              <CheckCircle size={18} />
              儲存項目
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Construction;
