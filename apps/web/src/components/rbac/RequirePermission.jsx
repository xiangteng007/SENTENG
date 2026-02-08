/**
 * RequirePermission.jsx
 * 
 * RBAC Action Gating 元件
 * 根據 permissions.actions 決定是否顯示子元件
 */


import { useAuth } from '../../context/AuthContext';
import { hasPageAccess, hasAction } from './permissionUtils';

/**
 * RequirePermission - RBAC Gating 元件
 * 
 * 用法 1（頁面 gating）：
 *   <RequirePermission pageKey="integrations">
 *     <IntegrationsContent />
 *   </RequirePermission>
 * 
 * 用法 2（操作 gating）：
 *   <RequirePermission domainKey="integrations.google" action="connect">
 *     <button>Connect</button>
 *   </RequirePermission>
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.pageKey] - 頁面 key（用於頁面 gating）
 * @param {string} [props.domainKey] - 權限域 key（用於操作 gating）
 * @param {string} [props.action] - 操作（用於操作 gating）
 * @param {React.ReactNode} [props.fallback] - 無權限時顯示的內容
 * @param {Object} [props.permissions] - 直接傳入 permissions（可選）
 */
export function RequirePermission({
    children,
    pageKey,
    domainKey,
    action,
    fallback = null,
    permissions: propPermissions
}) {
    const { permissions: contextPermissions } = useAuth();
    const permissions = propPermissions || contextPermissions;

    // 頁面 gating
    if (pageKey) {
        if (!hasPageAccess(permissions, pageKey)) {
            return fallback;
        }
        return children;
    }

    // 操作 gating
    if (domainKey && action) {
        if (!hasAction(permissions, domainKey, action)) {
            return fallback;
        }
        return children;
    }

    // 無 gating 規則，直接顯示
    return children;
}

export default RequirePermission;
