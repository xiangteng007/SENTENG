import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Filter, Calendar, FileText, DollarSign, Briefcase, Users, TrendingUp, PieChart, Loader2, Check } from 'lucide-react';

// 報表定義
const REPORT_TEMPLATES = {
  financial: {
    label: '財務報表',
    icon: DollarSign,
    color: 'from-green-400 to-green-600',
    reports: [
      { id: 'profit_loss', name: '損益表', description: '專案收入、成本與利潤分析' },
      { id: 'cash_flow', name: '現金流量表', description: '資金進出與餘額變化' },
      { id: 'ar_aging', name: '應收帳款帳齡', description: '客戶應收款項與逾期分析' },
      { id: 'ap_aging', name: '應付帳款帳齡', description: '廠商應付款項與到期日' },
      { id: 'tax_summary', name: '稅務彙總表', description: '營業稅、扣繳稅額統計' },
    ]
  },
  project: {
    label: '專案報表',
    icon: Briefcase,
    color: 'from-blue-400 to-blue-600',
    reports: [
      { id: 'project_status', name: '專案進度總覽', description: '各專案完成率與里程碑' },
      { id: 'cost_tracking', name: '成本追蹤表', description: '預算與實際成本對比' },
      { id: 'change_order', name: '變更單統計', description: '變更金額與影響分析' },
    ]
  },
  vendor: {
    label: '廠商報表',
    icon: Users,
    color: 'from-orange-400 to-orange-600',
    reports: [
      { id: 'vendor_payment', name: '廠商付款明細', description: '各廠商請款與付款記錄' },
      { id: 'vendor_rating', name: '廠商評價報表', description: '品質、時效與配合度評分' },
    ]
  },
  analytics: {
    label: '分析報表',
    icon: TrendingUp,
    color: 'from-purple-400 to-purple-600',
    reports: [
      { id: 'monthly_trend', name: '月度趨勢分析', description: '收入、成本月度變化趨勢' },
      { id: 'profitability', name: '獲利能力分析', description: '專案類型與客戶獲利比較' },
      { id: 'resource_util', name: '資源使用率', description: '人力、材料使用效率分析' },
    ]
  },
};

// 報表卡片
const ReportCard = ({ report, onGenerate, generating }) => (
  <div className="card p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h4 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
          {report.name}
        </h4>
        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
      </div>
      <button
        onClick={() => onGenerate(report)}
        disabled={generating === report.id}
        className="btn-secondary p-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {generating === report.id ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
      </button>
    </div>
  </div>
);

// 分類區塊
const CategorySection = ({ category, data, onGenerate, generating }) => {
  const Icon = data.icon;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${data.color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{data.label}</h3>
          <p className="text-sm text-gray-500">{data.reports.length} 種報表</p>
        </div>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.reports.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            onGenerate={onGenerate}
            generating={generating}
          />
        ))}
      </div>
    </div>
  );
};

export const Reports = ({ addToast }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [generating, setGenerating] = useState(null);
  const [generatedReports, setGeneratedReports] = useState([]);

  const handleGenerate = async (report) => {
    setGenerating(report.id);
    
    // 模擬生成報表
    await new Promise(r => setTimeout(r, 1500));
    
    const generated = {
      ...report,
      generatedAt: new Date().toISOString(),
      dateRange,
      fileUrl: '#', // 實際會是真正的下載連結
    };
    
    setGeneratedReports(prev => [generated, ...prev]);
    setGenerating(null);
    addToast?.(`${report.name} 已生成`, 'success');
  };

  const filteredCategories = useMemo(() => {
    if (activeCategory === 'all') return Object.entries(REPORT_TEMPLATES);
    return Object.entries(REPORT_TEMPLATES).filter(([key]) => key === activeCategory);
  }, [activeCategory]);

  const totalReports = Object.values(REPORT_TEMPLATES).reduce(
    (sum, cat) => sum + cat.reports.length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">報表中心</h1>
          <p className="text-gray-500 mt-1">產生和下載各類業務報表</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border-none focus:ring-0 text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border-none focus:ring-0 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
          <p className="text-sm text-gray-500">可用報表</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{generatedReports.length}</p>
          <p className="text-sm text-gray-500">已生成</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {Object.keys(REPORT_TEMPLATES).length}
          </p>
          <p className="text-sm text-gray-500">報表類別</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {generatedReports.filter(r => 
              new Date(r.generatedAt).toDateString() === new Date().toDateString()
            ).length}
          </p>
          <p className="text-sm text-gray-500">今日生成</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeCategory === 'all' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部 ({totalReports})
        </button>
        {Object.entries(REPORT_TEMPLATES).map(([key, { label, reports }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeCategory === key 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({reports.length})
          </button>
        ))}
      </div>

      {/* Report Categories */}
      <div className="space-y-8">
        {filteredCategories.map(([key, data]) => (
          <CategorySection
            key={key}
            category={key}
            data={data}
            onGenerate={handleGenerate}
            generating={generating}
          />
        ))}
      </div>

      {/* Recently Generated */}
      {generatedReports.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Check size={18} className="text-green-500" />
            最近生成的報表
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {generatedReports.slice(0, 6).map((report, i) => (
              <div key={i} className="card p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{report.name}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(report.generatedAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <button className="btn-primary py-1 px-3 text-sm">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
