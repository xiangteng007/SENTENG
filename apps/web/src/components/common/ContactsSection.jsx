/**
 * ContactsSection.jsx
 * 
 * 聯絡人區塊元件（用於客戶/廠商詳情頁）
 * 含 Google Contacts 同步功能
 */

import { useState } from 'react';
import { Phone, Mail, Plus, RefreshCw, Users } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useGoogleIntegrationStatus } from '../../hooks/useGoogleIntegrationStatus';
import { syncContactToGoogle, syncClientContactsToGoogle, syncVendorContactsToGoogle } from '../../services/contactsSyncApi';

/**
 * ContactsSection - 聯絡人區塊
 * 
 * @param {Object} props
 * @param {Array} props.contacts - 聯絡人列表
 * @param {'client' | 'vendor'} props.entityType - 實體類型
 * @param {string} props.entityId - 實體 ID（客戶 ID 或廠商 ID）
 * @param {Function} props.onRefresh - 刷新回調
 * @param {Function} props.addToast - Toast 訊息回調
 * @param {Function} props.onAddContact - 新增聯絡人回調（可選）
 */
export function ContactsSection({
    contacts = [],
    entityType,
    entityId,
    onRefresh,
    addToast,
    onAddContact
}) {
    const { hasAction } = useAuth();
    const { data: googleStatus } = useGoogleIntegrationStatus();
    const [syncingId, setSyncingId] = useState(null);
    const [syncingAll, setSyncingAll] = useState(false);

    // RBAC 權限檢查
    const canSyncContact = hasAction?.('integrations.google.contacts', 'sync_contact') ?? false;
    const canSyncClient = hasAction?.('integrations.google.contacts', 'sync_client') ?? false;
    const canSyncVendor = hasAction?.('integrations.google.contacts', 'sync_vendor') ?? false;
    const canSyncAll = entityType === 'client' ? canSyncClient : canSyncVendor;

    // 單筆同步
    const handleSyncContact = async (contactId) => {
        if (!googleStatus?.connected) {
            addToast?.('請先連結 Google 帳號', 'warning');
            return;
        }

        setSyncingId(contactId);
        try {
            await syncContactToGoogle(contactId);
            addToast?.('聯絡人已同步至 Google', 'success');
            onRefresh?.();
        } catch (error) {
            console.error('Sync contact failed:', error);
            addToast?.(`同步失敗: ${error.message}`, 'error');
        } finally {
            setSyncingId(null);
        }
    };

    // 同步全部
    const handleSyncAll = async () => {
        if (!googleStatus?.connected) {
            addToast?.('請先連結 Google 帳號', 'warning');
            return;
        }

        setSyncingAll(true);
        try {
            const syncFn = entityType === 'client' ? syncClientContactsToGoogle : syncVendorContactsToGoogle;
            const result = await syncFn(entityId);

            if (result?.synced > 0) {
                addToast?.(`已同步 ${result.synced} 筆聯絡人`, 'success');
            } else {
                addToast?.('沒有需要同步的聯絡人', 'info');
            }
            onRefresh?.();
        } catch (error) {
            console.error('Sync all contacts failed:', error);
            addToast?.(`同步失敗: ${error.message}`, 'error');
        } finally {
            setSyncingAll(false);
        }
    };

    const isGoogleConnected = googleStatus?.connected === true;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Users size={18} />
                    聯絡人
                </h3>
                <div className="flex items-center gap-2">
                    {/* Sync All Button */}
                    {canSyncAll && contacts.length > 0 && (
                        <button
                            onClick={handleSyncAll}
                            disabled={!isGoogleConnected || syncingAll}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={!isGoogleConnected ? '請先連結 Google 帳號' : '同步所有聯絡人至 Google'}
                        >
                            <RefreshCw size={14} className={syncingAll ? 'animate-spin' : ''} />
                            {syncingAll ? '同步中...' : 'Sync all'}
                        </button>
                    )}

                    {/* Add Contact Button */}
                    {onAddContact && (
                        <button
                            onClick={onAddContact}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <Plus size={14} />
                            新增
                        </button>
                    )}
                </div>
            </div>

            {/* Contacts Table */}
            {contacts.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-3 text-gray-500 font-medium">姓名</th>
                                <th className="text-left py-2 px-3 text-gray-500 font-medium">電話</th>
                                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden sm:table-cell">Email</th>
                                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">職稱</th>
                                <th className="text-center py-2 px-3 text-gray-500 font-medium">狀態</th>
                                <th className="text-center py-2 px-3 text-gray-500 font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map(contact => (
                                <tr key={contact.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                                {contact.name?.[0] || '?'}
                                            </div>
                                            <span className="font-medium text-gray-800">{contact.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-gray-600">
                                        {contact.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone size={12} className="text-gray-400" />
                                                {contact.phone}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-gray-600 hidden sm:table-cell">
                                        {contact.email && (
                                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                                                <Mail size={12} className="text-gray-400" />
                                                {contact.email}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-gray-600 hidden md:table-cell">
                                        {contact.title || '-'}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <SyncStatusBadge
                                            status={contact.syncStatus || 'PENDING'}
                                            error={contact.lastSyncError}
                                        />
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        {canSyncContact && (
                                            <button
                                                onClick={() => handleSyncContact(contact.id)}
                                                disabled={!isGoogleConnected || syncingId === contact.id || contact.syncStatus === 'DISABLED'}
                                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                title={!isGoogleConnected ? '請先連結 Google 帳號' : '同步至 Google Contacts'}
                                            >
                                                {syncingId === contact.id ? (
                                                    <RefreshCw size={14} className="animate-spin" />
                                                ) : (
                                                    'Sync'
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                    尚無聯絡人資料
                </div>
            )}

            {/* Google Connection Hint */}
            {!isGoogleConnected && contacts.length > 0 && (canSyncContact || canSyncAll) && (
                <div className="mt-4 p-3 bg-amber-50 text-amber-700 text-xs rounded-lg flex items-center gap-2">
                    <RefreshCw size={14} />
                    請先至「設定 → 整合」連結 Google 帳號以啟用同步功能
                </div>
            )}
        </div>
    );
}

export default ContactsSection;
