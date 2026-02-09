import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Edit2, Trash2, Phone, Mail, Star, Cloud, CloudOff, ChevronDown, ChevronUp, X, Check, MapPin, Hash, MessageCircle, Loader2, Users
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  _addPartnerContact,
  _deletePartnerContact,
} from '../services/partnersApi';

// 星星評分
const StarRating = ({ rating, onChange, readonly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(star)}
        className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
      >
        <Star
          size={16}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      </button>
    ))}
  </div>
);

// Partner 卡片
const PartnerCard = ({ partner, onEdit, onDelete, onExpand, expanded }) => {
  const typeInfo = PARTNER_TYPES[partner.type] || PARTNER_TYPES.CLIENT;
  const syncIcon = partner.syncStatus === 'SYNCED' ? Cloud : CloudOff;
  const syncColor = partner.syncStatus === 'SYNCED' ? 'text-green-500' : 'text-gray-400';
  
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${typeInfo.color}`}>
            {typeInfo.icon}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800 truncate">{partner.name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {partner.category && (
                <span className={`px-2 py-0.5 rounded text-xs ${PARTNER_CATEGORIES[partner.category]?.color || 'bg-gray-100 text-gray-600'}`}>
                  {partner.category}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
              {partner.phone && (
                <a href={`tel:${partner.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                  <Phone size={14} /> {partner.phone}
                </a>
              )}
              {partner.email && (
                <a href={`mailto:${partner.email}`} className="flex items-center gap-1 hover:text-blue-600">
                  <Mail size={14} /> <span className="truncate max-w-[150px]">{partner.email}</span>
                </a>
              )}
              {partner.taxId && (
                <span className="flex items-center gap-1">
                  <Hash size={14} /> {partner.taxId}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <StarRating rating={partner.rating || 0} readonly />
              {partner.contacts?.length > 0 && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users size={14} /> {partner.contacts.length} 位聯絡人
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <div className={`p-2 ${syncColor}`} title={partner.syncStatus === 'SYNCED' ? '已同步' : '未同步'}>
              {React.createElement(syncIcon, { size: 16 })}
            </div>
            <button onClick={() => onExpand(partner.id)} className="p-2 hover:bg-gray-100 rounded">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button onClick={() => onEdit(partner)} className="p-2 hover:bg-gray-100 rounded">
              <Edit2 size={16} className="text-gray-500" />
            </button>
            <button onClick={() => onDelete(partner.id)} className="p-2 hover:bg-red-50 rounded">
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Contacts */}
      {expanded && partner.contacts?.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">聯絡人</h4>
          <div className="grid gap-2">
            {partner.contacts.map(contact => (
              <div key={contact.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {contact.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{contact.name}</span>
                    {contact.isPrimary && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">主要</span>}
                    {contact.title && <span className="text-gray-400 text-xs">{contact.title}</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {contact.phone && <span>{contact.phone}</span>}
                    {contact.mobile && <span>{contact.mobile}</span>}
                    {contact.email && <span className="truncate max-w-[150px]">{contact.email}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Partner 表單 Modal
const PartnerModal = ({ partner, onSave, onClose }) => {
  const [form, setForm] = useState({
    type: partner?.type || 'CLIENT',
    name: partner?.name || '',
    taxId: partner?.taxId || '',
    category: partner?.category || '',
    phone: partner?.phone || '',
    email: partner?.email || '',
    address: partner?.address || '',
    lineId: partner?.lineId || '',
    rating: partner?.rating || 0,
    notes: partner?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...partner, ...form });
    } finally {
      setLoading(false);
    }
  };

  const typeInfo = PARTNER_TYPES[form.type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${typeInfo.color.replace('text-', 'bg-').replace('100', '500')} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeInfo.icon}</span>
              <h2 className="text-lg font-bold">{partner ? '編輯' : '新增'}合作夥伴</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Type Selection */}
          <div className="flex gap-2">
            {Object.entries(PARTNER_TYPES).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, type: key })}
                className={`flex-1 py-2 px-3 rounded-xl border-2 transition-all ${
                  form.type === key ? `${info.color} border-current` : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{info.icon}</span>
                <span className="ml-2 font-medium">{info.label}</span>
              </button>
            ))}
          </div>
          
          {/* Name & TaxId */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
                placeholder="公司或個人名稱"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="12345678"
              />
            </div>
          </div>
          
          {/* Category (for VENDOR) */}
          {form.type === 'VENDOR' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選擇分類</option>
                {Object.keys(PARTNER_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Phone size={14} /> 電話
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="02-1234-5678"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
          </div>
          
          {/* Address */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <MapPin size={14} /> 地址
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="台北市..."
            />
          </div>
          
          {/* LINE ID */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <MessageCircle size={14} /> LINE ID
            </label>
            <input
              type="text"
              value={form.lineId}
              onChange={(e) => setForm({ ...form, lineId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="line_id"
            />
          </div>
          
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">評分</label>
            <StarRating rating={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none h-20"
              placeholder="備註資訊..."
            />
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 主頁面
export const Partners = ({ addToast }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await getPartners();
      setPartners(data || []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchSearch = 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.taxId?.includes(search);
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [partners, search, typeFilter]);

  const stats = useMemo(() => ({
    total: partners.length,
    CLIENT: partners.filter(p => p.type === 'CLIENT').length,
    VENDOR: partners.filter(p => p.type === 'VENDOR').length,
    PERSON: partners.filter(p => p.type === 'PERSON').length,
  }), [partners]);

  const handleSave = async (partnerData) => {
    try {
      if (partnerData.id) {
        await updatePartner(partnerData.id, partnerData);
        setPartners(prev => prev.map(p => p.id === partnerData.id ? { ...p, ...partnerData } : p));
        addToast?.('合作夥伴已更新', 'success');
      } else {
        const newPartner = await createPartner(partnerData);
        setPartners(prev => [newPartner, ...prev]);
        addToast?.('合作夥伴已新增，正在同步到 Google 通訊錄...', 'success');
      }
      setShowModal(false);
      setEditingPartner(null);
    } catch (error) {
      addToast?.('操作失敗: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除此合作夥伴？')) return;
    try {
      await deletePartner(id);
      setPartners(prev => prev.filter(p => p.id !== id));
      addToast?.('合作夥伴已刪除', 'success');
    } catch (error) {
      addToast?.('刪除失敗: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">合作夥伴管理</h1>
          <p className="text-gray-500 mt-1">統一管理客戶、廠商與聯絡人</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditingPartner(null); setShowModal(true); }}
        >
          <Plus size={18} />
          新增夥伴
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setTypeFilter('all')}
          className={`card p-4 text-left transition-all ${typeFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-gray-500">全部</div>
        </button>
        {Object.entries(PARTNER_TYPES).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
            className={`card p-4 text-left transition-all ${typeFilter === key ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{info.icon}</span>
              <span className="text-2xl font-bold text-gray-800">{stats[key]}</span>
            </div>
            <div className="text-gray-500">{info.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="搜尋名稱、電話、Email、統編..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 w-full"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">
          <Loader2 className="animate-spin mx-auto mb-2" size={32} />
          載入中...
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon="users"
            title="尚無合作夥伴"
            description="新增客戶、廠商或個人聯絡人"
            actionLabel="新增夥伴"
            onAction={() => { setEditingPartner(null); setShowModal(true); }}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPartners.map(partner => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
              expanded={expandedId === partner.id}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PartnerModal
          partner={editingPartner}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingPartner(null); }}
        />
      )}
    </div>
  );
};

export default Partners;
