/**
 * 利潤分析儀表板 (ProfitAnalysis.jsx)
 * 專案利潤、成本、請款綜合分析
 */

import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle,
    CheckCircle, XCircle, BarChart3, PieChart, ArrowUpRight,
    ArrowDownRight, Minus, Building2, Receipt, FileText, Info
} from 'lucide-react';
import { SectionTitle } from '../components/common/Indicators';
import ProfitAnalysisService, {
    PROFIT_STATUS,
    PROFIT_STATUS_LABELS,
    PROFIT_STATUS_COLORS,
    COST_CATEGORY_LABELS,
} from '../services/ProfitAnalysisService';

// ============================================
// 格式化函數
// ============================================
const formatCurrency = (amount) => {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount?.toLocaleString() || '0';
};

const formatFullCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

// ============================================
// 大型統計卡片
// ============================================
const BigStatCard = ({ icon: Icon, label, value, subValue, trend, color = 'gray' }) => (
    <div className={`bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-white/80 text-sm font-medium">{label}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
                {subValue && <p className="text-white/70 text-sm mt-1">{subValue}</p>}
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
                <Icon size={24} />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center gap-1 text-sm">
                {trend.direction === 'up' ? (
                    <ArrowUpRight size={16} className="text-green-300" />
                ) : trend.direction === 'down' ? (
                    <ArrowDownRight size={16} className="text-red-300" />
                ) : (
                    <Minus size={16} />
                )}
                <span className="text-white/80">
                    {trend.direction === 'up' && '+'}
                    {trend.direction === 'down' && '-'}
                    {trend.value}% 相較上月
                </span>
            </div>
        )}
    </div>
);

// ============================================
// 毛利狀態徽章
// ============================================
const ProfitStatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PROFIT_STATUS_COLORS[status]}`}>
        {PROFIT_STATUS_LABELS[status]}
    </span>
);

// ============================================
// 進度條
// ============================================
const ProgressBar = ({ value, max, color = 'orange' }) => {
    const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
                className={`h-full bg-${color}-500 rounded-full transition-all`}
                style={{ width: `${percent}%` }}
            />
        </div>
    );
};

// ============================================
// 警報列表
// ============================================
const AlertList = ({ alerts }) => {
    if (!alerts?.length) {
        return (
            <div className="text-center py-8 text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>目前無任何警報</p>
            </div>
        );
    }

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return <XCircle size={18} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    const getAlertBg = (type) => {
        switch (type) {
            case 'error': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="space-y-2">
            {alerts.map((alert, i) => (
                <div key={i} className={`p-3 rounded-lg border ${getAlertBg(alert.type)} flex items-start gap-3`}>
                    {getAlertIcon(alert.type)}
                    <div>
                        <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ============================================
// 專案毛利列表
// ============================================
const ProjectProfitList = ({ projects }) => {
    if (!projects?.length) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                <p>尚無進行中的專案</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {projects.slice(0, 5).map(project => (
                <div key={project.contractId} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{project.projectName}</span>
                            <ProfitStatusBadge status={project.status} />
                        </div>
                        <span className={`text-lg font-bold ${parseFloat(project.marginRate) < 10 ? 'text-red-600' :
                                parseFloat(project.marginRate) < 20 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                            {project.marginRate}%
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <span className="text-gray-500">收入</span>
                            <p className="font-medium">{formatFullCurrency(project.revenue)}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">成本</span>
                            <p className="font-medium text-red-600">{formatFullCurrency(project.totalCost)}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">毛利</span>
                            <p className={`font-medium ${project.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatFullCurrency(project.grossProfit)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>請款進度</span>
                            <span>{project.paymentProgress}%</span>
                        </div>
                        <ProgressBar value={parseFloat(project.paymentProgress)} max={100} />
                    </div>
                </div>
            ))}
        </div>
    );
};

// ============================================
// 狀態分佈圓餅區
// ============================================
const StatusDistribution = ({ distribution }) => {
    const total = Object.values(distribution || {}).reduce((a, b) => a + b, 0);
    if (total === 0) {
        return (
            <div className="text-center py-4 text-gray-400 text-sm">
                尚無專案資料
            </div>
        );
    }

    const items = [
        { key: 'healthy', label: '健康', color: 'green', count: distribution?.healthy || 0 },
        { key: 'warning', label: '警示', color: 'yellow', count: distribution?.warning || 0 },
        { key: 'critical', label: '危險', color: 'orange', count: distribution?.critical || 0 },
        { key: 'loss', label: '虧損', color: 'red', count: distribution?.loss || 0 },
    ];

    return (
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.key} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                    <span className="flex-1 text-sm text-gray-600">{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
                    <span className="text-sm text-gray-400">
                        ({total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%)
                    </span>
                </div>
            ))}
        </div>
    );
};

// ============================================
// 月度趨勢圖表
// ============================================
const MonthlyTrendChart = ({ data }) => {
    if (!data?.length) return null;

    const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.cost)));

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-gray-600">收入</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="text-gray-600">成本</span>
                </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-40">
                {data.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex-1 w-full flex items-end justify-center gap-1">
                            <div
                                className="w-3 bg-blue-500 rounded-t"
                                style={{ height: `${(item.revenue / maxValue) * 100}%` }}
                                title={`收入: ${formatFullCurrency(item.revenue)}`}
                            />
                            <div
                                className="w-3 bg-red-400 rounded-t"
                                style={{ height: `${(item.cost / maxValue) * 100}%` }}
                                title={`成本: ${formatFullCurrency(item.cost)}`}
                            />
                        </div>
                        <span className="text-xs text-gray-500">{item.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// 主元件
// ============================================
const ProfitAnalysis = ({ addToast }) => {
    const [metrics, setMetrics] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [metricsData, alertsData] = await Promise.all([
                ProfitAnalysisService.getDashboardMetrics(),
                ProfitAnalysisService.getAlerts(),
            ]);
            setMetrics(metricsData);
            setAlerts(alertsData);
        } catch (error) {
            console.error('Load error:', error);
            addToast?.('error', '載入資料失敗');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 標題 */}
            <SectionTitle
                icon={BarChart3}
                title="利潤分析"
                subtitle="專案成本、收入與毛利綜合分析"
            />

            {/* 主要指標 */}
            <div className="grid grid-cols-4 gap-4">
                <BigStatCard
                    icon={DollarSign}
                    label="總收入"
                    value={formatCurrency(metrics?.totalRevenue || 0)}
                    subValue={formatFullCurrency(metrics?.totalRevenue || 0)}
                    color="blue"
                />
                <BigStatCard
                    icon={Receipt}
                    label="總成本"
                    value={formatCurrency(metrics?.totalCost || 0)}
                    subValue={formatFullCurrency(metrics?.totalCost || 0)}
                    color="red"
                />
                <BigStatCard
                    icon={TrendingUp}
                    label="毛利"
                    value={formatCurrency(metrics?.totalProfit || 0)}
                    subValue={`毛利率 ${metrics?.overallMargin || 0}%`}
                    color="green"
                />
                <BigStatCard
                    icon={Percent}
                    label="收款率"
                    value={`${metrics?.collectionRate || 0}%`}
                    subValue={`已收 ${formatCurrency(metrics?.totalPaid || 0)}`}
                    color="orange"
                />
            </div>

            {/* 中間區塊 */}
            <div className="grid grid-cols-3 gap-6">
                {/* 專案狀態分佈 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <PieChart size={18} /> 專案毛利狀態
                    </h3>
                    <StatusDistribution distribution={metrics?.statusDistribution} />
                </div>

                {/* 警報 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} /> 警報通知
                        {alerts.length > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                                {alerts.length}
                            </span>
                        )}
                    </h3>
                    <AlertList alerts={alerts} />
                </div>

                {/* 月度趨勢 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={18} /> 月度趨勢
                    </h3>
                    <MonthlyTrendChart data={metrics?.monthlyTrend} />
                </div>
            </div>

            {/* 專案利潤列表 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 size={18} /> 專案毛利排行（低毛利優先）
                </h3>
                <ProjectProfitList projects={metrics?.projectAnalyses} />
            </div>
        </div>
    );
};

export default ProfitAnalysis;
