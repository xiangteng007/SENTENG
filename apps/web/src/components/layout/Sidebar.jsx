/**
 * Premium Sidebar Navigation
 * Expert Panel Redesign: Ⅳ Frontend, Ⅴ UI/UX, Ⅵ Visual, ⅩⅩⅢ A11Y
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar as CalendarIcon, Users, Building2, 
  DollarSign, Package, FileText, CreditCard, Briefcase, BarChart3,
  ClipboardList, HardHat, Grid3X3, Cpu, Plane, Home, BookOpen,
  Shield, Trash2, Wrench, Settings, Link, Bell, ChevronRight,
  ChevronLeft, Search, Moon, Sun, LogOut, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ============================================
// Menu Configuration
// ============================================

const ALL_MENU_ITEMS = {
  'dashboard': { id: 'dashboard', icon: LayoutDashboard, label: '儀表板', path: '/' },
  'schedule': { id: 'schedule', icon: CalendarIcon, label: '行程管理', path: '/schedule' },
  'events': { id: 'events', icon: CalendarIcon, label: '活動', path: '/events' },
  'projects': { id: 'projects', icon: Building2, label: '專案管理', path: '/projects' },
  'clients': { id: 'clients', icon: Users, label: '客戶管理', path: '/clients' },
  'contacts': { id: 'contacts', icon: Users, label: '聯絡人', path: '/contacts' },
  'contracts': { id: 'contracts', icon: FileText, label: '合約管理', path: '/contracts' },
  'quotations': { id: 'quotations', icon: FileText, label: '報價管理', path: '/quotations' },
  'change-orders': { id: 'change-orders', icon: FileText, label: '變更單', path: '/change-orders' },
  'vendors': { id: 'vendors', icon: Building2, label: '廠商管理', path: '/vendors' },
  'procurements': { id: 'procurements', icon: Package, label: '採購管理', path: '/procurements' },
  'inventory': { id: 'inventory', icon: Package, label: '庫存管理', path: '/inventory' },
  'finance': { id: 'finance', icon: DollarSign, label: '財務管理', path: '/finance' },
  'invoices': { id: 'invoices', icon: FileText, label: '發票助手', path: '/invoice' },
  'payments': { id: 'payments', icon: CreditCard, label: '付款管理', path: '/payments' },
  'cost-entries': { id: 'cost-entries', icon: DollarSign, label: '成本追蹤', path: '/cost-entries' },
  'profit': { id: 'profit', icon: BarChart3, label: '利潤分析', path: '/profit' },
  'reports': { id: 'reports', icon: BarChart3, label: '報表中心', path: '/reports' },
  'site-logs': { id: 'site-logs', icon: ClipboardList, label: '工地日誌', path: '/site-logs' },
  'construction': { id: 'construction', icon: HardHat, label: '施工管理', path: '/construction' },
  'schedules': { id: 'schedules', icon: CalendarIcon, label: '進度排程', path: '/schedules' },
  'bim': { id: 'bim', icon: Grid3X3, label: 'BIM 中心', path: '/bim' },
  'drone': { id: 'drone', icon: Plane, label: '無人機', path: '/drone' },
  'smart-home': { id: 'smart-home', icon: Home, label: '智慧住宅', path: '/smart-home' },
  'regulations': { id: 'regulations', icon: BookOpen, label: '法規查詢', path: '/regulations' },
  'materials': { id: 'materials', icon: Package, label: '材料圖庫', path: '/materials' },
  'materials-calc': { id: 'materials-calc', icon: Wrench, label: '材料估算', path: '/unit' },
  'cost': { id: 'cost', icon: DollarSign, label: '成本估價', path: '/cost' },
  'insurance': { id: 'insurance', icon: Shield, label: '保險管理', path: '/insurance' },
  'waste': { id: 'waste', icon: Trash2, label: '廢棄物', path: '/waste' },
  'user-management': { id: 'user-management', icon: Settings, label: '使用者管理', path: '/admin/users' },
  'integrations': { id: 'integrations', icon: Link, label: '整合設定', path: '/settings/integrations' },
  'notifications': { id: 'notifications', icon: Bell, label: '通知設定', path: '/notifications' },
};

const MENU_GROUPS = [
  { id: 'overview', label: '總覽', icon: LayoutDashboard, items: ['dashboard', 'schedule', 'events'], defaultExpanded: true },
  { id: 'project', label: '專案業務', icon: Briefcase, items: ['projects', 'clients', 'contacts', 'contracts', 'quotations', 'change-orders'] },
  { id: 'supply', label: '供應鏈', icon: Package, items: ['vendors', 'procurements', 'inventory'] },
  { id: 'finance', label: '財務會計', icon: DollarSign, items: ['finance', 'invoices', 'payments'] },
  { id: 'analytics', label: '分析報表', icon: BarChart3, items: ['cost-entries', 'profit', 'reports'] },
  { id: 'site', label: '工地管理', icon: HardHat, items: ['site-logs', 'construction', 'schedules'] },
  { id: 'smart', label: '智慧管理', icon: Cpu, items: ['bim', 'drone', 'smart-home'] },
  { id: 'tools', label: '工具箱', icon: Wrench, items: ['materials', 'materials-calc', 'cost', 'regulations'] },
  { id: 'safety', label: '安全環保', icon: Shield, items: ['insurance', 'waste'] },
  { id: 'admin', label: '系統設定', icon: Settings, items: ['user-management', 'integrations', 'notifications'], adminOnly: true },
];

// ============================================
// SidebarItem Component
// ============================================

const SidebarItem = ({ item, active, collapsed, onClick }) => {
  const Icon = item.icon;
  
  return (
    <button
      onClick={() => onClick(item)}
      className={`
        group relative w-full flex items-center gap-3 rounded-xl transition-all duration-200
        ${collapsed ? 'px-3 py-2.5 justify-center' : 'px-4 py-2.5'}
        ${active
          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
      `}
      title={collapsed ? item.label : undefined}
    >
      {/* Active glow effect */}
      {active && (
        <div className="absolute inset-0 rounded-xl bg-indigo-400/20 blur-xl -z-10" />
      )}
      
      {/* Icon */}
      <Icon 
        size={collapsed ? 20 : 18} 
        strokeWidth={active ? 2.2 : 1.8} 
        className="shrink-0 transition-transform group-hover:scale-110" 
      />
      
      {/* Label */}
      {!collapsed && (
        <span className={`text-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>
          {item.label}
        </span>
      )}
      
      {/* Active indicator bar */}
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/50 rounded-full" />
      )}
    </button>
  );
};

// ============================================
// SidebarGroup Component
// ============================================

const SidebarGroup = ({ group, items, activeId, collapsed, expandedGroups, onToggle, onItemClick }) => {
  const GroupIcon = group.icon;
  const isExpanded = expandedGroups.includes(group.id);
  const hasActiveItem = items.some(item => item.id === activeId);
  
  // Only show group header, not individual items, when collapsed
  if (collapsed) {
    const firstItem = items[0];
    return (
      <button
        onClick={() => onItemClick(firstItem)}
        className={`
          group w-full flex justify-center py-2.5 rounded-xl transition-all
          ${hasActiveItem
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }
        `}
        title={group.label}
      >
        <GroupIcon size={20} strokeWidth={1.8} />
      </button>
    );
  }
  
  return (
    <div className="mb-1">
      {/* Group Header */}
      <button
        onClick={() => onToggle(group.id)}
        className={`
          w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200
          text-slate-400 hover:text-slate-200 hover:bg-white/5
          ${hasActiveItem ? 'text-slate-200' : ''}
        `}
      >
        <GroupIcon size={16} strokeWidth={1.8} className="shrink-0 text-slate-500" />
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
          {group.label}
        </span>
        <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
        <ChevronRight
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>
      
      {/* Group Items */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="pl-2 pt-1 space-y-0.5">
          {items.map(item => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeId === item.id}
              collapsed={false}
              onClick={onItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Sidebar Component
// ============================================

const Sidebar = ({ activeTab, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, canAccessPage, role } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['overview']);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Filter groups based on permissions
  const visibleGroups = useMemo(() => {
    return MENU_GROUPS.filter(group => {
      if (group.adminOnly && role !== 'super_admin' && role !== 'admin') return false;
      return true;
    }).map(group => ({
      ...group,
      items: group.items
        .map(id => ALL_MENU_ITEMS[id])
        .filter(item => item && canAccessPage(item.id))
    })).filter(group => group.items.length > 0);
  }, [role, canAccessPage]);

  // Handle group toggle
  const handleToggleGroup = useCallback((groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  // Handle item click
  const handleItemClick = useCallback((item) => {
    if (item.path) {
      navigate(item.path);
    }
    onNavigate?.(item.id);
  }, [navigate, onNavigate]);

  // Search filter
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return visibleGroups;
    
    const query = searchQuery.toLowerCase();
    return visibleGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0);
  }, [visibleGroups, searchQuery]);

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-40 flex flex-col
        bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
        border-r border-white/5 transition-all duration-300
        ${collapsed ? 'w-[72px]' : 'w-[280px]'}
      `}
    >
      {/* Header */}
      <div className={`flex items-center h-16 border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        {!collapsed && (
          <>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="ml-3 flex-1">
              <h1 className="text-white font-bold text-lg tracking-tight">SENTENG</h1>
              <p className="text-slate-500 text-xs">ERP Pro</p>
            </div>
          </>
        )}
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜尋功能 ⌘K"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        {filteredGroups.map(group => (
          <SidebarGroup
            key={group.id}
            group={group}
            items={group.items}
            activeId={activeTab}
            collapsed={collapsed}
            expandedGroups={expandedGroups}
            onToggle={handleToggleGroup}
            onItemClick={handleItemClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/5 p-3 ${collapsed ? 'space-y-2' : ''}`}>
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`
            flex items-center gap-3 w-full rounded-lg transition-colors
            text-slate-400 hover:text-white hover:bg-white/5
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
          title={darkMode ? '淺色模式' : '深色模式'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span className="text-sm">切換主題</span>}
        </button>
        
        {/* User Profile */}
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center mt-2' : 'px-3 py-2'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <User size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || user?.email || '使用者'}
              </p>
              <p className="text-xs text-slate-500 truncate">{role || 'user'}</p>
            </div>
          )}
        </div>
        
        {/* Logout */}
        <button
          onClick={logout}
          className={`
            flex items-center gap-3 w-full rounded-lg transition-colors
            text-slate-400 hover:text-red-400 hover:bg-red-500/10
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
          title="登出"
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">登出</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
