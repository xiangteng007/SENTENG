/**
 * Animated Empty State Components
 * Design System v4.0: Modern Dark Gold
 * Expert Panel v4.9: Motion Graphics Designer 建議 - Lottie-like animations via CSS
 */

// Animated Empty State Components
import { 
  FileText, Search, Inbox, Calendar, 
  ShoppingCart, Users, BarChart3, Folder,
  AlertCircle, CheckCircle
} from 'lucide-react';

// CSS Animation for floating effect
const floatAnimation = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
`;

// Inject animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = floatAnimation;
  if (!document.head.querySelector('#empty-state-animations')) {
    style.id = 'empty-state-animations';
    document.head.appendChild(style);
  }
}

// Base Empty State Component
const EmptyStateBase = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  color = 'zinc',
  animate = true 
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div 
      className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6
        bg-gradient-to-br from-${color}-100 to-${color}-200`}
      style={{ animation: animate ? 'float 3s ease-in-out infinite' : 'none' }}
    >
      <Icon size={36} className={`text-${color}-500`} />
    </div>
    <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
    <p className="text-zinc-500 text-sm max-w-sm mb-6">{description}</p>
    {action && (
      <button 
        onClick={action.onClick}
        className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-medium 
          hover:bg-zinc-800 transition-colors flex items-center gap-2"
      >
        {action.icon && <action.icon size={18} />}
        {action.label}
      </button>
    )}
  </div>
);

// Pre-built Empty States
export const EmptyStates = {
  // No data found
  NoData: ({ onAction }) => (
    <EmptyStateBase
      icon={Inbox}
      title="目前沒有資料"
      description="尚未有任何資料記錄。點擊下方按鈕開始新增。"
      action={onAction ? { label: '新增資料', onClick: onAction } : null}
    />
  ),

  // No search results
  NoSearchResults: ({ searchTerm, onClear }) => (
    <EmptyStateBase
      icon={Search}
      title="找不到相符結果"
      description={`搜尋「${searchTerm}」沒有找到任何結果。請嘗試其他關鍵字。`}
      action={onClear ? { label: '清除搜尋', onClick: onClear } : null}
      color="blue"
    />
  ),

  // No projects
  NoProjects: ({ onAction }) => (
    <EmptyStateBase
      icon={Folder}
      title="尚無專案"
      description="開始建立您的第一個專案，追蹤進度與管理資源。"
      action={onAction ? { label: '建立專案', onClick: onAction } : null}
      color="amber"
    />
  ),

  // No transactions
  NoTransactions: ({ onAction }) => (
    <EmptyStateBase
      icon={BarChart3}
      title="尚無交易記錄"
      description="開始記錄收入與支出，輕鬆掌握財務狀況。"
      action={onAction ? { label: '新增交易', onClick: onAction } : null}
      color="green"
    />
  ),

  // No events
  NoEvents: ({ onAction }) => (
    <EmptyStateBase
      icon={Calendar}
      title="尚無行程"
      description="您的日曆是空的。新增行程來追蹤重要事項。"
      action={onAction ? { label: '新增行程', onClick: onAction } : null}
      color="purple"
    />
  ),

  // No inventory
  NoInventory: ({ onAction }) => (
    <EmptyStateBase
      icon={ShoppingCart}
      title="庫存清單為空"
      description="開始新增材料與設備，有效管理庫存。"
      action={onAction ? { label: '新增品項', onClick: onAction } : null}
      color="cyan"
    />
  ),

  // No contacts
  NoContacts: ({ onAction }) => (
    <EmptyStateBase
      icon={Users}
      title="尚無聯絡人"
      description="新增客戶、廠商或合作夥伴的聯絡資訊。"
      action={onAction ? { label: '新增聯絡人', onClick: onAction } : null}
      color="rose"
    />
  ),

  // No documents
  NoDocuments: ({ onAction }) => (
    <EmptyStateBase
      icon={FileText}
      title="尚無文件"
      description="上傳或建立文件，集中管理所有檔案。"
      action={onAction ? { label: '上傳文件', onClick: onAction } : null}
      color="slate"
    />
  ),

  // Error state
  Error: ({ message, onRetry }) => (
    <EmptyStateBase
      icon={AlertCircle}
      title="發生錯誤"
      description={message || "載入資料時發生問題，請稍後再試。"}
      action={onRetry ? { label: '重新載入', onClick: onRetry } : null}
      color="red"
      animate={false}
    />
  ),

  // Success state
  Success: ({ message }) => (
    <EmptyStateBase
      icon={CheckCircle}
      title="操作成功"
      description={message || "您的操作已成功完成。"}
      color="green"
    />
  ),

  // All done
  AllDone: () => (
    <EmptyStateBase
      icon={CheckCircle}
      title="已全部完成 🎉"
      description="太棒了！目前沒有待處理的項目。"
      color="green"
    />
  ),

  // Coming soon
  ComingSoon: ({ feature }) => (
    <EmptyStateBase
      icon={AlertCircle}
      title="即將推出"
      description={`${feature || '此功能'}正在開發中，敬請期待！`}
      color="amber"
    />
  ),
};

// Gold-accented Empty State (matches Modern Dark Gold theme)
export const GoldEmptyState = ({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action 
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div 
      className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6
        bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-xl"
      style={{ animation: 'float 3s ease-in-out infinite' }}
    >
      <Icon size={40} className="text-[#D4AF37]" />
    </div>
    <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
    <p className="text-zinc-500 max-w-md mb-6">{description}</p>
    {action && (
      <button 
        onClick={action.onClick}
        className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-white 
          rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all 
          hover:scale-105 flex items-center gap-2"
      >
        {action.icon && <action.icon size={20} />}
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyStates;
