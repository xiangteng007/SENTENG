import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Plus, 
  Search, 
  Lightbulb,
  Thermometer,
  Lock,
  Camera,
  Wifi,
  Battery,
  Power,
  Settings,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react';

export const SmartHome = ({ addToast }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // 設備類型
  const deviceTypes = [
    { value: 'LIGHT', label: '照明', icon: Lightbulb, color: 'yellow' },
    { value: 'HVAC', label: '空調', icon: Thermometer, color: 'blue' },
    { value: 'LOCK', label: '門鎖', icon: Lock, color: 'purple' },
    { value: 'CAMERA', label: '攝影機', icon: Camera, color: 'green' },
    { value: 'SENSOR', label: '感測器', icon: Wifi, color: 'orange' },
    { value: 'POWER', label: '電源', icon: Power, color: 'red' },
  ];

  // Mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setDevices([
        {
          id: '1',
          name: '客廳主燈',
          type: 'LIGHT',
          room: '1F 客廳',
          unit: 'A1-25F',
          status: 'ON',
          value: 80,
          online: true,
          battery: null,
        },
        {
          id: '2',
          name: '中央空調',
          type: 'HVAC',
          room: '1F 客廳',
          unit: 'A1-25F',
          status: 'ON',
          value: 24,
          online: true,
          mode: 'COOLING',
        },
        {
          id: '3',
          name: '玄關電子鎖',
          type: 'LOCK',
          room: '1F 玄關',
          unit: 'A1-25F',
          status: 'LOCKED',
          online: true,
          battery: 85,
        },
        {
          id: '4',
          name: '門口攝影機',
          type: 'CAMERA',
          room: '1F 玄關',
          unit: 'A1-25F',
          status: 'RECORDING',
          online: true,
          storage: 75,
        },
        {
          id: '5',
          name: '動態感測器',
          type: 'SENSOR',
          room: '2F 走廊',
          unit: 'A1-25F',
          status: 'ACTIVE',
          online: true,
          battery: 62,
          lastTriggered: '2026-02-02 14:30',
        },
        {
          id: '6',
          name: '智慧插座 A',
          type: 'POWER',
          room: '1F 書房',
          unit: 'A1-25F',
          status: 'OFF',
          online: false,
          lastSeen: '2026-02-01 22:15',
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  // 取得房間列表
  const rooms = useMemo(() => {
    return [...new Set(devices.map(d => d.room))];
  }, [devices]);

  // 篩選
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                          d.room.toLowerCase().includes(search.toLowerCase());
      const matchRoom = roomFilter === 'all' || d.room === roomFilter;
      const matchType = typeFilter === 'all' || d.type === typeFilter;
      return matchSearch && matchRoom && matchType;
    });
  }, [devices, search, roomFilter, typeFilter]);

  // 統計
  const stats = useMemo(() => {
    return {
      total: devices.length,
      online: devices.filter(d => d.online).length,
      offline: devices.filter(d => !d.online).length,
      active: devices.filter(d => ['ON', 'RECORDING', 'ACTIVE'].includes(d.status)).length,
      lowBattery: devices.filter(d => d.battery !== null && d.battery < 20).length,
    };
  }, [devices]);

  const getTypeInfo = (type) => deviceTypes.find(t => t.value === type) || deviceTypes[0];

  const handleToggle = (device) => {
    setDevices(prev => prev.map(d => {
      if (d.id === device.id) {
        const newStatus = d.status === 'ON' ? 'OFF' : 
                          d.status === 'OFF' ? 'ON' :
                          d.status === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
        addToast?.(`${d.name} 已${newStatus === 'ON' || newStatus === 'UNLOCKED' ? '開啟' : '關閉'}`, 'success');
        return { ...d, status: newStatus };
      }
      return d;
    }));
  };

  const getStatusBadge = (device) => {
    if (!device.online) {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">離線</span>;
    }
    switch (device.status) {
      case 'ON':
      case 'RECORDING':
      case 'ACTIVE':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">運作中</span>;
      case 'LOCKED':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">已上鎖</span>;
      case 'UNLOCKED':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">未上鎖</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">關閉</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Home className="text-emerald-500" size={28} />
            智慧住宅整合
          </h1>
          <p className="text-gray-500 mt-1">IoT 設備監控與控制</p>
        </div>
        <button 
          onClick={() => addToast?.('功能開發中', 'info')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增設備
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">設備總數</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.online}</div>
          <div className="text-sm text-gray-500">在線</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
          <div className="text-sm text-gray-500">離線</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          <div className="text-sm text-gray-500">運作中</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.lowBattery}</div>
          <div className="text-sm text-gray-500">電量低</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋設備或房間..."
            className="input pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input min-w-[120px]"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        >
          <option value="all">所有房間</option>
          {rooms.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          className="input min-w-[120px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">所有類型</option>
          {deviceTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Devices Grid */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredDevices.length === 0 ? (
        <div className="card p-8 text-center">
          <Home className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="font-semibold text-gray-700 mb-2">尚無設備</h3>
          <p className="text-gray-500 mb-4">連接智慧設備開始使用</p>
          <button className="btn-primary">新增設備</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => {
            const typeInfo = getTypeInfo(device.type);
            const IconComponent = typeInfo.icon;
            return (
              <div 
                key={device.id} 
                className={`card p-4 hover:shadow-lg transition-shadow ${!device.online ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center`}>
                      <IconComponent className={`text-${typeInfo.color}-600`} size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{device.name}</h3>
                      <p className="text-sm text-gray-500">{device.room}</p>
                    </div>
                  </div>
                  {getStatusBadge(device)}
                </div>

                {/* Status Details */}
                <div className="mt-4 pt-4 border-t">
                  {device.type === 'LIGHT' && device.online && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">亮度</span>
                      <span className="font-medium">{device.value}%</span>
                    </div>
                  )}
                  {device.type === 'HVAC' && device.online && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">溫度</span>
                      <span className="font-medium">{device.value}°C</span>
                    </div>
                  )}
                  {device.battery !== null && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Battery size={14} />
                        電量
                      </span>
                      <span className={`font-medium ${device.battery < 20 ? 'text-red-600' : ''}`}>
                        {device.battery}%
                      </span>
                    </div>
                  )}
                  {device.lastTriggered && (
                    <div className="text-xs text-gray-500 mt-2">
                      最後觸發: {device.lastTriggered}
                    </div>
                  )}
                  {!device.online && device.lastSeen && (
                    <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      最後連線: {device.lastSeen}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleToggle(device)}
                    disabled={!device.online}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      device.online 
                        ? 'hover:bg-gray-100 text-gray-700' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {['ON', 'RECORDING', 'ACTIVE', 'UNLOCKED'].includes(device.status) ? (
                      <ToggleRight size={24} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={24} className="text-gray-400" />
                    )}
                    <span className="text-sm">
                      {['ON', 'RECORDING', 'ACTIVE'].includes(device.status) ? '開啟' : 
                       device.status === 'LOCKED' ? '上鎖' : 
                       device.status === 'UNLOCKED' ? '未鎖' : '關閉'}
                    </span>
                  </button>
                  <button
                    onClick={() => addToast?.('設定功能開發中', 'info')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartHome;
