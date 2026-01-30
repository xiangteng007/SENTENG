/**
 * IntegrationsPage.jsx
 * 
 * Google 整合設定頁面
 * 路由：/settings/integrations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { integrationsApi } from '../services/integrationsApi';
import { SyncStatusBadge } from '../components/common/SyncStatusBadge';

// Card 元件
const Card = ({ title, children }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        {children}
    </div>
);

// 狀態列
const StatusRow = ({ label, value }) => (
    <div className="flex items-center py-2 border-b border-gray-100 last:border-0">
        <span className="w-40 text-sm text-gray-500">{label}</span>
        <span className="text-sm text-gray-800">{value || '-'}</span>
    </div>
);

export default function IntegrationsPage({ addToast }) {
    const { canAccessPage, hasAction } = useAuth();

    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 表單狀態
    const [calendarId, setCalendarId] = useState('');
    const [contactsLabel, setContactsLabel] = useState('Senteng ERP');
    const [autoSyncEvents, setAutoSyncEvents] = useState(true);
    const [autoSyncContacts, setAutoSyncContacts] = useState(true);

    // 取得狀態
    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await integrationsApi.getStatus();
            setStatus(data);
            setCalendarId(data.calendarId || '');
            setContactsLabel(data.contactsLabel || 'Senteng ERP');
            setAutoSyncEvents(data.autoSyncEvents ?? true);
            setAutoSyncContacts(data.autoSyncContacts ?? true);
        } catch (error) {
            console.error('Failed to fetch integration status:', error);
            addToast?.('無法取得整合狀態', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // 連結 Google
    const handleConnect = async () => {
        try {
            const { authUrl } = await integrationsApi.connect();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to connect:', error);
            addToast?.('連結失敗', 'error');
        }
    };

    // 斷開連結
    const handleDisconnect = async () => {
        if (!window.confirm('確定要斷開 Google 連結嗎？')) return;

        try {
            await integrationsApi.disconnect();
            await fetchStatus();
            addToast?.('已斷開連結', 'success');
        } catch (error) {
            console.error('Failed to disconnect:', error);
            addToast?.('斷開失敗', 'error');
        }
    };

    // 儲存設定
    const handleSave = async () => {
        try {
            setSaving(true);
            await integrationsApi.configure({
                calendarId: calendarId.trim() || null,
                contactsLabel: contactsLabel.trim() || null,
                autoSyncEvents,
                autoSyncContacts,
            });
            await fetchStatus();
            addToast?.('設定已儲存', 'success');
        } catch (error) {
            console.error('Failed to save:', error);
            addToast?.('儲存失敗', 'error');
        } finally {
            setSaving(false);
        }
    };

    // 權限檢查 helper（暫時用 roleLevel 判斷）
    const canConnect = hasAction?.('integrations.google', 'connect') ?? true;
    const canDisconnect = hasAction?.('integrations.google', 'disconnect') ?? true;
    const canConfigure = hasAction?.('integrations.google', 'configure') ?? true;
    const canSetCalendar = hasAction?.('integrations.google.calendar', 'set_target_calendar') ?? true;
    const canSetLabel = hasAction?.('integrations.google.contacts', 'set_label') ?? true;

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Integrations</h1>
                <p className="text-gray-500 mt-1">
                    將 ERP 的行事曆與聯絡人同步至 Google，方便手機查看
                </p>
            </div>

            <div className="space-y-6">
                {/* Google Connection Card */}
                <Card title="Google 連結狀態">
                    <div className="space-y-1">
                        <StatusRow label="連結狀態" value={
                            <span className={`font-medium ${status?.connected ? 'text-green-600' : 'text-gray-400'}`}>
                                {status?.connected ? '✓ 已連結' : '未連結'}
                            </span>
                        } />
                        <StatusRow label="Google 帳號" value={status?.googleAccountEmail} />
                        <StatusRow label="最後同步" value={status?.lastSyncedAt} />
                        <StatusRow label="錯誤訊息" value={
                            status?.lastSyncError && (
                                <span className="text-red-600 text-xs">{status.lastSyncError}</span>
                            )
                        } />
                    </div>

                    <div className="flex gap-3 mt-6">
                        {canConnect && (
                            <button
                                onClick={handleConnect}
                                disabled={status?.connected}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                連結 Google
                            </button>
                        )}
                        {canDisconnect && status?.connected && (
                            <button
                                onClick={handleDisconnect}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                斷開連結
                            </button>
                        )}
                        <button
                            onClick={fetchStatus}
                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            重新整理
                        </button>
                    </div>
                </Card>

                {/* Calendar Sync Card */}
                <Card title="行事曆同步設定">
                    {canSetCalendar && (
                        <div className="mb-4">
                            <label className="block text-sm text-gray-600 mb-2">
                                目標日曆 ID
                            </label>
                            <input
                                type="text"
                                value={calendarId}
                                onChange={(e) => setCalendarId(e.target.value)}
                                placeholder="primary 或指定 calendarId"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                留空表示使用主日曆 (primary)
                            </p>
                        </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoSyncEvents}
                            onChange={(e) => setAutoSyncEvents(e.target.checked)}
                            disabled={!status?.connected}
                            className="w-4 h-4 text-gray-800 rounded focus:ring-gray-500"
                        />
                        <span className="text-sm text-gray-700">自動同步事件</span>
                    </label>
                </Card>

                {/* Contacts Sync Card */}
                <Card title="聯絡人同步設定">
                    {canSetLabel && (
                        <div className="mb-4">
                            <label className="block text-sm text-gray-600 mb-2">
                                聯絡人標籤
                            </label>
                            <input
                                type="text"
                                value={contactsLabel}
                                onChange={(e) => setContactsLabel(e.target.value)}
                                placeholder="Senteng ERP"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                同步至 Google 聯絡人時使用的分類標籤
                            </p>
                        </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoSyncContacts}
                            onChange={(e) => setAutoSyncContacts(e.target.checked)}
                            disabled={!status?.connected}
                            className="w-4 h-4 text-gray-800 rounded focus:ring-gray-500"
                        />
                        <span className="text-sm text-gray-700">自動同步聯絡人</span>
                    </label>
                </Card>

                {/* Save Button */}
                {canConfigure && (
                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={!status?.connected || saving}
                            className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? '儲存中...' : '儲存設定'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
