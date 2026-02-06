/**
 * Premium Sidebar Navigation
 * Design System v4.0: Modern Dark Gold
 * Expert Panel Redesign: Ⅳ Frontend, Ⅴ UI/UX, Ⅵ Visual, ⅩⅩⅩ Web Design
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar as CalendarIcon, Users, Building2, 
  DollarSign, Package, FileText, CreditCard, Briefcase, BarChart3,
  ClipboardList, HardHat, Grid3X3, Cpu, Plane, Home, BookOpen,
  Shield, Trash2, Wrench, Settings, Link, Bell, ChevronRight,
  ChevronLeft, Search, Moon, Sun, LogOut, User,
  Calculator, Palette, Flag, Scale, Flame, Landmark, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ============================================
// Menu Configuration
// ============================================

const ALL_MENU_ITEMS = {
  // 總覽
  'dashboard': { id: 'dashboard', icon: LayoutDashboard, label: '儀表板', path: '/' },
  'schedule': { id: 'schedule', icon: CalendarIcon, label: '行程管理', path: '/schedule' },
  'events': { id: 'events', icon: CalendarIcon, label: '活動', path: '/events' },
  // 專案業務
  'projects': { id: 'projects', icon: Building2, label: '專案管理', path: '/projects' },
  'clients': { id: 'clients', icon: Users, label: '客戶管理', path: '/clients' },
  'contacts': { id: 'contacts', icon: Users, label: '聯絡人', path: '/contacts' },
  'partners': { id: 'partners', icon: Building2, label: '合作夥伴', path: '/partners' },
  'contracts': { id: 'contracts', icon: FileText, label: '合約管理', path: '/contracts' },
  'quotations': { id: 'quotations', icon: FileText, label: '報價管理', path: '/quotations' },
  'change-orders': { id: 'change-orders', icon: FileText, label: '變更單', path: '/change-orders' },
  'milestones': { id: 'milestones', icon: Flag, label: '履約管理', path: '/milestones' },
  'contract-alerts': { id: 'contract-alerts', icon: Bell, label: '合約到期', path: '/contract-alerts' },
  // 政府標案
  'government-projects': { id: 'government-projects', icon: Landmark, label: '政府標案', path: '/government-projects' },
  // 人資管理
  'labor-contracts': { id: 'labor-contracts', icon: FileText, label: '勞動契約', path: '/labor-contracts' },
  'labor-disputes': { id: 'labor-disputes', icon: Scale, label: '勞資爭議', path: '/labor-disputes' },
  // 供應鏈
  'vendors': { id: 'vendors', icon: Building2, label: '廠商管理', path: '/vendors' },
  'procurements': { id: 'procurements', icon: Package, label: '採購管理', path: '/procurements' },
  'inventory': { id: 'inventory', icon: Package, label: '庫存管理', path: '/inventory' },
  // 財務會計
  'finance': { id: 'finance', icon: DollarSign, label: '財務管理', path: '/finance' },
  'invoice': { id: 'invoice', icon: FileText, label: '發票助手', path: '/invoice' },
  'payments': { id: 'payments', icon: CreditCard, label: '付款管理', path: '/payments' },
  // 分析報表
  'cost-entries': { id: 'cost-entries', icon: DollarSign, label: '成本追蹤', path: '/cost-entries' },
  'profit': { id: 'profit', icon: BarChart3, label: '利潤分析', path: '/profit' },
  'reports': { id: 'reports', icon: BarChart3, label: '報表中心', path: '/reports' },
  // 工地管理
  'site-logs': { id: 'site-logs', icon: ClipboardList, label: '工地日誌', path: '/site-logs' },
  'construction': { id: 'construction', icon: HardHat, label: '施工管理', path: '/construction' },
  'schedules': { id: 'schedules', icon: CalendarIcon, label: '進度排程', path: '/schedules' },
  // 智慧管理
  'bim': { id: 'bim', icon: Grid3X3, label: 'BIM 中心', path: '/bim' },
  'drone': { id: 'drone', icon: Plane, label: '無人機', path: '/drone' },
  'smart-home': { id: 'smart-home', icon: Home, label: '智慧住宅', path: '/smart-home' },
  // 工具箱
  'regulations': { id: 'regulations', icon: BookOpen, label: '法規查詢', path: '/regulations' },
  'materials': { id: 'materials', icon: Package, label: '材料圖庫', path: '/materials' },
  'materials-calc': { id: 'materials-calc', icon: Wrench, label: '材料估算', path: '/unit' },
  'cost': { id: 'cost', icon: DollarSign, label: '成本估價', path: '/cost' },
  'calculators': { id: 'calculators', icon: Calculator, label: '專業計算器', path: '/calculators' },
  'visual-tools': { id: 'visual-tools', icon: Palette, label: '視覺設計', path: '/visual-tools' },
  // 安全環保
  'insurance': { id: 'insurance', icon: Shield, label: '保險管理', path: '/insurance' },
  'waste': { id: 'waste', icon: Trash2, label: '廢棄物', path: '/waste' },
  'safety': { id: 'safety', icon: UserCheck, label: '職安衛', path: '/safety' },
  'fire-safety': { id: 'fire-safety', icon: Flame, label: '消防檢測', path: '/fire-safety' },
  // 系統設定
  'user-management': { id: 'user-management', icon: Settings, label: '使用者管理', path: '/admin/users' },
  'integrations': { id: 'integrations', icon: Link, label: '整合設定', path: '/settings/integrations' },
  'notifications': { id: 'notifications', icon: Bell, label: '通知設定', path: '/notifications' },
};

const MENU_GROUPS = [
  { id: 'overview', label: '總覽', icon: LayoutDashboard, items: ['dashboard', 'schedule', 'events'], defaultExpanded: true },
  { id: 'project', label: '專案業務', icon: Briefcase, items: ['projects', 'clients', 'contacts', 'partners', 'contracts', 'quotations', 'change-orders', 'milestones', 'contract-alerts'] },
  { id: 'government', label: '政府標案', icon: Landmark, items: ['government-projects'] },
  { id: 'hr', label: '人資管理', icon: UserCheck, items: ['labor-contracts', 'labor-disputes'] },
  { id: 'supply', label: '供應鏈', icon: Package, items: ['vendors', 'procurements', 'inventory'] },
  { id: 'finance', label: '財務會計', icon: DollarSign, items: ['finance', 'invoice', 'payments'] },
  { id: 'analytics', label: '分析報表', icon: BarChart3, items: ['cost-entries', 'profit', 'reports'] },
  { id: 'site', label: '工地管理', icon: HardHat, items: ['site-logs', 'construction', 'schedules'] },
  { id: 'smart', label: '智慧管理', icon: Cpu, items: ['bim', 'drone', 'smart-home'] },
  { id: 'tools', label: '工具箱', icon: Wrench, items: ['materials', 'materials-calc', 'cost', 'regulations', 'calculators', 'visual-tools'] },
  { id: 'safety', label: '安全環保', icon: Shield, items: ['insurance', 'waste', 'safety', 'fire-safety'] },
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
      aria-label={item.label}
      className={`
        group relative w-full flex items-center gap-3 rounded-xl transition-all duration-200
        ${collapsed ? 'px-3 py-2.5 justify-center' : 'px-4 py-2.5'}
        ${active
          ? 'bg-gradient-to-r from-zinc-800 to-zinc-700 !text-white shadow-lg shadow-zinc-900/30 ring-1 ring-[#D4AF37]/30'
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
        }
      `}
      title={collapsed ? item.label : undefined}
    >
      {/* Active glow effect */}
      {active && (
        <div className="absolute inset-0 rounded-xl bg-[#D4AF37]/10 blur-xl -z-10" />
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
            ? 'bg-gradient-to-r from-zinc-800 to-zinc-700 text-white ring-1 ring-[#D4AF37]/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
          text-zinc-400 hover:text-zinc-200 hover:bg-white/5
          ${hasActiveItem ? 'text-zinc-200' : ''}
        `}
      >
        <GroupIcon size={16} strokeWidth={1.8} className="shrink-0 text-zinc-500" />
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
          {group.label}
        </span>
        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
        <ChevronRight
          size={14}
          className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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

const Sidebar = ({ activeTab, onNavigate, isMobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, canAccessPage, role } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['overview']);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const stored = localStorage.getItem('senteng_darkMode');
    return stored !== null ? stored === 'true' : true;
  });

  // Apply theme on mount and when darkMode changes
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
    }
  }, [darkMode]);

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
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      
      <aside
        className={`
          h-screen flex flex-col
          bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950
          border-r border-zinc-800 transition-all duration-300
          ${collapsed ? 'w-[72px]' : 'w-[280px]'}
          
          fixed left-0 top-0 z-50
          transform transition-transform duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          
          lg:translate-x-0 lg:relative lg:z-auto
        `}
      >
      {/* Header */}
      <div className={`flex items-center h-16 border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        {!collapsed && (
          <>
            <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-black/30 ring-1 ring-[#D4AF37]/40">
              <span className="text-[#D4AF37] font-bold text-lg">S</span>
            </div>
            <div className="ml-3 flex-1">
              <h1 className="text-white font-bold text-lg tracking-tight">SENTENG</h1>
              <p className="text-[#D4AF37]/70 text-xs font-medium">ERP Pro</p>
            </div>
          </>
        )}
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展開側邊欄' : '收合側邊欄'}
          className="p-2 text-zinc-400 hover:text-[#D4AF37] hover:bg-zinc-800 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="搜尋功能 ⌘K"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]/50 transition-all"
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
      <div className={`border-t border-zinc-800 p-3 ${collapsed ? 'space-y-2' : ''}`}>
        {/* Theme Toggle */}
        <button
          onClick={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem('senteng_darkMode', String(newMode));
          }}
          className={`
            flex items-center gap-3 w-full rounded-lg transition-colors
            text-zinc-400 hover:text-[#D4AF37] hover:bg-zinc-800
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
          title={darkMode ? '淺色模式' : '深色模式'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span className="text-sm">切換主題</span>}
        </button>
        
        {/* User Profile */}
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center mt-2' : 'px-3 py-2'}`}>
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-9 h-9 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center shadow-lg shadow-black/30 ring-1 ring-[#D4AF37]/30">
              <User size={18} className="text-[#D4AF37]" />
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || user?.email?.split('@')[0] || '使用者'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{role || 'user'}</p>
            </div>
          )}
        </div>
        
        {/* Logout */}
        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          aria-label="登出系統"
          className={`
            flex items-center gap-3 w-full rounded-lg transition-colors
            text-zinc-400 hover:text-red-400 hover:bg-red-500/10
            ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
          `}
          title="登出"
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm">登出</span>}
        </button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
