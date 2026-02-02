import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown
} from 'lucide-react';

export const Waste = ({ addToast }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState(null);

  // 廢棄物類型
  const wasteTypes = [
    { value: 'CONCRETE', label: '混凝土', color: 'gray', unit: '噸' },
    { value: 'METAL', label: '金屬', color: 'blue', unit: '噸' },
    { value: 'WOOD', label: '木材', color: 'amber', unit: '噸' },
    { value: 'SOIL', label: '土方', color: 'orange', unit: '立方米' },
    { value: 'HAZARDOUS', label: '有害廢棄物', color: 'red', unit: '公斤' },
    { value: 'GENERAL', label: '一般廢棄物', color: 'green', unit: '噸' },
  ];

  // Mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRecords([
        {
          id: '1',
          manifestNumber: 'WST-2026-0001',
          project: '信義豪宅案',
          type: 'CONCRETE',
          quantity: 45.5,
          date: '2026-02-01',
          hauler: '環保運輸公司',
          destination: '土資場A',
          status: 'COMPLETED',
          recycled: true,
        },
        {
          id: '2',
          manifestNumber: 'WST-2026-0002',
          project: '信義豪宅案',
          type: 'SOIL',
          quantity: 120,
          date: '2026-02-02',
          hauler: '環保運輸公司',
          destination: '土資場B',
          status: 'IN_TRANSIT',
          recycled: false,
        },
        {
          id: '3',
          manifestNumber: 'WST-2026-0003',
          project: '大同商辦案',
          type: 'METAL',
          quantity: 8.2,
          date: '2026-01-28',
          hauler: '金屬回收商',
          destination: '資源回收廠',
          status: 'COMPLETED',
          recycled: true,
        },
        {
          id: '4',
          manifestNumber: 'WST-2026-0004',
          project: '信義豪宅案',
          type: 'HAZARDOUS',
          quantity: 250,
          date: '2026-01-20',
          hauler: '特殊廢棄物處理公司',
          destination: '焚化廠',
          status: 'COMPLETED',
          recycled: false,
          hazardousInfo: '油漆廢料、溶劑',
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  // 篩選
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = r.manifestNumber.toLowerCase().includes(search.toLowerCase()) ||
                          r.project.toLowerCase().includes(search.toLowerCase()) ||
                          r.hauler.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [records, search, typeFilter]);

  // 統計
  const stats = useMemo(() => {
    const byType = {};
    wasteTypes.forEach(t => { byType[t.value] = 0; });
    records.forEach(r => {
      if (byType[r.type] !== undefined) byType[r.type] += r.quantity;
    });

    return {
      total: records.length,
      completed: records.filter(r => r.status === 'COMPLETED').length,
      inTransit: records.filter(r => r.status === 'IN_TRANSIT').length,
      recycledCount: records.filter(r => r.recycled).length,
      recycleRate: Math.round((records.filter(r => r.recycled).length / Math.max(records.length, 1)) * 100),
      byType,
    };
  }, [records]);

  const getTypeInfo = (type) => wasteTypes.find(t => t.value === type) || wasteTypes[5];

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
          onClick={() => addToast?.('功能開發中', 'info')}
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
          <div className="text-2xl font-bold text-emerald-600">{stats.recycleRate}%</div>
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
    </div>
  );
};

export default Waste;
