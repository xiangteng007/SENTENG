/**
 * Widget Grid System
 * Phase C: Bento Box Dashboard Layout
 * Supports drag-drop, resize, and persistence
 */

import { useState, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { 
  GripVertical, 
  Maximize2, 
  Minimize2, 
  X, 
  Plus,
  RotateCcw
} from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget size presets (columns x rows)
const _WIDGET_SIZES = {
  '1x1': { w: 1, h: 1 },
  '2x1': { w: 2, h: 1 },
  '2x2': { w: 2, h: 2 },
  '3x2': { w: 3, h: 2 },
  '4x2': { w: 4, h: 2 }
};

// Default layout configuration
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'stats-revenue', x: 0, y: 0, w: 1, h: 1 },
    { i: 'stats-projects', x: 1, y: 0, w: 1, h: 1 },
    { i: 'stats-clients', x: 2, y: 0, w: 1, h: 1 },
    { i: 'stats-tasks', x: 3, y: 0, w: 1, h: 1 },
    { i: 'chart-revenue', x: 0, y: 1, w: 2, h: 2 },
    { i: 'chart-projects', x: 2, y: 1, w: 2, h: 2 },
    { i: 'activities', x: 0, y: 3, w: 2, h: 2 },
    { i: 'schedule', x: 2, y: 3, w: 2, h: 2 },
  ],
  md: [
    { i: 'stats-revenue', x: 0, y: 0, w: 1, h: 1 },
    { i: 'stats-projects', x: 1, y: 0, w: 1, h: 1 },
    { i: 'stats-clients', x: 0, y: 1, w: 1, h: 1 },
    { i: 'stats-tasks', x: 1, y: 1, w: 1, h: 1 },
    { i: 'chart-revenue', x: 0, y: 2, w: 2, h: 2 },
    { i: 'chart-projects', x: 0, y: 4, w: 2, h: 2 },
    { i: 'activities', x: 0, y: 6, w: 2, h: 2 },
    { i: 'schedule', x: 0, y: 8, w: 2, h: 2 },
  ],
  sm: [
    { i: 'stats-revenue', x: 0, y: 0, w: 2, h: 1 },
    { i: 'stats-projects', x: 0, y: 1, w: 2, h: 1 },
    { i: 'stats-clients', x: 0, y: 2, w: 2, h: 1 },
    { i: 'stats-tasks', x: 0, y: 3, w: 2, h: 1 },
    { i: 'chart-revenue', x: 0, y: 4, w: 2, h: 2 },
    { i: 'chart-projects', x: 0, y: 6, w: 2, h: 2 },
    { i: 'activities', x: 0, y: 8, w: 2, h: 2 },
    { i: 'schedule', x: 0, y: 10, w: 2, h: 2 },
  ]
};

// Widget wrapper component with Carbon Copper styling
export const WidgetContainer = ({ 
  children, 
  title, 
  icon: Icon,
  onRemove,
  onMaximize,
  isMaximized = false,
  className = ''
}) => {
  return (
    <div className={`
      h-full flex flex-col
      bg-white rounded-xl
      border border-stone-200
      shadow-md hover:shadow-lg
      transition-shadow duration-200
      overflow-hidden
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
        <div className="flex items-center gap-2">
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-stone-200 rounded transition-colors">
            <GripVertical className="w-4 h-4 text-stone-400" />
          </div>
          {Icon && <Icon className="w-4 h-4 text-stone-500" />}
          <h3 className="font-medium text-stone-700 text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {onMaximize && (
            <button 
              onClick={onMaximize}
              className="p-1.5 hover:bg-stone-200 rounded transition-colors"
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
              )}
            </button>
          )}
          {onRemove && (
            <button 
              onClick={onRemove}
              className="p-1.5 hover:bg-red-100 rounded transition-colors group"
            >
              <X className="w-3.5 h-3.5 text-stone-400 group-hover:text-red-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {children}
      </div>
    </div>
  );
};

// Main Widget Grid component
export const WidgetGrid = ({ 
  children, 
  layouts = DEFAULT_LAYOUTS,
  onLayoutChange,
  isEditing = false 
}) => {
  const [currentLayouts, setCurrentLayouts] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('senteng_dashboard_layouts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return layouts;
      }
    }
    return layouts;
  });

  const handleLayoutChange = useCallback((layout, allLayouts) => {
    setCurrentLayouts(allLayouts);
    localStorage.setItem('senteng_dashboard_layouts', JSON.stringify(allLayouts));
    onLayoutChange?.(layout, allLayouts);
  }, [onLayoutChange]);

  const handleResetLayout = useCallback(() => {
    setCurrentLayouts(DEFAULT_LAYOUTS);
    localStorage.removeItem('senteng_dashboard_layouts');
  }, []);

  return (
    <div className="relative">
      {isEditing && (
        <div className="absolute top-0 right-0 z-10 flex gap-2 p-2">
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置布局
          </button>
        </div>
      )}
      
      <ResponsiveGridLayout
        className="layout"
        layouts={currentLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 4, md: 2, sm: 2 }}
        rowHeight={180}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        preventCollision={false}
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
};

// Widget catalog for adding new widgets
export const WidgetCatalog = ({ onAddWidget, isOpen, onClose }) => {
  const availableWidgets = [
    { id: 'stats-revenue', name: '營收統計', size: '1x1', icon: '💰' },
    { id: 'stats-projects', name: '專案數量', size: '1x1', icon: '📊' },
    { id: 'stats-clients', name: '客戶數量', size: '1x1', icon: '👥' },
    { id: 'stats-tasks', name: '待辦事項', size: '1x1', icon: '✅' },
    { id: 'chart-revenue', name: '營收趨勢圖', size: '2x2', icon: '📈' },
    { id: 'chart-projects', name: '專案狀態', size: '2x2', icon: '🎯' },
    { id: 'activities', name: '最近活動', size: '2x2', icon: '🔔' },
    { id: 'schedule', name: '今日行程', size: '2x2', icon: '📅' },
    { id: 'quick-entry', name: '快速記帳', size: '2x1', icon: '⚡' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800">新增 Widget</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
          {availableWidgets.map(widget => (
            <button
              key={widget.id}
              onClick={() => {
                onAddWidget(widget);
                onClose();
              }}
              className="flex items-center gap-3 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 hover:border-stone-300 transition-all text-left group"
            >
              <span className="text-2xl">{widget.icon}</span>
              <div>
                <div className="font-medium text-stone-800">{widget.name}</div>
                <div className="text-xs text-stone-400">{widget.size}</div>
              </div>
              <Plus className="w-4 h-4 text-stone-300 ml-auto group-hover:text-stone-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default WidgetGrid;
