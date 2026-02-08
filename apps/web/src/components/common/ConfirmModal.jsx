/**
 * ConfirmModal - 確認對話框組件
 * 用於替代 window.confirm，提供更好的 UX 和統一的設計
 */
import { useState } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle, HelpCircle } from 'lucide-react';

// Confirm types with different icons and colors
const CONFIRM_TYPES = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: HelpCircle,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '確認操作',
  message,
  confirmText = '確認',
  cancelText = '取消',
  type = 'warning', // danger, warning, info, success
  loading = false,
}) => {
  if (!isOpen) return null;

  const config = CONFIRM_TYPES[type] || CONFIRM_TYPES.warning;
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${config.iconBg} flex-shrink-0`}>
              <Icon size={24} className={config.iconColor} />
            </div>
            <div className="flex-1">
              <p className="text-gray-700">{message}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 ${config.buttonClass}`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * useConfirm hook - 方便在組件中使用確認對話框
 * 
 * Usage:
 * const { confirm, ConfirmDialog } = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: '確認刪除',
 *     message: '確定要刪除此項目嗎？',
 *     type: 'danger',
 *     confirmText: '刪除'
 *   });
 *   if (confirmed) {
 *     // perform delete
 *   }
 * };
 * 
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 */
export const useConfirm = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: '確認',
    cancelText: '取消',
    resolve: null,
    loading: false,
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || '確認操作',
        message: options.message || '確定要執行此操作嗎？',
        type: options.type || 'warning',
        confirmText: options.confirmText || '確認',
        cancelText: options.cancelText || '取消',
        resolve,
        loading: false,
      });
    });
  };

  const handleClose = () => {
    if (state.resolve) {
      state.resolve(false);
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (state.resolve) {
      state.resolve(true);
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const ConfirmDialog = () => (
    <ConfirmModal
      isOpen={state.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.title}
      message={state.message}
      type={state.type}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      loading={state.loading}
    />
  );

  return { confirm, ConfirmDialog };
};

export default ConfirmModal;
