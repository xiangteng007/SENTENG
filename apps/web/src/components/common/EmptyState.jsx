import React from 'react';
import { Inbox, Plus, Search, FileX, Database } from 'lucide-react';

/**
 * EmptyState Component (UX-001)
 * Unified empty state display for lists and data views
 */
const ICONS = {
  default: Inbox,
  search: Search,
  file: FileX,
  data: Database,
};

export const EmptyState = ({
  icon = 'default',
  title = '沒有資料',
  description = '目前沒有可顯示的內容',
  actionLabel,
  onAction,
  className = '',
}) => {
  const IconComponent = ICONS[icon] || ICONS.default;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <IconComponent className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
