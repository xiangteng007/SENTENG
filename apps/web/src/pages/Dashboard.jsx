/**
 * Dashboard - Premium Edition
 * Design System v5.0: Carbon Copper Industrial
 * Enhanced with real-time stats, charts, and premium UI
 */

import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  FileText,
  Bell,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatCardPro, AlertCard, ProgressRing } from '../components/common/ModuleComponents';

// Greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚安';
};

// Stat Card Component
const StatCard = ({ title, value, change, icon: Icon, color, trend }) => {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendIcon size={14} />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
};

// Project Progress Card
const ProjectProgressCard = ({ project }) => {
  const progress = project.progress || Math.floor(Math.random() * 100);
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONSTRUCTION': return 'bg-blue-500';
      case 'DESIGN': return 'bg-zinc-700';
      case 'COMPLETED': return 'bg-green-600';
      default: return 'bg-zinc-500';
    }
  };
  
  return (
    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 truncate flex-1">{project.name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
          {progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(project.status)}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">{project.address || '地點未定'}</p>
    </div>
  );
};

// Activity Item
const ActivityItem = ({ activity }) => {
  const icons = {
    contract: FileText,
    payment: DollarSign,
    project: Briefcase,
    schedule: Calendar,
    alert: AlertTriangle,
  };
  const Icon = icons[activity.type] || Activity;
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{activity.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
      </div>
    </div>
  );
};

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${color} text-white hover:opacity-90 transition-opacity`}
  >
    <Icon size={24} />
    <span className="text-xs font-medium">{label}</span>
  </button>
);

// Schedule Item
const ScheduleItem = ({ event }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="w-1 h-10 bg-[#D4AF37] rounded-full" />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{event.summary || event.title}</p>
      <p className="text-xs text-gray-500">
        {new Date(event.start?.dateTime || event.start?.date).toLocaleTimeString('zh-TW', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>
  </div>
);

const Dashboard = ({ events = [], finance = {}, projects = [], clients = [] }) => {
  const { user } = useAuth();
  const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || '使用者';
  const dateStr = new Date().toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = finance?.transactions?.reduce((sum, t) => 
      t.type === 'income' ? sum + (t.amount || 0) : sum, 0
    ) || 0;
    
    const totalExpenses = finance?.transactions?.reduce((sum, t) => 
      t.type === 'expense' ? sum + (t.amount || 0) : sum, 0
    ) || 0;

    const activeProjects = projects?.filter(p => 
      ['CONSTRUCTION', 'DESIGN', 'PLANNING'].includes(p.status)
    ).length || 0;

    const pendingPayments = finance?.transactions?.filter(t => 
      t.status === 'pending' || t.paymentStatus === 'UNPAID'
    ).length || 0;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
      activeProjects,
      totalClients: clients?.length || 0,
      pendingPayments,
      todayEvents: events?.filter(e => {
        const today = new Date().toDateString();
        const eventDate = new Date(e.start?.dateTime || e.start?.date).toDateString();
        return eventDate === today;
      }).length || 0,
    };
  }, [finance, projects, clients, events]);

  // Recent activities (loaded from API)
  const [recentActivities, setRecentActivities] = useState([]);

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get('/events');
        if (res.data?.items || res.data?.length) {
          setRecentActivities(res.data?.items || res.data);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        // Keep fallback mock data
      }
    };
    fetchActivities();
  }, []);

  // Today's events
  const todayEvents = events?.filter(e => {
    const today = new Date().toDateString();
    const eventDate = new Date(e.start?.dateTime || e.start?.date).toDateString();
    return eventDate === today;
  }).slice(0, 5) || [];

  // Active projects for display
  const displayProjects = projects?.filter(p => 
    ['CONSTRUCTION', 'DESIGN', 'PLANNING'].includes(p.status)
  ).slice(0, 4) || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-yellow-500" />
            <span className="text-sm text-gray-500">{dateStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {getGreeting()}，{userName}
          </h1>
          <p className="text-gray-500 mt-1">
            今日有 {stats.todayEvents} 個行程，{stats.pendingPayments} 筆待處理款項
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <BarChart3 size={16} />
            查看報表
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Zap size={16} />
            快速操作
          </button>
        </div>
      </div>

      {/* Stats Grid - Using StatCardPro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardPro 
          title="本月營收" 
          value={formatCurrency(stats.revenue)}
          change="+12.5%"
          changeLabel="較上月"
          icon={DollarSign}
          accentColor="success"
          trend="up"
        />
        <StatCardPro 
          title="進行中專案" 
          value={stats.activeProjects}
          change={`${projects?.length || 0} 個總專案`}
          icon={Briefcase}
          accentColor="carbon"
          trend="up"
        />
        <StatCardPro 
          title="客戶總數" 
          value={stats.totalClients}
          change="+3"
          changeLabel="本月新增"
          icon={Users}
          accentColor="gold"
          trend="up"
        />
        <StatCardPro 
          title="本月淨利" 
          value={formatCurrency(stats.profit)}
          change={stats.profit >= 0 ? '+8.2%' : '-5.3%'}
          icon={TrendingUp}
          accentColor={stats.profit >= 0 ? 'copper' : 'danger'}
          trend={stats.profit >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Projects */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target size={18} className="text-[#D4AF37]" />
                進行中專案
              </h3>
              <button className="text-sm text-zinc-700 hover:text-[#D4AF37] flex items-center gap-1">
                查看全部 <ChevronRight size={16} />
              </button>
            </div>
            {displayProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayProjects.map((project, idx) => (
                  <ProjectProgressCard key={project.id || idx} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase size={40} className="mx-auto mb-2 opacity-50" />
                <p>目前沒有進行中的專案</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-orange-500" />
                最新動態
              </h3>
              <button className="text-sm text-zinc-700 hover:text-[#D4AF37] flex items-center gap-1">
                查看全部 <ChevronRight size={16} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentActivities.map((activity, idx) => (
                <ActivityItem key={idx} activity={activity} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Schedule & Quick Actions */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                今日行程
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {todayEvents.length} 項
              </span>
            </div>
            {todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map((event, idx) => (
                  <ScheduleItem key={idx} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">今日無排程</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={18} className="text-yellow-500" />
              快速操作
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <QuickAction 
                icon={FileText} 
                label="新估價" 
                color="from-blue-500 to-blue-600"
              />
              <QuickAction 
                icon={Briefcase} 
                label="新專案" 
                color="from-zinc-700 to-zinc-800"
              />
              <QuickAction 
                icon={DollarSign} 
                label="記帳" 
                color="from-green-500 to-green-600"
              />
            </div>
          </div>

          {/* Alerts - Using AlertCard */}
          <div className="space-y-3">
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Bell size={18} className="text-amber-600" />
              待處理事項
            </h3>
            <AlertCard 
              type="warning"
              title={`${stats.pendingPayments} 筆請款待審核`}
              message="點擊查看詳細資訊"
              action="前往審核"
            />
            <AlertCard 
              type="info"
              title="2 份合約即將到期"
              message="請確認續約事宜"
              action="查看合約"
            />
            <AlertCard 
              type="success"
              title="3 個驗收待簽核"
              message="已通過品質檢查"
              action="簽核"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
