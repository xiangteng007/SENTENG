/**
 * ConflictResolver.jsx
 * 
 * Modal dialog for resolving data conflicts between local and server versions.
 * Displays side-by-side comparison and lets user choose which version to keep.
 */

import React, { useState } from 'react';
import { AlertTriangle, Check, X, RefreshCw, Clock, Server, Smartphone } from 'lucide-react';

/**
 * Conflict resolver modal component
 * 
 * @param {Object} conflict - The conflict object with local and server data
 * @param {Function} onResolve - Callback when conflict is resolved
 * @param {Function} onDismiss - Callback to dismiss without resolving
 */
export function ConflictResolver({ conflict, onResolve, onDismiss }) {
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [isResolving, setIsResolving] = useState(false);

    if (!conflict) return null;

    const { entityType, entityId, localData, serverData, localTimestamp, serverTimestamp } = conflict;

    const handleResolve = async () => {
        if (!selectedVersion) return;

        setIsResolving(true);
        try {
            await onResolve(selectedVersion === 'local' ? localData : serverData, selectedVersion);
        } finally {
            setIsResolving(false);
        }
    };

    // Format field for display
    const formatValue = (value) => {
        if (value === null || value === undefined) return '(空)';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    // Get changed fields
    const getChangedFields = () => {
        const fields = new Set([
            ...Object.keys(localData || {}),
            ...Object.keys(serverData || {})
        ]);

        return Array.from(fields).filter(field => {
            const localVal = JSON.stringify(localData?.[field]);
            const serverVal = JSON.stringify(serverData?.[field]);
            return localVal !== serverVal;
        }).filter(field => !['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(field));
    };

    const changedFields = getChangedFields();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 border-b border-amber-200">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <div>
                        <h2 className="text-lg font-semibold text-amber-800">資料衝突</h2>
                        <p className="text-sm text-amber-600">
                            {entityType} #{entityId} 在本地和伺服器都有變更
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Version comparison */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Local Version */}
                        <div
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedVersion === 'local'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => setSelectedVersion('local')}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Smartphone className="w-5 h-5 text-blue-600" />
                                <span className="font-medium">本地版本</span>
                                {selectedVersion === 'local' && (
                                    <Check className="w-4 h-4 text-blue-600 ml-auto" />
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                <Clock className="w-3 h-3" />
                                {localTimestamp ? new Date(localTimestamp).toLocaleString('zh-TW') : '未知時間'}
                            </div>
                        </div>

                        {/* Server Version */}
                        <div
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedVersion === 'server'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => setSelectedVersion('server')}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Server className="w-5 h-5 text-green-600" />
                                <span className="font-medium">伺服器版本</span>
                                {selectedVersion === 'server' && (
                                    <Check className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                <Clock className="w-3 h-3" />
                                {serverTimestamp ? new Date(serverTimestamp).toLocaleString('zh-TW') : '未知時間'}
                            </div>
                        </div>
                    </div>

                    {/* Changed fields comparison */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">欄位</th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-700">本地值</th>
                                    <th className="px-4 py-2 text-left font-medium text-green-700">伺服器值</th>
                                </tr>
                            </thead>
                            <tbody>
                                {changedFields.map((field, idx) => (
                                    <tr key={field} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-2 font-medium text-gray-600">{field}</td>
                                        <td className="px-4 py-2 text-blue-800">
                                            <pre className="whitespace-pre-wrap text-xs">
                                                {formatValue(localData?.[field])}
                                            </pre>
                                        </td>
                                        <td className="px-4 py-2 text-green-800">
                                            <pre className="whitespace-pre-wrap text-xs">
                                                {formatValue(serverData?.[field])}
                                            </pre>
                                        </td>
                                    </tr>
                                ))}
                                {changedFields.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                                            無法偵測到具體差異
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-50 border-t">
                    <button
                        onClick={onDismiss}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        稍後處理
                    </button>
                    <button
                        onClick={handleResolve}
                        disabled={!selectedVersion || isResolving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isResolving ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                處理中...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                使用選擇的版本
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConflictResolver;
