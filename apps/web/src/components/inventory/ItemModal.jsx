/**
 * 庫存品項新增/編輯 Modal
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { InputField } from '../../components/common/InputField';

// 庫存類別 - 兩層結構
const CATEGORY_TREE = {
    '結構板材': ['木料', '板材', '防火板', '輕鋼架'],
    '裝飾建材': ['地面材料', '牆面材料', '天花材料', '塗料油漆'],
    '機電設備': ['電氣電線', '燈具照明', '開關插座', '弱電設備', '水管衛浴'],
    '五金配件': ['門窗五金', '櫃體五金', '結構五金', '裝飾五金'],
    '消耗品': ['黏著劑', '填縫材料', '防護用品', '清潔用品']
};

// 計算狀態
const calculateStatus = (quantity, safeStock) => {
    if (quantity <= 0) return '缺貨';
    if (quantity < safeStock) return '庫存偏低';
    return '充足';
};

// 根據子類別找主類別
const getMainCategory = (subCategory) => {
    for (const [main, subs] of Object.entries(CATEGORY_TREE)) {
        if (subs.includes(subCategory)) return main;
    }
    return '消耗品';
};

const ItemModal = ({ isOpen, onClose, item, onSave, isEdit }) => {
    const [form, setForm] = useState({
        name: '', spec: '', mainCategory: '消耗品', category: '黏著劑', quantity: 0,
        unit: '個', safeStock: 10, location: '', status: '充足'
    });

    useEffect(() => {
        if (item) {
            const mainCat = item.mainCategory || getMainCategory(item.category);
            setForm({ ...item, mainCategory: mainCat });
        } else {
            setForm({
                name: '', spec: '', mainCategory: '消耗品', category: '黏著劑', quantity: 0,
                unit: '個', safeStock: 10, location: '', status: '充足'
            });
        }
    }, [item, isOpen]);

    const handleMainCategoryChange = (newMain) => {
        const subCats = CATEGORY_TREE[newMain] || [];
        setForm({
            ...form,
            mainCategory: newMain,
            category: subCats[0] || ''
        });
    };

    const handleSave = () => {
        const status = calculateStatus(parseInt(form.quantity), parseInt(form.safeStock));
        onSave({ ...form, quantity: parseInt(form.quantity), safeStock: parseInt(form.safeStock), status });
    };

    const availableSubCategories = CATEGORY_TREE[form.mainCategory] || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? '編輯庫存品項' : '新增庫存品項'}
            onConfirm={handleSave}
        >
            <div className="space-y-4">
                <InputField
                    label="品項名稱"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="例：Panasonic 開關"
                />
                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="規格/型號"
                        value={form.spec}
                        onChange={e => setForm({ ...form, spec: e.target.value })}
                        placeholder="例：PN-001"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">主類別</label>
                        <select
                            value={form.mainCategory}
                            onChange={e => handleMainCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.keys(CATEGORY_TREE).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">子類別</label>
                        <select
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {availableSubCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <InputField
                        label="單位"
                        value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}
                        placeholder="個、組、箱"
                    />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <InputField
                        label="數量"
                        type="number"
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                    />
                    <InputField
                        label="安全庫存"
                        type="number"
                        value={form.safeStock}
                        onChange={e => setForm({ ...form, safeStock: e.target.value })}
                    />
                    <InputField
                        label="存放位置"
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                        placeholder="A-01"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ItemModal;
