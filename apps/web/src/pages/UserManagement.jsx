// User Management Page (Super Admin Only)
import { useState, useEffect } from 'react';
import { useConfirm } from '../components/common/useConfirm';
import {
    Users,
    Shield,
    ChevronDown,
    Search,
    MoreVertical,
    Trash2,
    Edit3,
    Check,
    X,
    UserCog,
    Eye,
    EyeOff,
    Save,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getAllUsers,
    getAllRoles,
    updateUserRole,
    updateRoleConfig,
    deleteUser,
    DEFAULT_ROLES,
} from '../services/firebase';

// All available pages for permission configuration
const ALL_PAGES = [
    { id: 'dashboard', label: '儀表板', icon: '📊' },
    { id: 'schedule', label: '行程管理', icon: '📅' },
    { id: 'projects', label: '專案管理', icon: '💼' },
    { id: 'quotations', label: '估價單', icon: '📝' },
    { id: 'payments', label: '請款管理', icon: '🧾' },
    { id: 'contracts', label: '合約管理', icon: '📋' },
    { id: 'profit', label: '利潤分析', icon: '📊' },
    { id: 'clients', label: '客戶管理', icon: '👥' },
    { id: 'finance', label: '財務管理', icon: '💰' },
    { id: 'vendors', label: '廠商管理', icon: '🏗️' },
    { id: 'inventory', label: '庫存管理', icon: '📦' },
    { id: 'materials', label: '建材資料', icon: '🖼️' },
    { id: 'invoice', label: '發票小幫手', icon: '📜' },
    { id: 'unit', label: '單位換算', icon: '📐' },
    { id: 'cost', label: '成本估算', icon: '🧮' },
    { id: 'calc', label: '物料換算', icon: '🏢' },
];

// Role level labels
const ROLE_LABELS = {
    super_admin: { label: '最高管理員', color: 'bg-zinc-600', textColor: 'text-zinc-700' },
    admin: { label: '管理員', color: 'bg-blue-500', textColor: 'text-blue-600' },
    user: { label: '一般使用者', color: 'bg-gray-400', textColor: 'text-gray-600' },
};

const UserManagement = ({ addToast }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles'
    const [editingRole, setEditingRole] = useState(null);
    const [rolePermissions, setRolePermissions] = useState({});
    const { confirm, ConfirmDialog } = useConfirm();

    // Load users and roles
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                getAllUsers(),
                getAllRoles(),
            ]);
            setUsers(usersData);
            setRoles(rolesData);

            // Initialize role permissions
            const permissions = {};
            rolesData.forEach(role => {
                permissions[role.name] = role.allowedPages || [];
            });
            setRolePermissions(permissions);
        } catch (error) {
            console.error('Error loading data:', error);
            addToast?.('載入資料失敗', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle role change for a user
    const handleRoleChange = async (userId, newRole) => {
        if (userId === currentUser?.uid) {
            addToast?.('無法更改自己的角色', 'warning');
            return;
        }

        try {
            await updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u =>
                u.uid === userId ? { ...u, role: newRole } : u
            ));
            addToast?.('角色已更新', 'success');
        } catch (error) {
            console.error('Error updating role:', error);
            addToast?.('更新角色失敗', 'error');
        }
    };

    // Handle delete user
    const handleDeleteUser = async (userId) => {
        if (userId === currentUser?.uid) {
            addToast?.('無法刪除自己的帳號', 'warning');
            return;
        }

        const confirmed = await confirm({
            title: '確認刪除',
            message: '確定要刪除此使用者嗎？此操作無法復原。',
            type: 'danger',
            confirmText: '刪除',
        });
        if (!confirmed) return;

        try {
            await deleteUser(userId);
            setUsers(prev => prev.filter(u => u.uid !== userId));
            addToast?.('使用者已刪除', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            addToast?.('刪除使用者失敗', 'error');
        }
    };

    // Toggle page permission for a role
    const togglePagePermission = (roleName, pageId) => {
        if (roleName === 'super_admin') {
            addToast?.('無法修改最高管理員權限', 'warning');
            return;
        }

        setRolePermissions(prev => {
            const current = prev[roleName] || [];
            const updated = current.includes(pageId)
                ? current.filter(p => p !== pageId)
                : [...current, pageId];
            return { ...prev, [roleName]: updated };
        });
    };

    // Save role permissions
    const saveRolePermissions = async (roleName) => {
        try {
            const roleConfig = roles.find(r => r.name === roleName);
            await updateRoleConfig(roleName, {
                ...roleConfig,
                allowedPages: rolePermissions[roleName],
            });
            addToast?.('權限已儲存', 'success');
            setEditingRole(null);
            loadData();
        } catch (error) {
            console.error('Error saving permissions:', error);
            addToast?.('儲存權限失敗', 'error');
        }
    };

    // Filter users by search
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate?.() || new Date(timestamp);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">載入中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">使用者管理</h1>
                    <p className="text-sm text-gray-500 mt-1">管理使用者帳號與權限設定</p>
                </div>

                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                    <RefreshCw size={16} />
                    重新整理
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users size={16} />
                    使用者列表
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'roles'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Shield size={16} />
                    角色權限
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="搜尋使用者名稱或 Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                            />
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">使用者</th>
                                    <th className="px-6 py-3 font-medium">角色</th>
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">建立時間</th>
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">最後登入</th>
                                    <th className="px-6 py-3 font-medium text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.photoURL ? (
                                                    <img
                                                        src={user.photoURL}
                                                        alt={user.displayName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-gray-600">
                                                            {user.displayName?.[0] || user.email?.[0] || '?'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{user.displayName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                                disabled={user.uid === currentUser?.uid}
                                                className={`
                          px-3 py-1.5 text-xs font-medium rounded-lg border-0 cursor-pointer
                          ${ROLE_LABELS[user.role]?.color || 'bg-gray-400'} text-white
                          ${user.uid === currentUser?.uid ? 'opacity-60 cursor-not-allowed' : ''}
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                        `}
                                            >
                                                <option value="super_admin">最高管理員</option>
                                                <option value="admin">管理員</option>
                                                <option value="user">一般使用者</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm text-gray-500">{formatDate(user.lastLogin)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.uid !== currentUser?.uid && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.uid)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="刪除使用者"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Users size={48} className="mx-auto mb-4 opacity-30" />
                                <p>找不到符合的使用者</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className="space-y-6">
                    {Object.keys(DEFAULT_ROLES).map(roleName => (
                        <div key={roleName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Role Header */}
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${ROLE_LABELS[roleName]?.color}`} />
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{ROLE_LABELS[roleName]?.label}</h3>
                                        <p className="text-xs text-gray-500">
                                            權限等級: {DEFAULT_ROLES[roleName]?.level} |
                                            可訪問 {rolePermissions[roleName]?.length || 0} 個頁面
                                        </p>
                                    </div>
                                </div>

                                {roleName !== 'super_admin' && (
                                    <div className="flex items-center gap-2">
                                        {editingRole === roleName ? (
                                            <>
                                                <button
                                                    onClick={() => saveRolePermissions(roleName)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                                                >
                                                    <Save size={14} />
                                                    儲存
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingRole(null);
                                                        loadData();
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    <X size={14} />
                                                    取消
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setEditingRole(roleName)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <Edit3 size={14} />
                                                編輯權限
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Permission Grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {ALL_PAGES.map(page => {
                                        const isAllowed = rolePermissions[roleName]?.includes(page.id);
                                        const isEditing = editingRole === roleName;
                                        const isLocked = roleName === 'super_admin';

                                        return (
                                            <button
                                                key={page.id}
                                                onClick={() => isEditing && !isLocked && togglePagePermission(roleName, page.id)}
                                                disabled={!isEditing || isLocked}
                                                className={`
                          flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                          ${isAllowed
                                                        ? 'bg-green-50 border-green-200 text-green-700'
                                                        : 'bg-gray-50 border-gray-100 text-gray-400'
                                                    }
                          ${isEditing && !isLocked ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                          ${isLocked ? 'opacity-60' : ''}
                        `}
                                            >
                                                <span className="text-xl">{page.icon}</span>
                                                <span className="text-xs font-medium text-center leading-tight">{page.label}</span>
                                                {isAllowed ? (
                                                    <Eye size={12} className="text-green-500" />
                                                ) : (
                                                    <EyeOff size={12} className="text-gray-300" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog />
        </div>
    );
};

export default UserManagement;
