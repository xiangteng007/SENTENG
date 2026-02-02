import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart3
} from 'lucide-react';

export const Schedules = ({ addToast }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'week' | 'month' | 'quarter'
  const [selectedProject, setSelectedProject] = useState('all');

  // Mock data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTasks([
        {
          id: '1',
          name: '基礎開挖',
          project: '信義豪宅案',
          startDate: '2026-01-05',
          endDate: '2026-01-20',
          progress: 100,
          status: 'COMPLETED',
          milestone: false,
          critical: true,
          dependencies: [],
        },
        {
          id: '2',
          name: '結構體施工',
          project: '信義豪宅案',
          startDate: '2026-01-18',
          endDate: '2026-02-28',
          progress: 45,
          status: 'IN_PROGRESS',
          milestone: false,
          critical: true,
          dependencies: ['1'],
        },
        {
          id: '3',
          name: '1F 結構完成',
          project: '信義豪宅案',
          startDate: '2026-02-05',
          endDate: '2026-02-05',
          progress: 100,
          status: 'COMPLETED',
          milestone: true,
          critical: true,
          dependencies: ['2'],
        },
        {
          id: '4',
          name: '水電管線配置',
          project: '信義豪宅案',
          startDate: '2026-02-01',
          endDate: '2026-02-20',
          progress: 60,
          status: 'IN_PROGRESS',
          milestone: false,
          critical: false,
          dependencies: ['3'],
        },
        {
          id: '5',
          name: '外牆施工',
          project: '大同商辦案',
          startDate: '2026-01-15',
          endDate: '2026-02-15',
          progress: 75,
          status: 'IN_PROGRESS',
          milestone: false,
          critical: true,
          dependencies: [],
        },
        {
          id: '6',
          name: '室內裝修',
          project: '大同商辦案',
          startDate: '2026-02-10',
          endDate: '2026-03-15',
          progress: 10,
          status: 'IN_PROGRESS',
          milestone: false,
          critical: false,
          dependencies: ['5'],
        },
      ]);
      setLoading(false);
    }, 300);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-indigo-500" size={28} />
            工程進度排程
          </h1>
          <p className="text-gray-500 mt-1">甘特圖與要徑分析</p>
        </div>
        <button 
          onClick={() => addToast?.('功能開發中', 'info')}
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
          <div className="text-2xl font-bold text-purple-600">{stats.milestones}</div>
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
                className={`px-3 py-1.5 text-sm ${viewMode === mode ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
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
                  <div className="w-64 flex-shrink-0 p-3 border-r flex items-center gap-2">
                    {task.milestone ? (
                      <Flag size={16} className="text-purple-500" />
                    ) : task.critical ? (
                      <AlertTriangle size={16} className="text-red-500" />
                    ) : (
                      <CheckCircle size={16} className="text-gray-400" />
                    )}
                    <span className="truncate text-sm">{task.name}</span>
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
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-600 rotate-45" />
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
          <Flag size={16} className="text-purple-500" />
          <span>里程碑</span>
        </div>
      </div>
    </div>
  );
};

export default Schedules;
