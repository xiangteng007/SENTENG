import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Plus, Filter, Search, Calendar, Edit2, Trash2, Cloud, Sun, CloudRain, Thermometer, Users, X, Check, Camera, MapPin } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

// 天氣選項
const WEATHER_OPTIONS = [
  { value: 'SUNNY', label: '晴天', icon: Sun, color: 'text-yellow-500' },
  { value: 'CLOUDY', label: '多雲', icon: Cloud, color: 'text-gray-500' },
  { value: 'RAINY', label: '雨天', icon: CloudRain, color: 'text-blue-500' },
  { value: 'OVERCAST', label: '陰天', icon: Cloud, color: 'text-gray-400' },
];

// 日誌卡片
const DiaryCard = ({ diary, onEdit, onDelete }) => {
  const weatherInfo = WEATHER_OPTIONS.find(w => w.value === diary.weather) || WEATHER_OPTIONS[0];
  const WeatherIcon = weatherInfo.icon;
  
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="text-center bg-blue-50 rounded-lg p-2 min-w-[60px]">
            <p className="text-2xl font-bold text-blue-600">{new Date(diary.diaryDate).getDate()}</p>
            <p className="text-xs text-blue-500">
              {new Date(diary.diaryDate).toLocaleDateString('zh-TW', { month: 'short' })}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{diary.projectName || '專案日誌'}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <WeatherIcon size={14} className={weatherInfo.color} />
                <span>{weatherInfo.label}</span>
              </div>
              {diary.temperatureHigh && (
                <div className="flex items-center gap-1">
                  <Thermometer size={14} />
                  <span>{diary.temperatureLow}°-{diary.temperatureHigh}°C</span>
                </div>
              )}
              {diary.workersCount && (
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{diary.workersCount} 人</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button onClick={() => onEdit(diary)} className="p-2 hover:bg-gray-100 rounded">
            <Edit2 size={16} className="text-gray-500" />
          </button>
          <button onClick={() => onDelete(diary.id)} className="p-2 hover:bg-red-50 rounded">
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {diary.workSummary && (
          <div>
            <p className="text-xs text-gray-400 mb-1">施工內容</p>
            <p className="text-gray-700 text-sm line-clamp-2">{diary.workSummary}</p>
          </div>
        )}
        {diary.issues && (
          <div className="bg-red-50 rounded p-2">
            <p className="text-xs text-red-500 mb-1">待解決問題</p>
            <p className="text-red-700 text-sm">{diary.issues}</p>
          </div>
        )}
        {diary.safetyNotes && (
          <div className="bg-yellow-50 rounded p-2">
            <p className="text-xs text-yellow-600 mb-1">安全注意事項</p>
            <p className="text-yellow-800 text-sm">{diary.safetyNotes}</p>
          </div>
        )}
      </div>
      
      {diary.photos?.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {diary.photos.slice(0, 4).map((photo, i) => (
            <div key={i} className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
              <Camera size={20} className="text-gray-400" />
            </div>
          ))}
          {diary.photos.length > 4 && (
            <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-500 text-sm">
              +{diary.photos.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 新增/編輯日誌 Modal
const DiaryModal = ({ diary, projects, onSave, onClose }) => {
  const [form, setForm] = useState({
    projectId: diary?.projectId || '',
    diaryDate: diary?.diaryDate || new Date().toISOString().split('T')[0],
    weather: diary?.weather || 'SUNNY',
    temperatureHigh: diary?.temperatureHigh || '',
    temperatureLow: diary?.temperatureLow || '',
    workersCount: diary?.workersCount || '',
    workSummary: diary?.workSummary || '',
    issues: diary?.issues || '',
    safetyNotes: diary?.safetyNotes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...diary,
      ...form,
      temperatureHigh: form.temperatureHigh ? Number(form.temperatureHigh) : null,
      temperatureLow: form.temperatureLow ? Number(form.temperatureLow) : null,
      workersCount: form.workersCount ? Number(form.workersCount) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{diary ? '編輯日誌' : '新增日誌'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">專案</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="input w-full"
              >
                <option value="">選擇專案</option>
                {projects?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
              <input
                type="date"
                value={form.diaryDate}
                onChange={(e) => setForm({ ...form, diaryDate: e.target.value })}
                className="input w-full"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">天氣</label>
              <select
                value={form.weather}
                onChange={(e) => setForm({ ...form, weather: e.target.value })}
                className="input w-full"
              >
                {WEATHER_OPTIONS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高溫 (°C)</label>
              <input
                type="number"
                value={form.temperatureHigh}
                onChange={(e) => setForm({ ...form, temperatureHigh: e.target.value })}
                className="input w-full"
                placeholder="32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低溫 (°C)</label>
              <input
                type="number"
                value={form.temperatureLow}
                onChange={(e) => setForm({ ...form, temperatureLow: e.target.value })}
                className="input w-full"
                placeholder="25"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出工人數</label>
            <input
              type="number"
              value={form.workersCount}
              onChange={(e) => setForm({ ...form, workersCount: e.target.value })}
              className="input w-full"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">施工內容 *</label>
            <textarea
              value={form.workSummary}
              onChange={(e) => setForm({ ...form, workSummary: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="今日施工項目與進度..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">待解決問題</label>
            <textarea
              value={form.issues}
              onChange={(e) => setForm({ ...form, issues: e.target.value })}
              className="input w-full h-16 resize-none"
              placeholder="施工過程中遇到的問題..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">安全注意事項</label>
            <textarea
              value={form.safetyNotes}
              onChange={(e) => setForm({ ...form, safetyNotes: e.target.value })}
              className="input w-full h-16 resize-none"
              placeholder="安全相關提醒..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Check size={16} />
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SiteLogs = ({ addToast, allProjects = [] }) => {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [editingDiary, setEditingDiary] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    // TODO: 替換為真實 API 呼叫
    setTimeout(() => {
      setDiaries([
        {
          id: '1',
          projectId: 'P001',
          projectName: '信義區住宅案',
          diaryDate: '2026-02-01',
          weather: 'SUNNY',
          temperatureHigh: 28,
          temperatureLow: 22,
          workersCount: 15,
          workSummary: '完成 3F 牆面粉光作業，開始進行水電預埋管線。',
          issues: '部分材料延遲到貨',
          safetyNotes: '高空作業需確實繫好安全帶',
          photos: [{ url: '1' }, { url: '2' }],
        },
        {
          id: '2',
          projectId: 'P002',
          projectName: '中山區辦公大樓',
          diaryDate: '2026-02-01',
          weather: 'CLOUDY',
          temperatureHigh: 26,
          temperatureLow: 20,
          workersCount: 8,
          workSummary: '進行外牆清潔作業，完成 80%。',
          photos: [],
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const filteredDiaries = useMemo(() => {
    return diaries.filter(diary => {
      const matchSearch = 
        diary.workSummary?.toLowerCase().includes(search.toLowerCase()) ||
        diary.projectName?.toLowerCase().includes(search.toLowerCase());
      const matchProject = projectFilter === 'all' || diary.projectId === projectFilter;
      const matchDate = !dateFilter || diary.diaryDate === dateFilter;
      return matchSearch && matchProject && matchDate;
    });
  }, [diaries, search, projectFilter, dateFilter]);

  const handleSave = (diaryData) => {
    if (diaryData.id) {
      setDiaries(prev => prev.map(d => d.id === diaryData.id ? diaryData : d));
      addToast?.('日誌已更新', 'success');
    } else {
      const newDiary = { ...diaryData, id: Date.now().toString() };
      setDiaries(prev => [...prev, newDiary]);
      addToast?.('日誌已新增', 'success');
    }
    setShowModal(false);
    setEditingDiary(null);
  };

  const handleDelete = (id) => {
    if (confirm('確定要刪除此日誌？')) {
      setDiaries(prev => prev.filter(d => d.id !== id));
      addToast?.('日誌已刪除', 'success');
    }
  };

  const handleEdit = (diary) => {
    setEditingDiary(diary);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工地日誌</h1>
          <p className="text-gray-500 mt-1">記錄每日工地施工進度和事項</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditingDiary(null); setShowModal(true); }}
        >
          <Plus size={18} />
          新增日誌
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋日誌內容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="input"
        >
          <option value="all">所有專案</option>
          {allProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{diaries.length}</p>
          <p className="text-sm text-gray-500">總日誌數</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {diaries.filter(d => d.diaryDate === new Date().toISOString().split('T')[0]).length}
          </p>
          <p className="text-sm text-gray-500">今日日誌</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {diaries.reduce((sum, d) => sum + (d.workersCount || 0), 0)}
          </p>
          <p className="text-sm text-gray-500">總出工人數</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {diaries.filter(d => d.issues).length}
          </p>
          <p className="text-sm text-gray-500">有待解決問題</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredDiaries.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon="file"
            title="尚無工地日誌"
            description="開始記錄每日工地進度和施工紀錄"
            actionLabel="新增日誌"
            onAction={() => { setEditingDiary(null); setShowModal(true); }}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDiaries.map(diary => (
            <DiaryCard
              key={diary.id}
              diary={diary}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <DiaryModal
          diary={editingDiary}
          projects={allProjects}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingDiary(null); }}
        />
      )}
    </div>
  );
};

export default SiteLogs;
