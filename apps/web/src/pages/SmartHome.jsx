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
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import { useConfirm } from '../components/common/ConfirmModal';

// Edit Device Modal Component - Enhanced Design
const EditDeviceModal = ({ device, deviceTypes, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: device?.name || '',
    type: device?.type || 'LIGHT',
    room: device?.room || '',
    unit: device?.unit || '',
    status: device?.status || 'OFF',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch(`/smarthome/devices/${device.id}`, formData);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || '更新失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Home size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">編輯設備</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}

          {/* Device Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              設備名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="輸入設備名稱"
            />
          </div>

          {/* Type - Visual Pills */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">設備類型</label>
            <div className="grid grid-cols-3 gap-2">
              {deviceTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                    formData.type === t.value
                      ? 'ring-2 ring-offset-2 ring-green-500 bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Room & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">房間</label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="例：1F 客廳"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">住戶單位</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="例：A1-25F"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50"
            >
              <CheckCircle size={18} />
              {loading ? '更新中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SmartHome = ({ addToast }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // 設備類型
  const deviceTypes = [
    { value: 'LIGHT', label: '照明', icon: Lightbulb, color: 'yellow' },
    { value: 'HVAC', label: '空調', icon: Thermometer, color: 'blue' },
    { value: 'LOCK', label: '門鎖', icon: Lock, color: 'purple' },
    { value: 'CAMERA', label: '攝影機', icon: Camera, color: 'green' },
    { value: 'SENSOR', label: '感測器', icon: Wifi, color: 'orange' },
    { value: 'POWER', label: '電源', icon: Power, color: 'red' },
  ];

  // Fetch devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/smarthome/devices');
      setDevices(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch smart home devices:', error);
      // No fallback to mock data - show empty state instead
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
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

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: '刪除設備',
      message: '確定要刪除此設備嗎？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/smarthome/devices/${id}`);
      addToast?.('設備已刪除', 'success');
      fetchDevices();
    } catch (error) {
      addToast?.('刪除失敗: ' + (error.response?.data?.message || error.message), 'error');
    }
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
        return <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800">已上鎖</span>;
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
            <Home className="text-green-500" size={28} />
            智慧住宅整合
          </h1>
          <p className="text-gray-500 mt-1">IoT 設備監控與控制</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
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
                    onClick={() => addToast?.(`開啟 ${device.name} 設定`, 'info')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="設備設定"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => setEditingDevice(device)}
                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="編輯"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="刪除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal - Enhanced Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Home size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">新增設備</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = {
                  name: fd.get('name'),
                  type: fd.get('type'),
                  room: fd.get('room'),
                  unit: fd.get('unit'),
                  status: 'OFF',
                  online: true,
                };
                try {
                  await api.post('/smarthome/devices', data);
                  addToast?.('設備新增成功', 'success');
                  setShowAddModal(false);
                } catch (error) {
                  addToast?.('新增失敗: ' + (error.response?.data?.message || error.message), 'error');
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Device Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  設備名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="客廳主燈"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  設備類型 <span className="text-red-500">*</span>
                </label>
                <select name="type" required className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  {deviceTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Room & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    房間 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="room"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="1F 客廳"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    住戶單位
                  </label>
                  <input
                    type="text"
                    name="unit"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="A1-25F"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新增設備
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          deviceTypes={deviceTypes}
          onClose={() => setEditingDevice(null)}
          onSuccess={() => {
            setEditingDevice(null);
            fetchDevices();
            addToast?.('設備已更新', 'success');
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
};

export default SmartHome;
