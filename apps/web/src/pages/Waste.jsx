import { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, 
  Plus, 
  Search, 
  Truck, 
  Scale, 
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  Recycle,
  ChevronDown,
  X,
  AlertCircle,
  Edit2,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import { useConfirm } from '../components/common/ConfirmModal';

// Edit Waste Modal Component
const EditWasteModal = ({ record, wasteTypes, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    wasteType: record?.wasteType || record?.type || 'general',
    quantity: record?.quantity || '',
    disposerName: record?.disposerName || '',
    disposalFacility: record?.disposalFacility || '',
    isRecyclable: record?.isRecyclable ?? true,
    notes: record?.notes || '',
    status: record?.status || 'PENDING',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? e.target.checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.patch(`/waste/records/${record.id}`, {
        ...formData,
        quantity: parseFloat(formData.quantity),
        isRecyclable: formData.isRecyclable === 'true' || formData.isRecyclable === true,
      });
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
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Recycle size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">編輯清運單</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">廢棄物類型</label>
              <select
                name="wasteType"
                value={formData.wasteType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {wasteTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">數量</label>
              <input
                type="number"
                name="quantity"
                step="0.1"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="PENDING">待處理</option>
                <option value="IN_TRANSIT">運送中</option>
                <option value="COMPLETED">已完成</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">可回收</label>
              <select
                name="isRecyclable"
                value={String(formData.isRecyclable)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">清運公司</label>
            <input
              type="text"
              name="disposerName"
              value={formData.disposerName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">處理設施</label>
            <input
              type="text"
              name="disposalFacility"
              value={formData.disposalFacility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? '更新中...' : <>
                <CheckCircle className="w-4 h-4" />
                儲存變更
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Waste = ({ addToast }) => {
  const [records, setRecords] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // 廢棄物類型
  const wasteTypes = [
    { value: 'concrete', label: '混凝土', color: 'gray', unit: '噸', code: 'D-0501' },
    { value: 'metal', label: '金屬', color: 'blue', unit: '噸', code: 'R-0301' },
    { value: 'wood', label: '木材', color: 'amber', unit: '噸', code: 'D-0601' },
    { value: 'soil', label: '土方', color: 'orange', unit: '立方米', code: 'D-0401' },
    { value: 'hazardous', label: '有害廢棄物', color: 'red', unit: '公斤', code: 'A-0101' },
    { value: 'general', label: '一般廢棄物', color: 'green', unit: '噸', code: 'D-0299' },
  ];

  // Fetch projects
  useEffect(() => {
    api.get('/projects').then(res => {
      const items = res.data?.items || res.data || [];
      setProjects(items);
      if (items.length > 0 && !selectedProjectId) {
        setSelectedProjectId(items[0].id);
      }
    }).catch(console.error);
  }, []);

  // Fetch waste records
  const fetchRecords = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const res = await api.get(`/waste/records?projectId=${selectedProjectId}`);
      setRecords(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch waste records:', error);
      // No fallback to mock data - show empty state instead
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedProjectId]);

  // 篩選
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const projectName = r.project?.name || '';
      const disposerName = r.disposerName || '';
      const manifestNumber = r.manifestNumber || '';
      const matchSearch = manifestNumber.toLowerCase().includes(search.toLowerCase()) ||
                          projectName.toLowerCase().includes(search.toLowerCase()) ||
                          disposerName.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || r.wasteType === typeFilter;
      return matchSearch && matchType;
    });
  }, [records, search, typeFilter]);

  // 統計
  const stats = useMemo(() => {
    const byType = {};
    wasteTypes.forEach(t => { byType[t.value] = 0; });
    records.forEach(r => {
      if (byType[r.wasteType] !== undefined) byType[r.wasteType] += (r.quantity || 0);
    });

    return {
      total: records.length,
      completed: records.filter(r => r.status === 'disposed' || r.status === 'recycled').length,
      inTransit: records.filter(r => r.status === 'transported').length,
      recycledCount: records.filter(r => r.isRecyclable).length,
      recycleRate: Math.round((records.filter(r => r.isRecyclable).length / Math.max(records.length, 1)) * 100),
      byType,
    };
  }, [records]);

  const getTypeInfo = (type) => wasteTypes.find(t => t.value === type) || wasteTypes[5];

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: '刪除清運單',
      message: '確定要刪除此清運紀錄嗎？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/waste/records/${id}`);
      addToast?.('清運單已刪除', 'success');
      fetchRecords();
    } catch (error) {
      addToast?.('刪除失敗: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已完成</span>;
      case 'IN_TRANSIT':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">運送中</span>;
      case 'PENDING':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">待處理</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trash2 className="text-green-500" size={28} />
            廢棄物管理
          </h1>
          <p className="text-gray-500 mt-1">營建廢棄物清運與資源回收追蹤</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增清運單
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">清運紀錄</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
          <div className="text-sm text-gray-500">運送中</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.recycleRate}%</div>
          <div className="text-sm text-gray-500">回收率</div>
        </div>
        <div className="card p-4 text-center">
          <Recycle className="mx-auto text-green-600 mb-1" size={24} />
          <div className="text-sm text-gray-500">{stats.recycledCount} 筆已回收</div>
        </div>
      </div>

      {/* Type Summary */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-700 mb-3">廢棄物分類統計</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {wasteTypes.map(type => (
            <div key={type.value} className={`p-3 rounded-lg bg-${type.color}-50 text-center`}>
              <div className={`text-lg font-bold text-${type.color}-600`}>
                {stats.byType[type.value]?.toFixed(1) || 0}
              </div>
              <div className="text-xs text-gray-600">{type.label} ({type.unit})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋清運單號、專案..."
            className="input pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input min-w-[150px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">所有類型</option>
          {wasteTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="card p-8 text-center">
          <Trash2 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="font-semibold text-gray-700 mb-2">尚無清運紀錄</h3>
          <p className="text-gray-500 mb-4">新增清運單開始追蹤</p>
          <button className="btn-primary">新增清運單</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(record => {
            const typeInfo = getTypeInfo(record.type);
            return (
              <div key={record.id} className="card overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center`}>
                        <Scale className={`text-${typeInfo.color}-600`} size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{record.manifestNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                            {typeInfo.label}
                          </span>
                          {getStatusBadge(record.status)}
                          {record.recycled && (
                            <Recycle size={14} className="text-green-500" />
                          )}
                          {record.type === 'HAZARDOUS' && (
                            <AlertTriangle size={14} className="text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                          <span>{record.project}</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {record.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{record.quantity}</div>
                        <div className="text-xs text-gray-500">{typeInfo.unit}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingRecord(record); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編輯"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${expandedRecord === record.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {expandedRecord === record.id && (
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">清運公司</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Truck size={14} />
                          {record.hauler}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">目的地</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <MapPin size={14} />
                          {record.destination}
                        </p>
                      </div>
                      {record.hazardousInfo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">有害物質說明</p>
                          <p className="text-sm font-medium text-red-600">{record.hazardousInfo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal - Enhanced Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Recycle size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">新增清運單</h2>
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
                  projectId: selectedProjectId,
                  wasteType: fd.get('wasteType'),
                  wasteCode: wasteTypes.find(t => t.value === fd.get('wasteType'))?.code || 'D-0299',
                  wasteDate: fd.get('wasteDate'),
                  quantity: parseFloat(fd.get('quantity')),
                  unit: fd.get('unit') || 'ton',
                  disposerName: fd.get('disposerName'),
                  disposalFacility: fd.get('disposalFacility'),
                  isRecyclable: fd.get('isRecyclable') === 'true',
                  notes: fd.get('notes'),
                };
                try {
                  await api.post('/waste/records', data);
                  addToast?.('清運單建立成功', 'success');
                  setShowAddModal(false);
                  fetchRecords();
                } catch (error) {
                  addToast?.('建立失敗: ' + (error.response?.data?.message || error.message), 'error');
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Project Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">專案</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.title}</option>
                  ))}
                </select>
              </div>

              {/* Waste Type & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    廢棄物類型 <span className="text-red-500">*</span>
                  </label>
                  <select name="wasteType" required className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    {wasteTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label} ({t.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    數量 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="quantity"
                      step="0.1"
                      required
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="0.0"
                    />
                    <select name="unit" className="w-24 px-2 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                      <option value="ton">噸</option>
                      <option value="cubic_meter">立方米</option>
                      <option value="kg">公斤</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date & Recyclable */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    清運日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="wasteDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">可回收</label>
                  <select name="isRecyclable" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <option value="true">是</option>
                    <option value="false">否</option>
                  </select>
                </div>
              </div>

              {/* Disposer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">清運公司</label>
                  <input
                    type="text"
                    name="disposerName"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="環保運輸公司"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">處理設施</label>
                  <input
                    type="text"
                    name="disposalFacility"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="土資場 / 回收廠"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">備註</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                  placeholder="其他說明..."
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
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  建立清運單
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <EditWasteModal
          record={editingRecord}
          wasteTypes={wasteTypes}
          onClose={() => setEditingRecord(null)}
          onSuccess={() => {
            setEditingRecord(null);
            fetchRecords();
            addToast?.('清運單已更新', 'success');
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Waste;
