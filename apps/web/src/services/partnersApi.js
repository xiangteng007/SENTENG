/**
 * partnersApi.js
 * 
 * 統一合作夥伴 API 服務
 */

import api from './api';

// Partner 類型常數
export const PARTNER_TYPES = {
  CLIENT: { value: 'CLIENT', label: '客戶', icon: '🏢', color: 'bg-blue-100 text-blue-700' },
  VENDOR: { value: 'VENDOR', label: '廠商', icon: '🏭', color: 'bg-orange-100 text-orange-700' },
  PERSON: { value: 'PERSON', label: '個人', icon: '👤', color: 'bg-purple-100 text-purple-700' },
};

// 廠商分類常數
export const PARTNER_CATEGORIES = {
  '工程工班': { color: 'bg-orange-50 text-orange-600' },
  '建材供應': { color: 'bg-blue-50 text-blue-600' },
  '設備廠商': { color: 'bg-purple-50 text-purple-600' },
  '設計規劃': { color: 'bg-green-50 text-green-600' },
  '其他': { color: 'bg-gray-50 text-gray-600' },
};

// ============ Partner CRUD ============

export async function getPartners(query = {}) {
  const params = new URLSearchParams();
  if (query.type) params.append('type', query.type);
  if (query.search) params.append('search', query.search);
  if (query.category) params.append('category', query.category);
  
  const response = await api.get(`/partners?${params.toString()}`);
  return response.data;
}

export async function getClients() {
  const response = await api.get('/partners/clients');
  return response.data;
}

export async function getVendors() {
  const response = await api.get('/partners/vendors');
  return response.data;
}

export async function getPartner(id) {
  const response = await api.get(`/partners/${id}`);
  return response.data;
}

export async function createPartner(data) {
  const response = await api.post('/partners', data);
  return response.data;
}

export async function updatePartner(id, data) {
  const response = await api.put(`/partners/${id}`, data);
  return response.data;
}

export async function deletePartner(id) {
  await api.delete(`/partners/${id}`);
}

// ============ PartnerContact CRUD ============

export async function addPartnerContact(partnerId, data) {
  const response = await api.post(`/partners/${partnerId}/contacts`, data);
  return response.data;
}

export async function updatePartnerContact(partnerId, contactId, data) {
  const response = await api.put(`/partners/${partnerId}/contacts/${contactId}`, data);
  return response.data;
}

export async function deletePartnerContact(partnerId, contactId) {
  await api.delete(`/partners/${partnerId}/contacts/${contactId}`);
}

export default {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  getPartners,
  getClients,
  getVendors,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
  addPartnerContact,
  updatePartnerContact,
  deletePartnerContact,
};
