/**
 * 出入庫 Modal
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { InputField } from '../../components/common/InputField';

const StockMovementModal = ({ isOpen, onClose, item, type, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    useEffect(() => {
        setQuantity(1);
        setNote('');
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm({
            itemId: item.id,
            itemName: item.name,
            type: type,
            quantity: parseInt(quantity),
            date: new Date().toISOString().split('T')[0],
            operator: 'Admin',
            note
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === '入' ? '入庫登記' : '出庫登記'}
            onConfirm={handleConfirm}
        >
            <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500">品項</div>
                    <div className="font-bold text-gray-800">{item?.name}</div>
                    <div className="text-xs text-gray-400">{item?.spec}</div>
                    <div className="mt-2 text-sm">
                        當前數量: <span className="font-bold">{item?.quantity}</span> {item?.unit}
                    </div>
                </div>
                <InputField
                    label={`${type === '入' ? '入庫' : '出庫'}數量`}
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    min={1}
                />
                <InputField
                    label="備註"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={type === '入' ? '例：批量採購' : '例：出貨至林公館'}
                />
                {type === '出' && parseInt(quantity) > (item?.quantity || 0) && (
                    <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertTriangle size={14} />
                        出庫數量超過庫存！
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default StockMovementModal;
