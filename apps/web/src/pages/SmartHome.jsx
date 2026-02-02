import React from 'react';
import { Home, Plus, Power, Thermometer, Lightbulb, Lock } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const SmartHome = ({ addToast }) => {
  const deviceCategories = [
    { id: 'lighting', label: '照明', icon: Lightbulb, count: 0 },
    { id: 'climate', label: '空調', icon: Thermometer, count: 0 },
    { id: 'security', label: '安防', icon: Lock, count: 0 },
    { id: 'power', label: '電力', icon: Power, count: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">智慧家庭</h1>
          <p className="text-gray-500 mt-1">IoT 設備整合與遠端監控</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新增設備
        </button>
      </div>

      {/* Device Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deviceCategories.map(cat => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">{cat.label}</p>
                  <p className="text-sm text-gray-400">{cat.count} 設備</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-8">
        <EmptyState
          icon="users"
          title="尚未連接設備"
          description="連接智慧家庭設備進行遠端監控"
          actionLabel="新增設備"
          onAction={() => addToast?.('智慧家庭功能開發中', 'info')}
        />
      </div>
    </div>
  );
};

export default SmartHome;
