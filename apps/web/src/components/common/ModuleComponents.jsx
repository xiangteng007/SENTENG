/**
 * Professional Module Components
 * Phase E: Finance/Projects/Inventory Enhancements
 * Carbon Copper Industrial Theme
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

// Enhanced Stat Card with Carbon Copper styling
export const StatCardPro = ({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon: Icon, 
  trend = 'up',
  accentColor = 'copper', // 'copper' | 'gold' | 'carbon' | 'success' | 'warning' | 'danger'
  size = 'default' // 'default' | 'large'
}) => {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const accentColors = {
    copper: 'from-[#CD6839] to-[#B8522A]',
    gold: 'from-[#D4AF37] to-[#B8960C]',
    carbon: 'from-[#292524] to-[#1C1917]',
    success: 'from-emerald-500 to-emerald-600',
    warning: 'from-amber-500 to-amber-600',
    danger: 'from-rose-500 to-rose-600'
  };

  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-rose-600 bg-rose-50',
    neutral: 'text-stone-500 bg-stone-50'
  };

  return (
    <div className={`
      bg-white rounded-xl border border-stone-100 
      shadow-md hover:shadow-lg transition-all duration-200
      ${size === 'large' ? 'p-6' : 'p-5'}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
          <p className={`font-bold text-stone-900 ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
            {value}
          </p>
          {change && (
            <div className={`
              inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium
              ${trendColors[trend]}
            `}>
              <TrendIcon size={12} />
              <span>{change}</span>
              {changeLabel && <span className="text-stone-400 ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${accentColors[accentColor]} shadow-lg`}>
            <Icon size={size === 'large' ? 28 : 22} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

// Progress Ring for project/task completion
export const ProgressRing = ({ 
  progress = 0, 
  size = 80, 
  strokeWidth = 6,
  label,
  sublabel
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E7E5E4"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#copperGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CD6839" />
              <stop offset="100%" stopColor="#B8522A" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-stone-900">{progress}%</span>
        </div>
      </div>
      {label && <p className="text-sm font-medium text-stone-700 mt-2">{label}</p>}
      {sublabel && <p className="text-xs text-stone-400">{sublabel}</p>}
    </div>
  );
};

// Alert Card for notifications and warnings
export const AlertCard = ({
  type = 'info', // 'info' | 'success' | 'warning' | 'danger'
  title,
  message,
  action,
  onAction,
  dismissible = true,
  onDismiss
}) => {
  const typeStyles = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600 bg-blue-100',
      title: 'text-blue-900',
      text: 'text-blue-700',
      button: 'text-blue-700 hover:bg-blue-100'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: 'text-emerald-600 bg-emerald-100',
      title: 'text-emerald-900',
      text: 'text-emerald-700',
      button: 'text-emerald-700 hover:bg-emerald-100'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600 bg-amber-100',
      title: 'text-amber-900',
      text: 'text-amber-700',
      button: 'text-amber-700 hover:bg-amber-100'
    },
    danger: {
      bg: 'bg-rose-50 border-rose-200',
      icon: 'text-rose-600 bg-rose-100',
      title: 'text-rose-900',
      text: 'text-rose-700',
      button: 'text-rose-700 hover:bg-rose-100'
    }
  };

  const icons = {
    info: Clock,
    success: CheckCircle,
    warning: AlertTriangle,
    danger: AlertTriangle
  };

  const Icon = icons[type];
  const styles = typeStyles[type];

  return (
    <div className={`rounded-xl border p-4 ${styles.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${styles.icon}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          {title && <p className={`font-medium ${styles.title}`}>{title}</p>}
          {message && <p className={`text-sm mt-0.5 ${styles.text}`}>{message}</p>}
          {action && (
            <button 
              onClick={onAction}
              className={`mt-2 text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${styles.button}`}
            >
              {action}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
        {dismissible && (
          <button 
            onClick={onDismiss}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            <span className="sr-only">關閉</span>
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Kanban-style status card for projects
export const StatusCard = ({
  title,
  items = [],
  color = 'copper', // 'copper' | 'gold' | 'carbon' | 'blue' | 'green' | 'orange'
  onItemClick,
  viewAllLink
}) => {
  const colorMap = {
    copper: 'bg-[#CD6839]',
    gold: 'bg-[#D4AF37]',
    carbon: 'bg-stone-800',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Header with color accent */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
        <div className={`w-3 h-3 rounded-full ${colorMap[color]}`} />
        <h3 className="font-medium text-stone-800">{title}</h3>
        <span className="ml-auto px-2 py-0.5 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
          {items.length}
        </span>
      </div>
      
      {/* Items list */}
      <div className="divide-y divide-stone-50">
        {items.slice(0, 5).map((item, idx) => (
          <button
            key={item.id || idx}
            onClick={() => onItemClick?.(item)}
            className="w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{item.name || item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-stone-400 truncate">{item.subtitle}</p>
              )}
            </div>
            {item.badge && (
              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* View all link */}
      {viewAllLink && items.length > 5 && (
        <a 
          href={viewAllLink}
          className="flex items-center justify-center gap-1 px-4 py-2.5 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-50 border-t border-stone-100 transition-colors"
        >
          查看全部 ({items.length})
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
};

// Inventory level indicator
export const InventoryLevel = ({
  current,
  max,
  min,
  unit = '件',
  showWarning = true
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  const isLow = current <= min;
  
  const getColorClass = () => {
    if (isLow) return 'bg-rose-500';
    if (percentage < 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600">庫存量</span>
        <span className={`font-medium ${isLow ? 'text-rose-600' : 'text-stone-900'}`}>
          {current.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showWarning && isLow && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertTriangle size={12} />
          <span>低於安全庫存量 ({min} {unit})</span>
        </div>
      )}
    </div>
  );
};

export default {
  StatCardPro,
  ProgressRing,
  AlertCard,
  StatusCard,
  InventoryLevel
};
