/**
 * projectContactsApi.js
 * 
 * 專案聯絡人 API 封裝
 */

import api from './api';

/**
 * 取得專案所有聯絡人
 * @param {string} projectId 
 * @returns {Promise<Array>}
 */
export async function getProjectContacts(projectId) {
    const response = await api.get(`/projects/${projectId}/contacts`);
    return response.data;
}

/**
 * 指派聯絡人到專案
 * @param {string} projectId 
 * @param {object} data - { contactId, sourceType, roleInProject, isPrimary, notes }
 * @returns {Promise<object>}
 */
export async function assignContactToProject(projectId, data) {
    const response = await api.post(`/projects/${projectId}/contacts`, data);
    return response.data;
}

/**
 * 更新專案聯絡人
 * @param {string} projectId 
 * @param {string} assignmentId 
 * @param {object} data - { roleInProject, isPrimary, notes }
 * @returns {Promise<object>}
 */
export async function updateProjectContact(projectId, assignmentId, data) {
    const response = await api.put(`/projects/${projectId}/contacts/${assignmentId}`, data);
    return response.data;
}

/**
 * 移除專案聯絡人
 * @param {string} projectId 
 * @param {string} assignmentId 
 * @returns {Promise<void>}
 */
export async function removeProjectContact(projectId, assignmentId) {
    await api.delete(`/projects/${projectId}/contacts/${assignmentId}`);
}

/**
 * 同步專案所有聯絡人到 Google Contacts
 * @param {string} projectId 
 * @returns {Promise<{total: number, synced: number, failed: number}>}
 */
export async function syncProjectContactsToGoogle(projectId) {
    const response = await api.post(`/projects/${projectId}/contacts/sync`);
    return response.data;
}

// 來源類型常數
export const SOURCE_TYPES = {
    UNIFIED: { value: 'UNIFIED', label: '統一聯絡人', icon: '📋' },
    CUSTOMER: { value: 'CUSTOMER', label: '客戶', icon: '🏢' },
    VENDOR: { value: 'VENDOR', label: '廠商', icon: '🏭' },
};

// 專案角色常數
export const PROJECT_ROLES = {
    OWNER: { value: 'OWNER', label: '業主', color: 'bg-purple-100 text-purple-700' },
    DESIGNER: { value: 'DESIGNER', label: '設計師', color: 'bg-blue-100 text-blue-700' },
    SUPERVISOR: { value: 'SUPERVISOR', label: '監造', color: 'bg-green-100 text-green-700' },
    PROJECT_MANAGER: { value: 'PROJECT_MANAGER', label: '專案經理', color: 'bg-indigo-100 text-indigo-700' },
    SITE_MANAGER: { value: 'SITE_MANAGER', label: '工地主任', color: 'bg-orange-100 text-orange-700' },
    ACCOUNTANT: { value: 'ACCOUNTANT', label: '會計', color: 'bg-pink-100 text-pink-700' },
    PROCUREMENT: { value: 'PROCUREMENT', label: '採購', color: 'bg-cyan-100 text-cyan-700' },
    CONTRACTOR: { value: 'CONTRACTOR', label: '承包商', color: 'bg-amber-100 text-amber-700' },
    SUBCONTRACTOR: { value: 'SUBCONTRACTOR', label: '小包', color: 'bg-lime-100 text-lime-700' },
    OTHER: { value: 'OTHER', label: '其他', color: 'bg-gray-100 text-gray-700' },
};

export default {
    getProjectContacts,
    assignContactToProject,
    updateProjectContact,
    removeProjectContact,
    syncProjectContactsToGoogle,
    SOURCE_TYPES,
    PROJECT_ROLES,
};
