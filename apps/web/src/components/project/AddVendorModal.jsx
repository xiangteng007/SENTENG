import { useState } from 'react';
import { Modal } from '../common/Modal';
import { InputField } from '../common/InputField';

export const AddVendorModal = ({ isOpen, onClose, onConfirm, allVendors = [] }) => {
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [role, setRole] = useState('');

    const handleConfirm = () => {
        if (!selectedVendorId || !role) {
            alert('請選擇廠商並填寫角色');
            return;
        }

        const vendor = allVendors.find(v => v.id === selectedVendorId);
        if (vendor) {
            const vendorData = {
                vendorId: vendor.id,
                name: vendor.name,
                role: role,
                joinDate: new Date().toISOString().split('T')[0],
                status: '待開始'
            };
            onConfirm(vendorData);
            // Reset
            setSelectedVendorId('');
            setRole('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setSelectedVendorId('');
                setRole('');
                onClose();
            }}
            title="新增專案廠商"
            onConfirm={handleConfirm}
            confirmText="新增"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">選擇廠商</label>
                    <select
                        value={selectedVendorId}
                        onChange={e => setSelectedVendorId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">請選擇廠商...</option>
                        {allVendors.map(vendor => (
                            <option key={vendor.id} value={vendor.id}>
                                {vendor.name} - {vendor.tradeType}
                            </option>
                        ))}
                    </select>
                </div>

                <InputField
                    label="角色/工種"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="例：木工施作、水電配線"
                />

                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                    💡 提示：選擇的廠商將加入此專案，狀態預設為「待開始」
                </div>
            </div>
        </Modal>
    );
};
