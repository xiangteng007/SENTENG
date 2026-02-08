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
import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';

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
