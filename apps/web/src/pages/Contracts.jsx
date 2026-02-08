/**
 * 合約管理頁面 (Contracts.jsx)
 * 合約列表與詳情
 */

import React, { useState } from 'react';
import ContractService from '../services/ContractService';
import ContractDetail from '../components/contracts/ContractDetail';
import ContractList from '../components/contracts/ContractList';

// ============================================
// 主元件
// ============================================
const Contracts = ({ addToast }) => {
    const [viewMode, setViewMode] = useState('list');
    const [selectedContract, setSelectedContract] = useState(null);

    const handleView = (contract) => {
        setSelectedContract(contract);
        setViewMode('detail');
    };

    const handleBack = () => {
        setSelectedContract(null);
        setViewMode('list');
    };

    const handleRefresh = async () => {
        if (selectedContract) {
            const updated = await ContractService.getContract(selectedContract.id);
            setSelectedContract(updated);
        }
    };

    if (viewMode === 'detail' && selectedContract) {
        return (
            <ContractDetail
                contract={selectedContract}
                onBack={handleBack}
                onRefresh={handleRefresh}
                addToast={addToast}
            />
        );
    }

    return (
        <ContractList
            onView={handleView}
            addToast={addToast}
        />
    );
};

export default Contracts;
