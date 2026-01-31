import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Calendar, DollarSign, Building2, FileText, CheckCircle, Clock, AlertCircle, X, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-700', icon: FileText },
  PENDING: { label: '待審核', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: '已核准', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  ORDERED: { label: '已訂購', color: 'bg-purple-100 text-purple-700', icon: Truck },
  RECEIVED: { label: '已收貨', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const Procurements = () => {
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchProcurements();
  }, [statusFilter]);

  const fetchProcurements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/procurements?${params.toString()}`);
      setProcurements(response.data.items || response.data || []);
    } catch (error) {
      console.error('Failed to fetch procurements:', error);
      setProcurements([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProcurements = procurements.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">採購管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理專案採購訂單與供應商交易</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          新增採購單
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '總採購單', value: procurements.length, icon: FileText, color: 'blue' },
          { label: '待審核', value: procurements.filter(p => p.status === 'PENDING').length, icon: Clock, color: 'yellow' },
          { label: '進行中', value: procurements.filter(p => ['APPROVED', 'ORDERED'].includes(p.status)).length, icon: Truck, color: 'purple' },
          { label: '已完成', value: procurements.filter(p => p.status === 'RECEIVED').length, icon: CheckCircle, color: 'green' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋採購單..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有狀態</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProcurements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p>尚無採購記錄</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">採購單號</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">標題</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">供應商</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">預計交貨</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredProcurements.map((procurement) => (
                <React.Fragment key={procurement.id}>
                  <tr 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === procurement.id ? null : procurement.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {expandedRow === procurement.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className="font-mono text-sm">{procurement.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{procurement.title || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {procurement.vendorName || procurement.vendor?.name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{formatCurrency(procurement.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(procurement.expectedDeliveryDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={procurement.status} /></td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        查看詳情
                      </button>
                    </td>
                  </tr>
                  {expandedRow === procurement.id && (
                    <tr className="bg-gray-50 dark:bg-gray-800/30">
                      <td colSpan="7" className="px-8 py-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">專案：</span>
                            <span className="ml-2 font-medium">{procurement.projectName || procurement.project?.name || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">建立日期：</span>
                            <span className="ml-2">{formatDate(procurement.createdAt)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">備註：</span>
                            <span className="ml-2">{procurement.notes || '-'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">新增採購單</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-center py-12">採購單建立功能開發中...</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Procurements;
