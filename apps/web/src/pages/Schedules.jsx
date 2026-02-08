import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useConfirm } from '../components/common/useConfirm';

// Edit Schedule Modal Component
const EditScheduleModal = ({ task, projects, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    project: task?.project || '',
    startDate: task?.startDate?.split('T')[0] || '',
    endDate: task?.endDate?.split('T')[0] || '',
    progress: task?.progress || 0,
    status: task?.status || 'PENDING',
    milestone: task?.milestone || false,
    critical: task?.critical || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? e.target.checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.patch(`/schedules/tasks/${task.id}`, {
        ...formData,
        progress: parseInt(formData.progress),
        milestone: formData.milestone === 'true' || formData.milestone === true,
        critical: formData.critical === 'true' || formData.critical === true,
      });
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
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Calendar size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">編輯任務</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任務名稱</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">開始日期</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">結束日期</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">進度 (%)</label>
              <input type="number" name="progress" min="0" max="100" value={formData.progress} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="PENDING">待處理</option>
                <option value="IN_PROGRESS">進行中</option>
                <option value="COMPLETED">已完成</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">里程碑</label>
              <select name="milestone" value={String(formData.milestone)} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">要徑任務</label>
              <select name="critical" value={String(formData.critical)} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-zinc-700 to-zinc-800 text-white rounded-lg disabled:opacity-50">
              {loading ? '更新中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Schedules = ({ addToast }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'week' | 'month' | 'quarter'
  const [selectedProject, setSelectedProject] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules/tasks');
      setTasks(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch schedule tasks:', error);
      // No fallback to mock data - show empty state instead
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 篩選任務
  const filteredTasks = useMemo(() => {
    if (selectedProject === 'all') return tasks;
    return tasks.filter(t => t.project === selectedProject);
  }, [tasks, selectedProject]);

  // 取得專案列表
  const projects = useMemo(() => {
    return [...new Set(tasks.map(t => t.project))];
  }, [tasks]);

  // 統計
  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.status === 'COMPLETED').length,
      inProgress: filteredTasks.filter(t => t.status === 'IN_PROGRESS').length,
      critical: filteredTasks.filter(t => t.critical).length,
      milestones: filteredTasks.filter(t => t.milestone).length,
      avgProgress: Math.round(
        filteredTasks.reduce((acc, t) => acc + t.progress, 0) / Math.max(filteredTasks.length, 1)
      ),
    };
  }, [filteredTasks]);

  // 生成日期列表
  const getDaysInView = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    if (viewMode === 'month') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }
    } else if (viewMode === 'week') {
      const start = new Date(currentMonth);
      start.setDate(start.getDate() - start.getDay());
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
      }
    }
    
    return days;
  };

  const days = getDaysInView();

  // 計算任務在甘特圖中的位置
  const getTaskPosition = (task) => {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    const viewStart = days[0];
    const viewEnd = days[days.length - 1];
    
    if (endDate < viewStart || startDate > viewEnd) return null;
    
    const totalDays = days.length;
    const startOffset = Math.max(0, (startDate - viewStart) / (1000 * 60 * 60 * 24));
    const duration = Math.min(
      (endDate - startDate) / (1000 * 60 * 60 * 24) + 1,
      totalDays - startOffset
    );
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const getStatusColor = (status, critical) => {
    if (status === 'COMPLETED') return 'bg-green-500';
    if (critical) return 'bg-red-500';
    if (status === 'IN_PROGRESS') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setCurrentMonth(newDate);
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: '刪除任務',
      message: '確定要刪除此排程任務嗎？此操作無法復原。',
      type: 'danger',
      confirmText: '刪除',
      cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
      await api.delete(`/schedules/tasks/${id}`);
      addToast?.('任務已刪除', 'success');
      setSelectedTask(null);
      fetchTasks();
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
            <Calendar className="text-[#D4AF37]" size={28} />
            工程進度排程
          </h1>
          <p className="text-gray-500 mt-1">甘特圖與要徑分析</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增任務
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">總任務</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-500">進行中</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-gray-500">要徑任務</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-zinc-700">{stats.milestones}</div>
          <div className="text-sm text-gray-500">里程碑</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.avgProgress}%</div>
          <div className="text-sm text-gray-500">平均進度</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {currentMonth.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
          </span>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">所有專案</option>
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="flex rounded-lg border overflow-hidden">
            {['week', 'month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm ${viewMode === mode ? 'bg-[#D4AF37] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {mode === 'week' ? '週' : '月'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">載入中...</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Date Headers */}
            <div className="flex border-b bg-gray-50 sticky top-0 z-10">
              <div className="w-64 flex-shrink-0 p-3 font-semibold border-r">任務名稱</div>
              <div className="flex-1 flex">
                {days.map((day, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 text-center py-2 text-xs border-r last:border-r-0 ${
                      day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-100' : ''
                    }`}
                  >
                    {day.getDate()}
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            {filteredTasks.map(task => {
              const position = getTaskPosition(task);
              return (
                <div key={task.id} className="flex border-b hover:bg-gray-50 transition-colors">
                  <div className="w-64 flex-shrink-0 p-3 border-r flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {task.milestone ? (
                        <Flag size={16} className="text-zinc-600 flex-shrink-0" />
                      ) : task.critical ? (
                        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle size={16} className="text-gray-400 flex-shrink-0" />
                      )}
                      <span className="truncate text-sm">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-1 hover:bg-blue-50 rounded text-blue-600"
                        title="編輯"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(task.id, e)}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                        title="刪除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 relative h-12 flex items-center">
                    {/* Background Grid */}
                    <div className="absolute inset-0 flex">
                      {days.map((day, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 border-r last:border-r-0 ${
                            day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50' : ''
                          }`}
                        />
                      ))}
                    </div>
                    {/* Task Bar */}
                    {position && (
                      <div 
                        className={`absolute h-6 rounded ${getStatusColor(task.status, task.critical)} opacity-80 cursor-pointer hover:opacity-100 transition-opacity`}
                        style={position}
                        title={`${task.name} (${task.progress}%)`}
                      >
                        {task.milestone ? (
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-700 rotate-45" />
                        ) : (
                          <div 
                            className="h-full bg-white/30 rounded-l"
                            style={{ width: `${task.progress}%` }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>進行中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>要徑任務</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-zinc-600" />
          <span>里程碑</span>
        </div>
      </div>

      {/* Add Modal - Enhanced Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">新增排程任務</h2>
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
                  project: fd.get('project'),
                  startDate: fd.get('startDate'),
                  endDate: fd.get('endDate'),
                  milestone: fd.get('milestone') === 'true',
                  critical: fd.get('critical') === 'true',
                  progress: 0,
                  status: 'PENDING',
                };
                try {
                  await api.post('/schedules/tasks', data);
                  addToast?.('任務建立成功', 'success');
                  setShowAddModal(false);
                } catch (error) {
                  addToast?.('建立失敗: ' + (error.response?.data?.message || error.message), 'error');
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Task Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  任務名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="結構體施工"
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    開始日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    結束日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">里程碑</label>
                  <select name="milestone" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <option value="false">否</option>
                    <option value="true">是</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">要徑任務</label>
                  <select name="critical" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <option value="false">否</option>
                    <option value="true">是</option>
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
                  className="px-6 py-2.5 bg-gradient-to-r from-zinc-700 to-zinc-800 text-white rounded-lg hover:from-zinc-800 hover:to-purple-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  建立任務
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <EditScheduleModal
          task={editingTask}
          projects={projects}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            fetchTasks();
            addToast?.('任務已更新', 'success');
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Schedules;
