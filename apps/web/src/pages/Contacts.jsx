import React, { useState, useEffect, useMemo } from 'react';
import { PhoneCall, Plus, Filter, Search, Edit2, Trash2, Mail, Building2, User, X, Check, Tag } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

// 聯絡人分類
const CONTACT_CATEGORIES = {
  CLIENT: { label: '業主', color: 'bg-blue-100 text-blue-700' },
  VENDOR: { label: '廠商', color: 'bg-orange-100 text-orange-700' },
  PARTNER: { label: '合作夥伴', color: 'bg-purple-100 text-purple-700' },
  GOVERNMENT: { label: '政府機關', color: 'bg-green-100 text-green-700' },
  INTERNAL: { label: '內部', color: 'bg-gray-100 text-gray-700' },
  OTHER: { label: '其他', color: 'bg-yellow-100 text-yellow-700' },
};

// 聯絡人卡片
const ContactCard = ({ contact, onEdit, onDelete }) => {
  const categoryInfo = CONTACT_CATEGORIES[contact.category] || CONTACT_CATEGORIES.OTHER;
  
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
          {contact.name?.charAt(0) || '?'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{contact.name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
          </div>
          
          {contact.company && (
            <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
              <Building2 size={14} />
              <span className="truncate">{contact.company}</span>
              {contact.position && <span className="text-gray-400">· {contact.position}</span>}
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                <PhoneCall size={14} />
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                <Mail size={14} />
                <span className="truncate max-w-[200px]">{contact.email}</span>
              </a>
            )}
          </div>
          
          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <button onClick={() => onEdit(contact)} className="p-2 hover:bg-gray-100 rounded">
            <Edit2 size={16} className="text-gray-500" />
          </button>
          <button onClick={() => onDelete(contact.id)} className="p-2 hover:bg-red-50 rounded">
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 新增/編輯聯絡人 Modal
const ContactModal = ({ contact, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: contact?.name || '',
    category: contact?.category || 'CLIENT',
    company: contact?.company || '',
    position: contact?.position || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    address: contact?.address || '',
    lineId: contact?.lineId || '',
    notes: contact?.notes || '',
    tags: contact?.tags?.join(', ') || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...contact,
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{contact ? '編輯聯絡人' : '新增聯絡人'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input w-full"
              >
                {Object.entries(CONTACT_CATEGORIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">職稱</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input w-full"
                placeholder="0912-345-678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LINE ID</label>
            <input
              type="text"
              value={form.lineId}
              onChange={(e) => setForm({ ...form, lineId: e.target.value })}
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">標籤</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="input w-full"
              placeholder="以逗號分隔，例：VIP, 設計師"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input w-full h-20 resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Check size={16} />
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Contacts = ({ addToast }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingContact, setEditingContact] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    // TODO: 替換為真實 API 呼叫
    setTimeout(() => {
      setContacts([
        {
          id: '1',
          name: '陳大明',
          category: 'CLIENT',
          company: '大明建設股份有限公司',
          position: '董事長',
          phone: '02-2345-6789',
          email: 'chen@daming.com.tw',
          tags: ['VIP', '信義區'],
        },
        {
          id: '2',
          name: '林美華',
          category: 'VENDOR',
          company: '華美水電工程行',
          position: '負責人',
          phone: '0912-345-678',
          email: 'lin@huamei.com',
          tags: ['水電', '配合廠商'],
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchSearch = 
        contact.name?.toLowerCase().includes(search.toLowerCase()) ||
        contact.company?.toLowerCase().includes(search.toLowerCase()) ||
        contact.email?.toLowerCase().includes(search.toLowerCase()) ||
        contact.phone?.includes(search);
      const matchCategory = categoryFilter === 'all' || contact.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [contacts, search, categoryFilter]);

  const handleSave = (contactData) => {
    if (contactData.id) {
      setContacts(prev => prev.map(c => c.id === contactData.id ? contactData : c));
      addToast?.('聯絡人已更新', 'success');
    } else {
      const newContact = { ...contactData, id: Date.now().toString() };
      setContacts(prev => [...prev, newContact]);
      addToast?.('聯絡人已新增', 'success');
    }
    setShowModal(false);
    setEditingContact(null);
  };

  const handleDelete = (id) => {
    if (confirm('確定要刪除此聯絡人？')) {
      setContacts(prev => prev.filter(c => c.id !== id));
      addToast?.('聯絡人已刪除', 'success');
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  // 依分類統計
  const stats = useMemo(() => {
    const result = {};
    Object.keys(CONTACT_CATEGORIES).forEach(key => {
      result[key] = contacts.filter(c => c.category === key).length;
    });
    return result;
  }, [contacts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">聯絡人管理</h1>
          <p className="text-gray-500 mt-1">集中管理所有業務聯絡人</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditingContact(null); setShowModal(true); }}
        >
          <Plus size={18} />
          新增聯絡人
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋姓名、公司、電話..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input"
        >
          <option value="all">所有分類</option>
          {Object.entries(CONTACT_CATEGORIES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CONTACT_CATEGORIES).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              categoryFilter === key ? color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({stats[key] || 0})
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">載入中...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon="users"
            title="尚無聯絡人"
            description="新增廠商、業主或合作夥伴的聯絡資訊"
            actionLabel="新增聯絡人"
            onAction={() => { setEditingContact(null); setShowModal(true); }}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredContacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ContactModal
          contact={editingContact}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingContact(null); }}
        />
      )}
    </div>
  );
};

export default Contacts;
