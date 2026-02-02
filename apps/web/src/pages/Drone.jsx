import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plane, 
  Plus, 
  Search, 
  Camera, 
  Video,
  Calendar,
  MapPin,
  Play,
  Download,
  Eye,
  Cloud,
  Thermometer,
  Wind,
  X
} from 'lucide-react';
import api from '../services/api';

export const Drone = ({ addToast }) => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setFlights([
        {
          id: '1',
          missionName: '月度進度空拍 - 2026/02',
          project: '信義豪宅案',
          date: '2026-02-01',
          pilot: '王小明',
          droneModel: 'DJI Mavic 3',
          duration: 45,
          photos: 256,
          videos: 3,
          weather: { temp: 18, wind: 12, condition: 'cloudy' },
          status: 'COMPLETED',
          thumbnail: null,
        },
        {
          id: '2',
          missionName: '外牆施工記錄',
          project: '信義豪宅案',
          date: '2026-01-28',
          pilot: '李小華',
          droneModel: 'DJI Phantom 4 RTK',
          duration: 32,
          photos: 180,
          videos: 2,
          weather: { temp: 15, wind: 8, condition: 'sunny' },
          status: 'COMPLETED',
          thumbnail: null,
        },
        {
          id: '3',
          missionName: '基地測量',
          project: '大同商辦案',
          date: '2026-01-20',
          pilot: '王小明',
          droneModel: 'DJI Phantom 4 RTK',
          duration: 60,
          photos: 420,
          videos: 0,
          weather: { temp: 20, wind: 5, condition: 'sunny' },
          status: 'COMPLETED',
          thumbnail: null,
          orthomap: true,
        },
        {
          id: '4',
          missionName: '預定飛行 - 2026/02/10',
          project: '信義豪宅案',
          date: '2026-02-10',
          pilot: '待指派',
          droneModel: 'DJI Mavic 3',
          duration: 0,
          photos: 0,
          videos: 0,
          weather: null,
          status: 'SCHEDULED',
          thumbnail: null,
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  // 取得專案列表
  const projects = useMemo(() => {
    return [...new Set(flights.map(f => f.project))];
  }, [flights]);

  // 篩選
  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      const matchSearch = f.missionName.toLowerCase().includes(search.toLowerCase()) ||
                          f.pilot.toLowerCase().includes(search.toLowerCase());
      const matchProject = selectedProject === 'all' || f.project === selectedProject;
      return matchSearch && matchProject;
    });
  }, [flights, search, selectedProject]);

  // 統計
  const stats = useMemo(() => {
    const completed = flights.filter(f => f.status === 'COMPLETED');
    return {
      totalFlights: flights.length,
      completed: completed.length,
      scheduled: flights.filter(f => f.status === 'SCHEDULED').length,
      totalPhotos: completed.reduce((acc, f) => acc + f.photos, 0),
      totalVideos: completed.reduce((acc, f) => acc + f.videos, 0),
      totalMinutes: completed.reduce((acc, f) => acc + f.duration, 0),
    };
  }, [flights]);

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'cloudy': return '⛅';
      case 'rainy': return '🌧️';
      default: return '🌤️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plane className="text-sky-500" size={28} />
            無人機空拍管理
          </h1>
          <p className="text-gray-500 mt-1">工地進度空拍與正射影像</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          排定飛行任務
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.totalFlights}</div>
          <div className="text-sm text-gray-500">飛行任務</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          <div className="text-sm text-gray-500">已排程</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalPhotos.toLocaleString()}</div>
          <div className="text-sm text-gray-500">照片總數</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.totalVideos}</div>
          <div className="text-sm text-gray-500">影片總數</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.totalMinutes}</div>
          <div className="text-sm text-gray-500">飛行分鐘</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋任務或操作員..."
            className="input pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input min-w-[150px]"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="all">所有專案</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Flights Grid */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredFlights.length === 0 ? (
        <div className="card p-8 text-center">
          <Plane className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="font-semibold text-gray-700 mb-2">尚無飛行任務</h3>
          <p className="text-gray-500 mb-4">排定空拍任務開始記錄</p>
          <button className="btn-primary">排定任務</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlights.map(flight => (
            <div key={flight.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail / Placeholder */}
              <div className="h-40 bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center relative">
                <Plane className="text-sky-400" size={48} />
                {flight.status === 'SCHEDULED' && (
                  <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    已排程
                  </div>
                )}
                {flight.orthomap && (
                  <div className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    正射圖
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate" title={flight.missionName}>
                  {flight.missionName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{flight.project}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {flight.date}
                  </span>
                  <span>{flight.droneModel}</span>
                </div>
                
                {flight.status === 'COMPLETED' && (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Camera size={12} />
                        {flight.photos} 張
                      </span>
                      <span className="flex items-center gap-1">
                        <Video size={12} />
                        {flight.videos} 部
                      </span>
                      <span>{flight.duration} 分鐘</span>
                    </div>
                    
                    {flight.weather && (
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 pt-2 border-t">
                        <span>{getWeatherIcon(flight.weather.condition)}</span>
                        <span className="flex items-center gap-1">
                          <Thermometer size={12} />
                          {flight.weather.temp}°C
                        </span>
                        <span className="flex items-center gap-1">
                          <Wind size={12} />
                          {flight.weather.wind} km/h
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  {flight.status === 'COMPLETED' ? (
                    <>
                      <button
                        onClick={() => addToast?.('相簿開啟中...', 'info')}
                        className="flex-1 btn-primary text-sm py-1.5 flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        瀏覽
                      </button>
                      <button
                        onClick={() => addToast?.('下載功能開發中', 'info')}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => addToast?.('編輯任務', 'info')}
                      className="flex-1 btn-secondary text-sm py-1.5"
                    >
                      編輯任務
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">排定飛行任務</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = {
                  missionName: fd.get('missionName'),
                  project: fd.get('project'),
                  date: fd.get('date'),
                  pilot: fd.get('pilot'),
                  droneModel: fd.get('droneModel'),
                  status: 'SCHEDULED',
                };
                try {
                  await api.post('/drone/flights', data);
                  addToast?.('飛行任務已排定', 'success');
                  setShowAddModal(false);
                } catch (error) {
                  addToast?.('排定失敗: ' + (error.response?.data?.message || error.message), 'error');
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Mission Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  任務名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="missionName"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="月度進度空拍"
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  所屬專案 <span className="text-red-500">*</span>
                </label>
                <select name="project" required className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  {projects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="new">+ 新專案</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  飛行日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              {/* Pilot & Drone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">指派操作員</label>
                  <input
                    type="text"
                    name="pilot"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="待指派"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">無人機型號</label>
                  <select name="droneModel" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <option value="DJI Mavic 3">DJI Mavic 3</option>
                    <option value="DJI Phantom 4 RTK">DJI Phantom 4 RTK</option>
                    <option value="DJI Mini 4 Pro">DJI Mini 4 Pro</option>
                    <option value="Other">其他</option>
                  </select>
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
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  排定任務
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drone;
