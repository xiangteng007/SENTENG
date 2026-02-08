/**
 * 刪除確認 Modal
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

const DeleteConfirmModal = ({ isOpen, onClose, item, onConfirm }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="確認刪除" onConfirm={onConfirm}>
        <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
            </div>
            <p className="text-gray-600">確定要刪除以下品項嗎？</p>
            <p className="font-bold text-gray-800 mt-2">{item?.name}</p>
            <p className="text-sm text-gray-500">{item?.spec}</p>
            <p className="text-sm text-red-500 mt-4">此操作無法還原</p>
        </div>
    </Modal>
);

export default DeleteConfirmModal;
