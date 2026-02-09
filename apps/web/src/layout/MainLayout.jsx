import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Briefcase, Users, Wallet, HardHat, Package, Bell, LayoutDashboard, Image as ImageIcon, Menu, X, FileText, Ruler, Calculator, Building2, LogOut, Settings, ChevronDown, Receipt, FileSignature, BarChart3, DollarSign, Wrench, ChevronRight, Link, Camera, Cpu, Home, ClipboardList, Shield, Construction as ConstructionIcon, Recycle, BookOpen, PhoneCall } from 'lucide-react';
import { NotificationPanel } from '../components/common/NotificationPanel';
import { GoogleService } from '../services/GoogleService';
import { useAuth } from '../context/AuthContext';


// 所有選單項目定義
const ALL_MENU_ITEMS = {
    // 總覽
    'dashboard': { id: 'dashboard', icon: LayoutDashboard, label: '儀表板' },
    'schedule': { id: 'schedule', icon: CalendarIcon, label: '行程管理' },
    'events': { id: 'events', icon: CalendarIcon, label: '活動管理' },
    
    // 專案管理
    'projects': { id: 'projects', icon: Briefcase, label: '專案管理' },
    'contracts': { id: 'contracts', icon: FileSignature, label: '合約管理' },
    'change-orders': { id: 'change-orders', icon: FileText, label: '變更單' },
    
    // 財務中心
    'finance': { id: 'finance', icon: Wallet, label: '財務管理' },
    'quotations': { id: 'quotations', icon: FileText, label: '估價單' },
    'payments': { id: 'payments', icon: Receipt, label: '請款管理' },
    'invoice': { id: 'invoice', icon: FileText, label: '發票小幫手' },
    
    // 關係人
    'clients': { id: 'clients', icon: Users, label: '業主管理' },
    'vendors': { id: 'vendors', icon: HardHat, label: '廠商管理' },
    'contacts': { id: 'contacts', icon: PhoneCall, label: '聯絡人' },
    
    // 供應鏈
    'procurements': { id: 'procurements', icon: Package, label: '採購管理' },
    'inventory': { id: 'inventory', icon: Package, label: '庫存管理' },
    
    // 分析報表
    'cost-entries': { id: 'cost-entries', icon: DollarSign, label: '成本追蹤' },
    'profit': { id: 'profit', icon: BarChart3, label: '利潤分析' },
    'reports': { id: 'reports', icon: BarChart3, label: '報表中心' },
    
    // 工地管理
    'site-logs': { id: 'site-logs', icon: ClipboardList, label: '工地日誌' },
    'construction': { id: 'construction', icon: ConstructionIcon, label: '施工管理' },
    'schedules': { id: 'schedules', icon: CalendarIcon, label: '工程進度' },
    
    // 智慧管理
    'bim': { id: 'bim', icon: Building2, label: 'BIM 建模' },
    'drone': { id: 'drone', icon: Camera, label: '空拍管理' },
    'smart-home': { id: 'smart-home', icon: Home, label: '智慧家庭' },
    
    // 工具箱
    'materials': { id: 'materials', icon: ImageIcon, label: '建材資料' },
    'materials-calc': { id: 'materials-calc', icon: Calculator, label: '物料計算器' },
    'unit': { id: 'unit', icon: Ruler, label: '單位換算' },
    'cost': { id: 'cost', icon: Calculator, label: '成本估算' },
    'calc': { id: 'calc', icon: Building2, label: '物料換算' },
    'regulations': { id: 'regulations', icon: BookOpen, label: '法規查詢' },
    
    // 安全環保
    'insurance': { id: 'insurance', icon: Shield, label: '保險管理' },
    'waste': { id: 'waste', icon: Recycle, label: '廢棄物管理' },
    
    // 系統設定
    'user-management': { id: 'user-management', icon: Settings, label: '使用者管理' },
    'integrations': { id: 'integrations', icon: Link, label: '整合設定', path: '/settings/integrations' },
    'notifications': { id: 'notifications', icon: Bell, label: '通知設定' },
};

// 群組定義（優化版分組結構）
const MENU_GROUPS = [
    {
        id: 'overview',
        label: '總覽',
        icon: LayoutDashboard,
        items: ['dashboard', 'schedule', 'events'],
        defaultExpanded: true,
    },
    {
        id: 'project',
        label: '專案管理',
        icon: Briefcase,
        items: ['projects', 'contracts', 'change-orders'],
        defaultExpanded: true,
    },
    {
        id: 'finance',
        label: '財務中心',
        icon: Wallet,
        items: ['finance', 'quotations', 'payments', 'invoice'],
        defaultExpanded: true,
    },
    {
        id: 'parties',
        label: '關係人',
        icon: Users,
        items: ['clients', 'vendors', 'contacts'],
        defaultExpanded: false,
    },
    {
        id: 'supply-chain',
        label: '供應鏈',
        icon: Package,
        items: ['procurements', 'inventory'],
        defaultExpanded: false,
    },
    {
        id: 'site',
        label: '工地管理',
        icon: ConstructionIcon,
        items: ['site-logs', 'construction', 'schedules'],
        defaultExpanded: false,
    },
    {
        id: 'analytics',
        label: '分析報表',
        icon: BarChart3,
        items: ['cost-entries', 'profit', 'reports'],
        defaultExpanded: false,
    },
    {
        id: 'smart',
        label: '智慧管理',
        icon: Cpu,
        items: ['bim', 'drone', 'smart-home'],
        defaultExpanded: false,
    },
    {
        id: 'tools',
        label: '工具箱',
        icon: Wrench,
        items: ['materials', 'materials-calc', 'regulations'],
        defaultExpanded: false,
    },
    {
        id: 'safety',
        label: '安全環保',
        icon: Shield,
        items: ['insurance', 'waste'],
        defaultExpanded: false,
    },
    {
        id: 'admin',
        label: '系統設定',
        icon: Settings,
        items: ['user-management', 'integrations', 'notifications'],
        defaultExpanded: false,
        adminOnly: true,
    },
];

// localStorage key
const EXPANDED_GROUPS_KEY = 'senteng_expanded_groups';

// 單一選單項目組件
const SidebarItem = ({ id, icon: Icon, label, active, onClick, compact = false }) => {
    return (
        <button
            onClick={() => onClick(id)}
            className={`
                w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative
                ${active
                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-soft'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/80'
                }
                ${compact ? 'py-2' : 'py-2.5'}
            `}
        >
            {/* Active indicator bar */}
            {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/30 rounded-full" />
            )}
            <Icon size={compact ? 16 : 18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
            <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        </button>
    );
};

// 可折疊的群組組件
const SidebarGroup = ({ group, items, activeTab, onItemClick, isExpanded, onToggleExpand }) => {
    const GroupIcon = group.icon;
    const hasActiveItem = items.some(item => item.id === activeTab);
    const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

    // 只在首次發現活躍項目時自動展開（不會阻止手動收回）
    useEffect(() => {
        if (hasActiveItem && !hasAutoExpanded && !isExpanded) {
            onToggleExpand(group.id, true);
            setHasAutoExpanded(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasActiveItem]);

    // 如果群組只有一個項目，直接顯示為可點擊項目
    if (items.length === 1) {
        const item = items[0];
        return (
            <SidebarItem
                key={item.id}
                {...item}
                active={activeTab === item.id}
                onClick={onItemClick}
            />
        );
    }

    return (
        <div className="mb-1">
            {/* 群組標題 */}
            <button
                onClick={() => onToggleExpand(group.id, !isExpanded)}
                className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                    ${hasActiveItem ? 'text-gray-800' : 'text-gray-500'}
                    hover:bg-gray-50/80 hover:text-gray-700
                `}
            >
                <GroupIcon size={18} strokeWidth={1.8} className="shrink-0 text-gray-400" />
                <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                />
            </button>

            {/* 群組內項目 */}
            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="pl-4 pt-1 space-y-0.5">
                    {items.map(item => (
                        <SidebarItem
                            key={item.id}
                            {...item}
                            active={activeTab === item.id}
                            onClick={onItemClick}
                            compact
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const MainLayout = ({ activeTab, setActiveTab, children, addToast: _addToast }) => {
    const { user, role, allowedPages, signOut } = useAuth();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [hasUpcomingEvents, setHasUpcomingEvents] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    // 初始化展開狀態
    useEffect(() => {
        const saved = localStorage.getItem(EXPANDED_GROUPS_KEY);
        if (saved) {
            try {
                setExpandedGroups(JSON.parse(saved));
            } catch (e) {
                // 使用預設值
                const defaultExpanded = {};
                MENU_GROUPS.forEach(g => {
                    defaultExpanded[g.id] = g.defaultExpanded;
                });
                setExpandedGroups(defaultExpanded);
            }
        } else {
            const defaultExpanded = {};
            MENU_GROUPS.forEach(g => {
                defaultExpanded[g.id] = g.defaultExpanded;
            });
            setExpandedGroups(defaultExpanded);
        }
    }, []);

    // 切換群組展開狀態
    const handleToggleExpand = (groupId, expanded) => {
        setExpandedGroups(prev => {
            const newState = { ...prev, [groupId]: expanded };
            localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(newState));
            return newState;
        });
    };

    // 根據權限過濾群組和項目
    const visibleGroups = useMemo(() => {
        return MENU_GROUPS
            .map(group => {
                // 過濾群組內的項目 - 純粹基於 allowedPages（RBAC gating）
                const visibleItems = group.items
                    .filter(itemId => allowedPages?.includes(itemId))
                    .map(itemId => ALL_MENU_ITEMS[itemId])
                    .filter(Boolean);

                return {
                    ...group,
                    visibleItems,
                };
            })
            .filter(group => group.visibleItems.length > 0);
    }, [allowedPages]);

    // 檢查是否有即將到來的行程
    useEffect(() => {
        const checkUpcomingEvents = async () => {
            try {
                const events = await GoogleService.fetchCalendarEvents();
                const now = new Date();
                const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                const upcoming = events.some(event => {
                    const eventDate = new Date(`${event.date}T${event.time}`);
                    return eventDate >= now && eventDate <= in24Hours;
                });

                setHasUpcomingEvents(upcoming);
            } catch (error) {
                console.error('Failed to check upcoming events:', error);
            }
        };

        checkUpcomingEvents();
        const interval = setInterval(checkUpcomingEvents, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Close mobile menu when changing tab
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activeTab]);

    return (
        <div className="flex h-screen bg-morandi-base font-sans text-gray-900 overflow-hidden">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Premium Glass Design with Grouped Navigation */}
            <aside className={`
                w-72 glass-card-elevated border-r border-gray-100/50 flex flex-col z-50
                fixed md:relative h-full
                transform transition-all duration-300 ease-smooth
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Close button for mobile - improved touch target */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden absolute top-4 right-4 p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                    <X size={22} />
                </button>

                {/* Logo Section */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-600 rounded-xl blur-sm opacity-50 group-hover:opacity-70 transition-opacity" />
                            <div className="relative w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                                S
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 tracking-tight">SENTENG</h1>
                            <p className="text-[10px] text-gray-400 font-medium tracking-widest">ERP SYSTEM</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 mb-3 divider-gradient" />

                {/* Grouped Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {visibleGroups.map(group => (
                        <SidebarGroup
                            key={group.id}
                            group={group}
                            items={group.visibleItems}
                            activeTab={activeTab}
                            onItemClick={setActiveTab}
                            isExpanded={expandedGroups[group.id] ?? group.defaultExpanded}
                            onToggleExpand={handleToggleExpand}
                        />
                    ))}
                </nav>

                {/* Version Info */}
                <div className="p-4 pt-2 border-t border-gray-100/50 mt-auto">
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[11px] text-gray-400 font-medium">v4.0.0 Grouped</span>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className="h-16 md:h-18 flex items-center justify-between px-4 md:px-8 bg-gradient-to-r from-transparent via-white/30 to-transparent">
                    {/* Mobile Menu Button - hidden on md and up */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2.5 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-white/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        <Menu size={22} />
                    </button>

                    <div className="flex-1 md:flex-none" />

                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Notification Button */}
                        <button
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="relative p-2.5 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-xl shadow-soft hover:shadow-card transition-all duration-200"
                        >
                            <Bell size={18} strokeWidth={1.8} />
                            {hasUpcomingEvents && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
                            )}
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/50 transition-all"
                            >
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-white shadow-soft object-cover"
                                    />
                                ) : (
                                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full border-2 border-white shadow-soft flex items-center justify-center">
                                        <span className="font-semibold text-gray-600 text-sm lg:text-base">
                                            {user?.displayName?.[0] || 'U'}
                                        </span>
                                    </div>
                                )}
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* User Dropdown */}
                            {isUserMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-800">{user?.displayName}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                                                role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {role === 'super_admin' ? '最高管理員' : role === 'admin' ? '管理員' : '一般使用者'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                signOut();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            登出
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <NotificationPanel
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pt-2 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
