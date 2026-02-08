/**
 * Permission utility functions
 * Extracted from RequirePermission.jsx to fix fast-refresh warning
 */

/**
 * 檢查是否有頁面存取權
 * @param {Object} permissions - 權限物件
 * @param {string} pageKey - 頁面 key
 * @returns {boolean}
 */
export function hasPageAccess(permissions, pageKey) {
    if (!permissions || !permissions.pages) return false;
    return permissions.pages.includes(pageKey);
}

/**
 * 檢查是否有操作權限
 * @param {Object} permissions - 權限物件
 * @param {string} domainKey - 權限域 key（如 integrations.google）
 * @param {string} action - 操作（如 connect）
 * @returns {boolean}
 */
export function hasAction(permissions, domainKey, action) {
    if (!permissions || !permissions.actions) return false;
    const domainActions = permissions.actions[domainKey];
    if (!domainActions || !Array.isArray(domainActions)) return false;
    return domainActions.includes(action);
}
