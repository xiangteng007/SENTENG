/**
 * Notifications - Premium Edition
 * Design System v4.0: Modern Dark Gold
 * Full notification center with history, preferences, and real-time updates
 */

import { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { 
  Bell, 
  Settings, 
  Mail, 
  MessageSquare, 
  Calendar, 
  AlertTriangle, 
  Check, 
  CheckCheck,
  X,
  Trash2,
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  Users,
  Filter,
  RefreshCw,
  Archive,
  Star,
  MoreVertical,
  ChevronDown
} from 'lucide-react';

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onDelete, onStar }) => {
  const icons = {
    payment: DollarSign,
    project: Briefcase,
    contract: FileText,
    schedule: Calendar,
    system: Bell,
    alert: AlertTriangle,
    user: Users,
  };
  
  const colors = {
    payment: 'bg-green-100 text-green-600',
    project: 'bg-blue-100 text-blue-600',
    contract: 'bg-zinc-100 text-zinc-700',
    schedule: 'bg-[#D4AF37]/15 text-[#B8960C]',
    system: 'bg-zinc-100 text-zinc-600',
    alert: 'bg-red-100 text-red-600',
    user: 'bg-orange-100 text-orange-600',
  };
  
  const Icon = icons[notification.type] || Bell;
  const colorClass = colors[notification.type] || colors.system;
  
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl transition-all hover:bg-gray-50 ${
      !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
    }`}>
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
          </div>
          <button 
            onClick={() => onStar(notification.id)}
            className={`p-1 rounded-lg hover:bg-gray-100 ${notification.starred ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            <Star size={16} fill={notification.starred ? 'currentColor' : 'none'} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            {notification.time}
          </span>
          
          {!notification.read && (
            <button 
              onClick={() => onMarkRead(notification.id)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Check size={12} />
              標為已讀
            </button>
          )}
          
          {notification.action && (
            <button className="text-xs text-zinc-700 hover:text-[#D4AF37] flex items-center gap-1">
              {notification.action}
              <ChevronDown size={12} className="rotate-[-90deg]" />
            </button>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => onDelete(notification.id)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Settings Toggle
const SettingToggle = ({ label, description, icon: Icon, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
        <Icon size={20} className="text-gray-600" />
      </div>
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#D4AF37]' : 'bg-zinc-300'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  </div>
);

// Tab Button
const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
      active 
        ? 'bg-[#D4AF37]/15 text-[#B8960C]' 
        : 'text-zinc-600 hover:bg-zinc-100'
    }`}
  >
    {children}
    {count > 0 && (
      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
        active ? 'bg-[#D4AF37]/30 text-[#B8960C]' : 'bg-zinc-200 text-zinc-700'
      }`}>
        {count}
      </span>
    )}
  </button>
);

export const Notifications = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Start with empty notifications, fetch from API
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data?.items || res.data?.length) {
          setNotifications(res.data?.items || res.data);
        }
        // No fallback to mock data - show empty state instead
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        // No fallback to mock data - empty state will be shown
      }
    };
    fetchNotifications();
  }, []);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    paymentReminders: true,
    scheduleAlerts: true,
    systemAnnouncements: true,
    dailyDigest: false,
    weeklyReport: true,
    lineNotify: false,
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    
    if (activeTab === 'unread') {
      result = result.filter(n => !n.read);
    } else if (activeTab === 'starred') {
      result = result.filter(n => n.starred);
    }
    
    if (filter !== 'all') {
      result = result.filter(n => n.type === filter);
    }
    
    return result;
  }, [notifications, activeTab, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const starredCount = notifications.filter(n => n.starred).length;

  // Actions
  const handleMarkRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast?.('已將所有通知標為已讀', 'success');
  };

  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    addToast?.('通知已刪除', 'info');
  };

  const handleStar = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, starred: !n.starred } : n
    ));
  };

  const handleToggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    addToast?.('設定已更新', 'success');
  };

  const notificationTypes = [
    { value: 'all', label: '全部' },
    { value: 'payment', label: '款項' },
    { value: 'project', label: '專案' },
    { value: 'contract', label: '合約' },
    { value: 'schedule', label: '行程' },
    { value: 'alert', label: '警示' },
    { value: 'system', label: '系統' },
  ];

  const settingsGroups = [
    {
      title: '通知方式',
      items: [
        { key: 'emailNotifications', label: '電子郵件通知', icon: Mail, description: '透過 Email 接收重要通知' },
        { key: 'pushNotifications', label: '推播通知', icon: Bell, description: '瀏覽器和行動裝置推播' },
        { key: 'lineNotify', label: 'LINE Notify', icon: MessageSquare, description: '透過 LINE 接收通知' },
      ],
    },
    {
      title: '通知類型',
      items: [
        { key: 'projectUpdates', label: '專案更新', icon: Briefcase, description: '專案狀態變更通知' },
        { key: 'paymentReminders', label: '付款提醒', icon: AlertTriangle, description: '應收帳款和付款截止日' },
        { key: 'scheduleAlerts', label: '行程提醒', icon: Calendar, description: '會議和行程提前通知' },
        { key: 'systemAnnouncements', label: '系統公告', icon: Settings, description: '系統更新和維護通知' },
      ],
    },
    {
      title: '摘要報告',
      items: [
        { key: 'dailyDigest', label: '每日摘要', icon: Mail, description: '每天早上寄送前日統計' },
        { key: 'weeklyReport', label: '週報', icon: Mail, description: '每週一寄送上週報告' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-[#D4AF37]" />
            通知中心
          </h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `您有 ${unreadCount} 則未讀通知` : '所有通知都已讀取'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleMarkAllRead}
            className="btn-secondary flex items-center gap-2 text-sm"
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} />
            全部已讀
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-secondary flex items-center gap-2 text-sm ${showSettings ? 'bg-[#D4AF37]/15 text-[#B8960C]' : ''}`}
          >
            <Settings size={16} />
            設定
          </button>
        </div>
      </div>

      {showSettings ? (
        /* Settings Panel */
        <div className="space-y-6">
          {settingsGroups.map((group, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800">{group.title}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {group.items.map(item => (
                  <SettingToggle
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    icon={item.icon}
                    checked={settings[item.key]}
                    onChange={() => handleToggleSetting(item.key)}
                  />
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowSettings(false);
                addToast?.('設定已儲存', 'success');
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Check size={18} />
              儲存並關閉
            </button>
          </div>
        </div>
      ) : (
        /* Notifications List */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Tabs & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-gray-100">
            <div className="flex gap-2">
              <TabButton 
                active={activeTab === 'all'} 
                onClick={() => setActiveTab('all')}
                count={notifications.length}
              >
                全部
              </TabButton>
              <TabButton 
                active={activeTab === 'unread'} 
                onClick={() => setActiveTab('unread')}
                count={unreadCount}
              >
                未讀
              </TabButton>
              <TabButton 
                active={activeTab === 'starred'} 
                onClick={() => setActiveTab('starred')}
                count={starredCount}
              >
                <Star size={14} />
                重要
              </TabButton>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          
          {/* Notification List */}
          <div className="divide-y divide-gray-50">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onStar={handleStar}
                />
              ))
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Bell size={40} className="mx-auto mb-3 opacity-50" />
                <p>沒有符合條件的通知</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
