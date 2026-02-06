/**
 * PartnerSelector.jsx
 * 
 * 可重用的合作夥伴選擇器組件
 * 支援篩選類型 (CLIENT/VENDOR/PERSON) 和搜尋
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, Building2, Factory, User, X, Plus, Check, Loader2 } from 'lucide-react';
import { getPartners, getClients, getVendors, PARTNER_TYPES } from '../../services/partnersApi';

const PartnerSelector = ({
  label = '合作夥伴',
  value,
  onChange,
  type = null, // null = all, 'CLIENT' | 'VENDOR' | 'PERSON'
  required = false,
  placeholder = '請選擇合作夥伴...',
  searchPlaceholder = '搜尋名稱、電話...',
  className = '',
  disabled = false,
  showType = true, // 顯示類型標籤
}) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // 獲取合作夥伴列表
  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        let data;
        if (type === 'CLIENT') {
          data = await getClients();
        } else if (type === 'VENDOR') {
          data = await getVendors();
        } else {
          data = await getPartners();
        }
        setPartners(data || []);
      } catch (error) {
        console.error('Failed to fetch partners:', error);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [type]);

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 過濾結果
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners;
    const query = searchQuery.toLowerCase();
    return partners.filter(p =>
      p.name?.toLowerCase().includes(query) ||
      p.phone?.includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.taxId?.includes(query)
    );
  }, [partners, searchQuery]);

  // 目前選中的合作夥伴
  const selectedPartner = useMemo(() => {
    return partners.find(p => p.id === value);
  }, [partners, value]);

  const handleSelect = (partner) => {
    onChange(partner.id, partner);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null, null);
  };

  const getTypeIcon = (partnerType) => {
    switch (partnerType) {
      case 'CLIENT': return Building2;
      case 'VENDOR': return Factory;
      case 'PERSON': return User;
      default: return Building2;
    }
  };

  const typeInfo = PARTNER_TYPES[type] || null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {typeInfo && (
            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          )}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-2.5
          border rounded-xl bg-white transition-all
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedPartner ? (
            <>
              {showType && (
                <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-sm ${PARTNER_TYPES[selectedPartner.type]?.color || 'bg-gray-100'}`}>
                  {PARTNER_TYPES[selectedPartner.type]?.icon || '🏢'}
                </span>
              )}
              <span className="font-medium text-gray-800 truncate">{selectedPartner.name}</span>
              {selectedPartner.phone && (
                <span className="text-gray-400 text-sm hidden sm:inline">· {selectedPartner.phone}</span>
              )}
            </>
          ) : (
            <span className="text-gray-400">{loading ? '載入中...' : placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedPartner && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
          {loading ? (
            <Loader2 size={16} className="text-gray-400 animate-spin" />
          ) : (
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filteredPartners.length > 0 ? (
              filteredPartners.map(partner => {
                const Icon = getTypeIcon(partner.type);
                const isSelected = partner.id === value;
                return (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => handleSelect(partner)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg ${PARTNER_TYPES[partner.type]?.color || 'bg-gray-100'}`}>
                      {PARTNER_TYPES[partner.type]?.icon || '🏢'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                          {partner.name}
                        </span>
                        {showType && !type && (
                          <span className={`px-1.5 py-0.5 rounded text-xs ${PARTNER_TYPES[partner.type]?.color || 'bg-gray-100'}`}>
                            {PARTNER_TYPES[partner.type]?.label || partner.type}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs text-gray-400">
                        {partner.phone && <span>{partner.phone}</span>}
                        {partner.category && <span>· {partner.category}</span>}
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                {loading ? '載入中...' : '找不到符合的合作夥伴'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSelector;
