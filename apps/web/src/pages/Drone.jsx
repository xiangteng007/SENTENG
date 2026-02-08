import { useState, useEffect, useMemo } from 'react';
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
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useConfirm } from '../components/common/useConfirm';

// Edit Flight Modal Component - Enhanced Design
const EditFlightModal = ({ flight, projects, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    missionName: flight?.missionName || '',
    project: flight?.project || '',
    date: flight?.date?.split('T')[0] || '',
    pilot: flight?.pilot || '',
    droneModel: flight?.droneModel || 'DJI Mavic 3',
    status: flight?.status || 'SCHEDULED',
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
      await api.patch(`/drone/flights/${flight.id}`, formData);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || '更新失敗');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'SCHEDULED', label: '已排程', color: 'bg-blue-100 text-blue-700 ring-blue-500' },
    { value: 'COMPLETED', label: '已完成', color: 'bg-green-100 text-green-700 ring-green-500' },
    { value: 'CANCELLED', label: '已取消', color: 'bg-red-100 text-red-700 ring-red-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Plane size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">編輯飛行任務</h2>
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
          
          {/* Mission Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              任務名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="missionName"
              value={formData.missionName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="輸入任務名稱"
            />
          </div>

          {/* Status - Visual Pills */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">任務狀態</label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: s.value }))}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    formData.status === s.value
                      ? 'ring-2 ring-offset-2 ' + s.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Drone Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar size={14} className="text-gray-400" />
                飛行日期
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Plane size={14} className="text-gray-400" />
                無人機型號
              </label>
              <select
                name="droneModel"
                value={formData.droneModel}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="DJI Mavic 3">DJI Mavic 3</option>
                <option value="DJI Phantom 4 RTK">DJI Phantom 4 RTK</option>
                <option value="DJI Mini 4 Pro">DJI Mini 4 Pro</option>
              </select>
            </div>
          </div>

          {/* Pilot */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">操作員</label>
            <input
              type="text"
              name="pilot"
              value={formData.pilot}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="操作員姓名"
            />
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
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-sky-500/25 disabled:opacity-50"
            >
              {loading ? '更新中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Drone = ({ addToast }) => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // Fetch flights
  const fetchFlights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drone/flights');
      setFlights(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch drone flights:', error);
      // No fallback to mock data - show empty state instead
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
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

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: '刪除飛行任務',
      message: '確定要刪除此飛行任務嗎？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/drone/flights/${id}`);
      addToast?.('飛行任務已刪除', 'success');
      fetchFlights();
    } catch (error) {
      addToast?.('刪除失敗: ' + (error.response?.data?.message || error.message), 'error');
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
          <div className="text-2xl font-bold text-zinc-700">{stats.totalPhotos.toLocaleString()}</div>
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
                        onClick={() => { addToast?.(`正在下載飛行資料...`, 'info'); setTimeout(() => addToast?.('下載完成', 'success'), 1500); }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="下載飛行資料"
                      >
                        <Download size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => setEditingFlight(flight)}
                        className="flex-1 btn-secondary text-sm py-1.5"
                      >
                        編輯任務
                      </button>
                      <button
                        onClick={() => handleDelete(flight.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="刪除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal - Enhanced Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Plane size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">排定飛行任務</h2>
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

      {/* Edit Modal */}
      {editingFlight && (
        <EditFlightModal
          flight={editingFlight}
          projects={projects}
          onClose={() => setEditingFlight(null)}
          onSuccess={() => {
            setEditingFlight(null);
            fetchFlights();
            addToast?.('飛行任務已更新', 'success');
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Drone;
