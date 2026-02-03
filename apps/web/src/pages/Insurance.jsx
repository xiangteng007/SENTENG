import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Edit2,
  Trash2,
  ChevronDown,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useConfirm } from '../components/common/ConfirmModal';

// Edit Insurance Modal Component
const EditInsuranceModal = ({ policy, insuranceTypes, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: policy?.type || 'CAR',
    policyNumber: policy?.policyNumber || '',
    insurer: policy?.insurer || '',
    coverageAmount: policy?.coverageAmount || '',
    premium: policy?.premium || '',
    startDate: policy?.startDate?.split('T')[0] || '',
    endDate: policy?.endDate?.split('T')[0] || '',
    beneficiary: policy?.beneficiary || '',
    deductible: policy?.deductible || 0,
    status: policy?.status || 'ACTIVE',
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
      await api.patch(`/insurance/policies/${policy.id}`, {
        ...formData,
        coverageAmount: parseFloat(formData.coverageAmount),
        premium: parseFloat(formData.premium),
        deductible: parseFloat(formData.deductible || 0),
      });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || '更新失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">編輯保單</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">險種類型</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                {insuranceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="ACTIVE">生效中</option>
                <option value="EXPIRING_SOON">即將到期</option>
                <option value="EXPIRED">已到期</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">保險公司</label>
              <input type="text" name="insurer" value={formData.insurer} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">受益人</label>
              <input type="text" name="beneficiary" value={formData.beneficiary} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">保額 (TWD)</label>
              <input type="number" name="coverageAmount" value={formData.coverageAmount} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">保費 (TWD)</label>
              <input type="number" name="premium" value={formData.premium} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">生效日期</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">到期日期</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
              {loading ? '更新中...' : <><CheckCircle className="w-4 h-4" /> 儲存變更</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Insurance = ({ addToast }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // 保險類型
  const insuranceTypes = [
    { value: 'CAR', label: '營造綜合保險', color: 'blue' },
    { value: 'LIABILITY', label: '第三人責任險', color: 'green' },
    { value: 'WORKER', label: '團體意外險', color: 'orange' },
    { value: 'EQUIPMENT', label: '機具設備險', color: 'purple' },
    { value: 'BOND', label: '履約保證金', color: 'indigo' },
    { value: 'PROFESSIONAL', label: '專業責任險', color: 'red' },
  ];

  // Fetch policies
  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/insurance/policies');
      setPolicies(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch insurance policies:', error);
      // Fallback to mock data if API not available
      setPolicies([
        {
          id: '1',
          policyNumber: 'CAR-2026-0001',
          type: 'CAR',
          project: '信義豪宅案',
          insurer: '國泰產險',
          coverageAmount: 500000000,
          premium: 1250000,
          startDate: '2026-01-01',
          endDate: '2027-12-31',
          status: 'ACTIVE',
          deductible: 500000,
          beneficiary: '森騰營造股份有限公司',
        },
        {
          id: '2',
          policyNumber: 'LIA-2026-0001',
          type: 'LIABILITY',
          project: '信義豪宅案',
          insurer: '富邦產險',
          coverageAmount: 100000000,
          premium: 280000,
          startDate: '2026-01-01',
          endDate: '2027-12-31',
          status: 'ACTIVE',
          deductible: 100000,
          beneficiary: '第三人',
        },
        {
          id: '3',
          policyNumber: 'WKR-2026-0001',
          type: 'WORKER',
          project: '全案適用',
          insurer: '新光產險',
          coverageAmount: 30000000,
          premium: 420000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: 'ACTIVE',
          deductible: 0,
          beneficiary: '員工/工人',
        },
        {
          id: '4',
          policyNumber: 'BOND-2026-0001',
          type: 'BOND',
          project: '大同商辦案',
          insurer: '台灣產險',
          coverageAmount: 50000000,
          premium: 125000,
          startDate: '2025-06-01',
          endDate: '2026-06-30',
          status: 'EXPIRING_SOON',
          beneficiary: '業主',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // 篩選
  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchSearch = p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
                          p.project.toLowerCase().includes(search.toLowerCase()) ||
                          p.insurer.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [policies, search, typeFilter]);

  // 統計
  const stats = useMemo(() => {
    return {
      total: policies.length,
      active: policies.filter(p => p.status === 'ACTIVE').length,
      expiringSoon: policies.filter(p => p.status === 'EXPIRING_SOON').length,
      totalCoverage: policies.reduce((acc, p) => acc + p.coverageAmount, 0),
      totalPremium: policies.reduce((acc, p) => acc + p.premium, 0),
    };
  }, [policies]);

  const getTypeInfo = (type) => insuranceTypes.find(t => t.value === type) || insuranceTypes[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">生效中</span>;
      case 'EXPIRING_SOON':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">即將到期</span>;
      case 'EXPIRED':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">已到期</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: '刪除保單',
      message: '確定要刪除此保單嗎？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/insurance/policies/${id}`);
      addToast?.('保單已刪除', 'success');
      fetchPolicies();
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
            <Shield className="text-blue-500" size={28} />
            保險管理
          </h1>
          <p className="text-gray-500 mt-1">營造保險與保證金追蹤</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增保單
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">保單總數</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">生效中</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
          <div className="text-sm text-gray-500">即將到期</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalCoverage)}</div>
          <div className="text-sm text-gray-500">總保額</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalPremium)}</div>
          <div className="text-sm text-gray-500">年度保費</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋保單號碼、專案、保險公司..."
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
          {insuranceTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredPolicies.length === 0 ? (
        <div className="card p-8 text-center">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="font-semibold text-gray-700 mb-2">尚無保險資料</h3>
          <p className="text-gray-500 mb-4">新增保單開始追蹤</p>
          <button className="btn-primary">新增保單</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolicies.map(policy => {
            const typeInfo = getTypeInfo(policy.type);
            return (
              <div key={policy.id} className="card overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <Shield className={`text-${typeInfo.color}-600`} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{policy.policyNumber}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                            {typeInfo.label}
                          </span>
                          {getStatusBadge(policy.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {policy.project}
                          </span>
                          <span>{policy.insurer}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{formatCurrency(policy.coverageAmount)}</div>
                        <div className="text-xs text-gray-500">保額</div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${expandedPolicy === policy.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedPolicy === policy.id && (
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">保險期間</p>
                        <p className="text-sm font-medium">{policy.startDate} ~ {policy.endDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">保費</p>
                        <p className="text-sm font-medium">{formatCurrency(policy.premium)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">自負額</p>
                        <p className="text-sm font-medium">{formatCurrency(policy.deductible || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">受益人</p>
                        <p className="text-sm font-medium">{policy.beneficiary}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingPolicy(policy); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                      >
                        <Edit2 size={14} /> 編輯
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(policy.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                      >
                        <Trash2 size={14} /> 刪除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">新增保單</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = {
                  projectId: fd.get('projectId'),
                  type: fd.get('type'),
                  policyNumber: fd.get('policyNumber'),
                  insurer: fd.get('insurer'),
                  coverageAmount: parseFloat(fd.get('coverageAmount')),
                  premium: parseFloat(fd.get('premium')),
                  startDate: fd.get('startDate'),
                  endDate: fd.get('endDate'),
                  beneficiary: fd.get('beneficiary'),
                  deductible: parseFloat(fd.get('deductible') || '0'),
                };
                try {
                  await api.post('/insurance/policies', data);
                  addToast?.('保單建立成功', 'success');
                  setShowAddModal(false);
                } catch (error) {
                  addToast?.('建立失敗: ' + (error.response?.data?.message || error.message), 'error');
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Policy Type & Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    險種類型 <span className="text-red-500">*</span>
                  </label>
                  <select name="type" required className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    {insuranceTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    保單號碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="policyNumber"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="CAR-2026-XXXX"
                  />
                </div>
              </div>

              {/* Insurer & Beneficiary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    保險公司 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="insurer"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="國泰產險"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">受益人</label>
                  <input
                    type="text"
                    name="beneficiary"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="森騰營造股份有限公司"
                  />
                </div>
              </div>

              {/* Coverage & Premium */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    保額 (TWD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="coverageAmount"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="100000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    保費 (TWD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="premium"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="280000"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    生效日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    到期日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Deductible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">自負額 (TWD)</label>
                <input
                  type="number"
                  name="deductible"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="0"
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
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  建立保單
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPolicy && (
        <EditInsuranceModal
          policy={editingPolicy}
          insuranceTypes={insuranceTypes}
          onClose={() => setEditingPolicy(null)}
          onSuccess={() => {
            setEditingPolicy(null);
            fetchPolicies();
            addToast?.('保單已更新', 'success');
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Insurance;
