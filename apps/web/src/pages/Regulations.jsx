import React, { useState, useEffect, useMemo } from 'react';
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
  X
} from 'lucide-react';

export const Regulations = ({ addToast }) => {
  const [regulations, setRegulations] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('regulations'); // 'regulations' | 'checklists'

  // 法規類別
  const categories = [
    { value: 'BUILDING', label: '建築技術規則', color: 'blue' },
    { value: 'SAFETY', label: '職業安全衛生', color: 'orange' },
    { value: 'ENVIRONMENT', label: '環境保護', color: 'green' },
    { value: 'FIRE', label: '消防法規', color: 'red' },
    { value: 'LABOR', label: '勞動法規', color: 'purple' },
    { value: 'CONTRACT', label: '營建法規', color: 'indigo' },
  ];

  // Mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRegulations([
        {
          id: '1',
          title: '建築技術規則建築設計施工編',
          category: 'BUILDING',
          version: '111.10.07',
          summary: '建築物設計、施工相關技術規範',
          applicableTo: ['設計', '施工'],
          lastReviewed: '2026-01-15',
          link: 'https://law.moj.gov.tw/',
          keywords: ['樓地板', '淨高', '樓梯', '消防'],
        },
        {
          id: '2',
          title: '職業安全衛生設施規則',
          category: 'SAFETY',
          version: '112.08.15',
          summary: '營造工地安全設施、防護措施規範',
          applicableTo: ['施工', '安全'],
          lastReviewed: '2026-01-20',
          link: 'https://law.moj.gov.tw/',
          keywords: ['護欄', '安全網', '開口', '墜落'],
        },
        {
          id: '3',
          title: '營建工程空氣污染防制設施管理辦法',
          category: 'ENVIRONMENT',
          version: '110.03.25',
          summary: '營建工地空污防制措施',
          applicableTo: ['施工'],
          lastReviewed: '2025-12-10',
          link: 'https://law.moj.gov.tw/',
          keywords: ['揚塵', '洗車台', '覆蓋'],
        },
        {
          id: '4',
          title: '各類場所消防安全設備設置標準',
          category: 'FIRE',
          version: '111.12.20',
          summary: '消防設備設置規範',
          applicableTo: ['設計', '施工'],
          lastReviewed: '2026-01-05',
          link: 'https://law.moj.gov.tw/',
          keywords: ['滅火器', '警報', '避難', '消防栓'],
        },
      ]);

      setChecklists([
        {
          id: '1',
          title: '營造工地安全衛生自主檢查表',
          category: 'SAFETY',
          project: '信義豪宅案',
          totalItems: 25,
          completedItems: 22,
          lastChecked: '2026-02-01',
          status: 'IN_PROGRESS',
        },
        {
          id: '2',
          title: '建築結構施工查核表',
          category: 'BUILDING',
          project: '信義豪宅案',
          totalItems: 18,
          completedItems: 18,
          lastChecked: '2026-01-28',
          status: 'COMPLETED',
        },
        {
          id: '3',
          title: '空污防制設施檢查表',
          category: 'ENVIRONMENT',
          project: '大同商辦案',
          totalItems: 12,
          completedItems: 8,
          lastChecked: '2026-01-30',
          status: 'IN_PROGRESS',
        },
      ]);

      setLoading(false);
    }, 300);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="text-indigo-500" size={28} />
            法規與合規
          </h1>
          <p className="text-gray-500 mt-1">營建法規查詢與合規檢查表</p>
        </div>
        <button 
          onClick={() => addToast?.('功能開發中', 'info')}
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
          <div className="text-2xl font-bold text-purple-600">{stats.complianceRate}%</div>
          <div className="text-sm text-gray-500">合規率</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('regulations')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'regulations' 
              ? 'border-indigo-500 text-indigo-600' 
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
              ? 'border-indigo-500 text-indigo-600' 
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
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default Regulations;
