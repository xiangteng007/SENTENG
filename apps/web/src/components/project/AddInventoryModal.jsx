import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { InputField } from '../common/InputField';

export const AddInventoryModal = ({ isOpen, onClose, onConfirm, allInventory = [], currentUser = '系統' }) => {
    const [selectedItemId, setSelectedItemId] = useState('');
    const [type, setType] = useState('出');
    const [quantity, setQuantity] = useState('1');
    const [note, setNote] = useState('');

    const selectedItem = allInventory.find(item => item.id === selectedItemId);
    const maxQuantity = selectedItem ? selectedItem.quantity : 0;

    const handleConfirm = () => {
        if (!selectedItemId || !quantity || parseInt(quantity) <= 0) {
            alert('請選擇物品並填寫正確的數量');
            return;
        }

        if (type === '出' && parseInt(quantity) > maxQuantity) {
            alert(`庫存不足！目前庫存：${maxQuantity} ${selectedItem.unit}`);
            return;
        }

        const item = allInventory.find(i => i.id === selectedItemId);
        if (item) {
            const inventoryData = {
                id: `inv-${Date.now()}`,
                itemId: item.id,
                itemName: item.name,
                type: type,
                quantity: parseInt(quantity),
                date: new Date().toISOString().split('T')[0],
                operator: currentUser,
                note: note
            };
            onConfirm(inventoryData);
            // Reset
            setSelectedItemId('');
            setQuantity('1');
            setNote('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setSelectedItemId('');
                setQuantity('1');
                setNote('');
                onClose();
            }}
            title="新增庫存記錄"
            onConfirm={handleConfirm}
            confirmText="新增"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                    <div className="flex gap-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="出"
                                checked={type === '出'}
                                onChange={e => setType(e.target.value)}
                                className="mr-2"
                            />
                            <span className="text-red-600 font-medium">出庫</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="入"
                                checked={type === '入'}
                                onChange={e => setType(e.target.value)}
                                className="mr-2"
                            />
                            <span className="text-green-600 font-medium">入庫</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">選擇物品</label>
                    <select
                        value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">請選擇物品...</option>
                        {allInventory.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} (庫存：{item.quantity} {item.unit})
                            </option>
                        ))}
                    </select>
                </div>

                <InputField
                    label="數量"
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="請輸入數量"
                />

                {selectedItem && type === '出' && (
                    <div className={`p-2 rounded-lg text-sm ${parseInt(quantity) > maxQuantity
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                        }`}>
                        目前庫存：{maxQuantity} {selectedItem.unit}
                    </div>
                )}

                <InputField
                    label="備註"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="例：主臥室配電箱"
                />
            </div>
        </Modal>
    );
};
