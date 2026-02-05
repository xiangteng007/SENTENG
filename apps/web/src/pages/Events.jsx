import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Calendar, Plus, Filter, Search, Edit2, Trash2, Clock, MapPin, Users, X, Check, ChevronDown } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

// 活動類型
const EVENT_TYPES = {
  MEETING: { label: '會議', color: 'bg-blue-100 text-blue-700' },
  SITE_VISIT: { label: '工地巡檢', color: 'bg-orange-100 text-orange-700' },
  TRAINING: { label: '教育訓練', color: 'bg-zinc-100 text-zinc-800' },
  CLIENT_MEETING: { label: '業主會議', color: 'bg-green-100 text-green-700' },
  DEADLINE: { label: '截止日', color: 'bg-red-100 text-red-700' },
  OTHER: { label: '其他', color: 'bg-gray-100 text-gray-700' },
};

// 活動狀態
const EVENT_STATUS = {
  UPCOMING: { label: '即將舉行', color: 'text-blue-600' },
  IN_PROGRESS: { label: '進行中', color: 'text-green-600' },
  COMPLETED: { label: '已完成', color: 'text-gray-500' },
  CANCELLED: { label: '已取消', color: 'text-red-500' },
};

// 單個活動卡片
const EventCard = ({ event, onEdit, onDelete }) => {
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.OTHER;
  const statusInfo = EVENT_STATUS[event.status] || EVENT_STATUS.UPCOMING;
  
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className={`text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">{event.title}</h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{event.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{new Date(event.startTime).toLocaleString('zh-TW', { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{event.location}</span>
              </div>
            )}
            {event.attendees?.length > 0 && (
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{event.attendees.length} 人</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <button onClick={() => onEdit(event)} className="p-2 hover:bg-gray-100 rounded">
            <Edit2 size={16} className="text-gray-500" />
          </button>
          <button onClick={() => onDelete(event.id)} className="p-2 hover:bg-red-50 rounded">
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 新增/編輯活動 Modal - Enhanced Design
const EventModal = ({ event, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || 'MEETING',
    startTime: event?.startTime || new Date().toISOString().slice(0, 16),
    endTime: event?.endTime || '',
    location: event?.location || '',
    attendees: event?.attendees?.join(', ') || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...event,
      ...form,
      attendees: form.attendees.split(',').map(a => a.trim()).filter(Boolean),
    });
  };

  const selectedType = EVENT_TYPES[form.type] || EVENT_TYPES.OTHER;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Calendar size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">{event ? '編輯活動' : '新增活動'}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 活動名稱 */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              活動名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="輸入活動名稱"
              required
            />
          </div>
          
          {/* 活動類型 - Visual Pills */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">活動類型</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, type: key })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    form.type === key 
                      ? 'ring-2 ring-orange-500 ring-offset-2 ' + color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* 時間選擇 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock size={14} className="text-gray-400" />
                開始時間 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock size={14} className="text-gray-400" />
                結束時間
              </label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* 地點 */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin size={14} className="text-gray-400" />
              地點
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="例：總公司會議室A、工地現場"
            />
          </div>
          
          {/* 參與人員 */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users size={14} className="text-gray-400" />
              參與人員
            </label>
            <input
              type="text"
              value={form.attendees}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="以逗號分隔，例：張三, 李四, 王五"
            />
            {form.attendees && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.attendees.split(',').map((name, i) => name.trim() && (
                  <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    {name.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* 活動說明 */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">活動說明</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none h-24"
              placeholder="補充說明、注意事項等..."
            />
          </div>
          
          {/* 按鈕區 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">
              取消
            </button>
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-orange-500/25">
              <Check size={18} />
              儲存活動
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export const Events = ({ addToast }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      setEvents(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      // No fallback to mock data - show empty state instead
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 篩選事件
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
                          event.description?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || event.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [events, search, typeFilter]);

  const handleSave = (eventData) => {
    if (eventData.id) {
      setEvents(prev => prev.map(e => e.id === eventData.id ? eventData : e));
      addToast?.('活動已更新', 'success');
    } else {
      const newEvent = { ...eventData, id: Date.now().toString(), status: 'UPCOMING' };
      setEvents(prev => [...prev, newEvent]);
      addToast?.('活動已新增', 'success');
    }
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDelete = (id) => {
    if (confirm('確定要刪除此活動？')) {
      setEvents(prev => prev.filter(e => e.id !== id));
      addToast?.('活動已刪除', 'success');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">活動管理</h1>
          <p className="text-gray-500 mt-1">管理公司活動、會議和行程安排</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditingEvent(null); setShowModal(true); }}
        >
          <Plus size={18} />
          新增活動
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋活動..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input"
        >
          <option value="all">所有類型</option>
          {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{events.filter(e => e.status === 'UPCOMING').length}</p>
          <p className="text-sm text-gray-500">即將舉行</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{events.filter(e => e.status === 'IN_PROGRESS').length}</p>
          <p className="text-sm text-gray-500">進行中</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{events.filter(e => e.status === 'COMPLETED').length}</p>
          <p className="text-sm text-gray-500">已完成</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-zinc-700">{events.length}</p>
          <p className="text-sm text-gray-500">全部活動</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon="calendar"
            title="尚無活動"
            description="開始規劃您的第一個公司活動或會議"
            actionLabel="新增活動"
            onAction={() => { setEditingEvent(null); setShowModal(true); }}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
};

export default Events;
