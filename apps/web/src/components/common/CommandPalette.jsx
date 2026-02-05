import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  Users, 
  DollarSign, 
  Package, 
  Calendar,
  Settings,
  BarChart3,
  Building2,
  Wrench,
  Shield,
  Bell,
  Clock,
  ArrowRight,
  Command,
  CornerDownLeft
} from 'lucide-react';

// All navigable pages with metadata
const ALL_PAGES = [
  // Overview
  { id: 'dashboard', name: '儀表板', path: '/', icon: BarChart3, group: '總覽', keywords: ['home', 'dashboard', '首頁'] },
  { id: 'schedule', name: '行事曆', path: '/schedule', icon: Calendar, group: '總覽', keywords: ['calendar', 'event', '排程'] },
  
  // Projects
  { id: 'projects', name: '專案管理', path: '/projects', icon: Building2, group: '專案業務', keywords: ['project', '工程'] },
  { id: 'clients', name: '客戶管理', path: '/clients', icon: Users, group: '專案業務', keywords: ['customer', 'client', '業主'] },
  { id: 'contracts', name: '合約管理', path: '/contracts', icon: FileText, group: '專案業務', keywords: ['contract', '合約'] },
  { id: 'milestones', name: '里程碑', path: '/milestones', icon: Clock, group: '專案業務', keywords: ['milestone', '進度'] },
  
  // Supply Chain
  { id: 'vendors', name: '廠商管理', path: '/vendors', icon: Building2, group: '供應鏈', keywords: ['vendor', 'supplier', '供應商'] },
  { id: 'inventory', name: '庫存管理', path: '/inventory', icon: Package, group: '供應鏈', keywords: ['inventory', 'stock', '物料'] },
  { id: 'procurements', name: '採購管理', path: '/procurements', icon: FileText, group: '供應鏈', keywords: ['procurement', 'purchase', '訂購'] },
  
  // Finance
  { id: 'finance', name: '財務總覽', path: '/finance', icon: DollarSign, group: '財務會計', keywords: ['finance', 'money', '帳務'] },
  { id: 'invoices', name: '發票管理', path: '/invoices', icon: FileText, group: '財務會計', keywords: ['invoice', '統一發票'] },
  { id: 'payments', name: '付款紀錄', path: '/payments', icon: DollarSign, group: '財務會計', keywords: ['payment', '付款'] },
  
  // Analytics
  { id: 'analytics', name: '分析報表', path: '/analytics', icon: BarChart3, group: '分析報表', keywords: ['analytics', 'report', '統計'] },
  { id: 'costs', name: '成本分析', path: '/costs', icon: DollarSign, group: '分析報表', keywords: ['cost', '成本'] },
  
  // Site Management
  { id: 'site-logs', name: '工地日誌', path: '/site-logs', icon: FileText, group: '工地管理', keywords: ['site', 'log', '施工'] },
  { id: 'construction', name: '施工進度', path: '/construction', icon: Building2, group: '工地管理', keywords: ['construction', '工程'] },
  
  // Tools
  { id: 'materials', name: '材料估算', path: '/materials', icon: Wrench, group: '工具箱', keywords: ['material', 'calculator', '計算'] },
  { id: 'calculators', name: '專業計算', path: '/calculators', icon: Wrench, group: '工具箱', keywords: ['calculator', 'tool'] },
  
  // Admin
  { id: 'users', name: '使用者管理', path: '/users', icon: Users, group: '系統設定', keywords: ['user', 'admin', '人員'] },
  { id: 'integrations', name: '整合設定', path: '/integrations', icon: Settings, group: '系統設定', keywords: ['integration', 'api'] },
  { id: 'notifications', name: '通知設定', path: '/notification-settings', icon: Bell, group: '系統設定', keywords: ['notification', 'alert', '提醒'] },
];

// Quick actions
const QUICK_ACTIONS = [
  { id: 'new-project', name: '新增專案', action: 'navigate', path: '/projects?action=new', icon: Building2 },
  { id: 'new-invoice', name: '新增發票', action: 'navigate', path: '/invoices?action=new', icon: FileText },
  { id: 'new-client', name: '新增客戶', action: 'navigate', path: '/clients?action=new', icon: Users },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPages, setRecentPages] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load recent pages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('senteng_recent_pages');
    if (stored) {
      try {
        setRecentPages(JSON.parse(stored));
      } catch (e) {
        setRecentPages([]);
      }
    }
  }, [isOpen]);

  // Filter pages based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      // Show recent pages and quick actions when no query
      const recentItems = recentPages
        .map(id => ALL_PAGES.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, 5);
      
      return {
        recent: recentItems,
        actions: QUICK_ACTIONS,
        pages: []
      };
    }

    const lowerQuery = query.toLowerCase();
    const matchedPages = ALL_PAGES.filter(page => {
      const nameMatch = page.name.toLowerCase().includes(lowerQuery);
      const groupMatch = page.group.toLowerCase().includes(lowerQuery);
      const keywordMatch = page.keywords.some(k => k.includes(lowerQuery));
      return nameMatch || groupMatch || keywordMatch;
    });

    const matchedActions = QUICK_ACTIONS.filter(action =>
      action.name.toLowerCase().includes(lowerQuery)
    );

    return {
      recent: [],
      actions: matchedActions,
      pages: matchedPages
    };
  }, [query, recentPages]);

  // Flatten results for navigation
  const allResults = useMemo(() => {
    return [
      ...filteredResults.recent,
      ...filteredResults.actions,
      ...filteredResults.pages
    ];
  }, [filteredResults]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [allResults, selectedIndex, onClose]);

  // Handle selection
  const handleSelect = useCallback((item) => {
    // Save to recent pages
    if (item.path && !item.action) {
      const newRecent = [item.id, ...recentPages.filter(id => id !== item.id)].slice(0, 10);
      localStorage.setItem('senteng_recent_pages', JSON.stringify(newRecent));
    }

    // Navigate
    navigate(item.path);
    onClose();
  }, [navigate, onClose, recentPages]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const ResultItem = ({ item, index, showGroup = false }) => {
    const Icon = item.icon;
    const isSelected = index === selectedIndex;
    
    return (
      <button
        data-index={index}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
          ${isSelected 
            ? 'bg-gradient-to-r from-stone-800 to-stone-700 text-white' 
            : 'text-stone-700 hover:bg-stone-100'
          }
        `}
      >
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${isSelected ? 'bg-white/20' : 'bg-stone-100'}
        `}>
          <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          {showGroup && item.group && (
            <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>
              {item.group}
            </div>
          )}
        </div>
        {isSelected && (
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <span>開啟</span>
            <CornerDownLeft className="w-3 h-3" />
          </div>
        )}
      </button>
    );
  };

  let itemIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[1100] animate-fade-in-up"
        onKeyDown={handleKeyDown}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-200">
            <Search className="w-5 h-5 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="搜尋頁面或執行動作..."
              className="flex-1 bg-transparent outline-none text-stone-900 placeholder-stone-400"
            />
            <div className="flex items-center gap-1 text-xs text-stone-400">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono">ESC</kbd>
              <span>關閉</span>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto">
            {/* Recent Pages */}
            {filteredResults.recent.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-stone-400 uppercase tracking-wider bg-stone-50">
                  <Clock className="w-3 h-3 inline mr-1" />
                  最近使用
                </div>
                {filteredResults.recent.map((item) => (
                  <ResultItem key={item.id} item={item} index={itemIndex++} />
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {filteredResults.actions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-stone-400 uppercase tracking-wider bg-stone-50">
                  <ArrowRight className="w-3 h-3 inline mr-1" />
                  快速動作
                </div>
                {filteredResults.actions.map((item) => (
                  <ResultItem key={item.id} item={item} index={itemIndex++} />
                ))}
              </div>
            )}

            {/* Search Results */}
            {filteredResults.pages.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-stone-400 uppercase tracking-wider bg-stone-50">
                  <FileText className="w-3 h-3 inline mr-1" />
                  頁面
                </div>
                {filteredResults.pages.map((item) => (
                  <ResultItem key={item.id} item={item} index={itemIndex++} showGroup />
                ))}
              </div>
            )}

            {/* No Results */}
            {allResults.length === 0 && query && (
              <div className="px-4 py-12 text-center text-stone-400">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>找不到「{query}」相關結果</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50 text-xs text-stone-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 font-mono">↓</kbd>
                導航
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 font-mono">↵</kbd>
                選擇
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>+ K 開啟</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
