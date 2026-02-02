import React, { useState } from 'react';
import { Bell, Settings, Mail, MessageSquare, Calendar, AlertTriangle, Check } from 'lucide-react';

export const Notifications = ({ addToast }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    paymentReminders: true,
    scheduleAlerts: true,
    systemAnnouncements: true,
    dailyDigest: false,
    weeklyReport: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    addToast?.('設定已更新', 'success');
  };

  const notificationGroups = [
    {
      title: '通知方式',
      items: [
        { key: 'emailNotifications', label: '電子郵件通知', icon: Mail, description: '透過 Email 接收重要通知' },
        { key: 'pushNotifications', label: '推播通知', icon: Bell, description: '瀏覽器和行動裝置推播' },
      ],
    },
    {
      title: '通知類型',
      items: [
        { key: 'projectUpdates', label: '專案更新', icon: Settings, description: '專案狀態變更通知' },
        { key: 'paymentReminders', label: '付款提醒', icon: AlertTriangle, description: '應收帳款和付款截止日' },
        { key: 'scheduleAlerts', label: '行程提醒', icon: Calendar, description: '會議和行程提前通知' },
        { key: 'systemAnnouncements', label: '系統公告', icon: MessageSquare, description: '系統更新和維護通知' },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">通知設定</h1>
        <p className="text-gray-500 mt-1">管理您的通知偏好設定</p>
      </div>

      {notificationGroups.map((group, idx) => (
        <div key={idx} className="card">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">{group.title}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Icon size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings[item.key] ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        settings[item.key] ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={() => addToast?.('設定已儲存', 'success')}
          className="btn-primary flex items-center gap-2"
        >
          <Check size={18} />
          儲存設定
        </button>
      </div>
    </div>
  );
};

export default Notifications;
