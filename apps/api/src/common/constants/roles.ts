/**
 * Senteng ERP - Unified Role Constants
 *
 * 統一角色定義，所有模組應引用此檔案。
 * 參考規範文件: docs/RBAC_STANDARD.md
 *
 * @version 1.0
 * @since 2026-01-22
 */

/**
 * 標準角色 ID（全大寫）
 * Level 5: SUPER_ADMIN - 最高管理員
 * Level 4: OWNER - 老闆/負責人
 * Level 3: ADMIN, PM - 管理員/專案經理
 * Level 2: DESIGNER, ENGINEER, FINANCE - 設計師/工程師/財務
 * Level 1: USER - 一般使用者
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  PM: "PM",
  DESIGNER: "DESIGNER",
  ENGINEER: "ENGINEER",
  FINANCE: "FINANCE",
  USER: "USER",
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

/**
 * 角色層級（數字越大權限越高）
 */
export const ROLE_LEVELS: Record<RoleId, number> = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.OWNER]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.PM]: 3,
  [ROLES.DESIGNER]: 2,
  [ROLES.ENGINEER]: 2,
  [ROLES.FINANCE]: 2,
  [ROLES.USER]: 1,
};

/**
 * 管理員角色列表（擁有全域存取權）
 * 用於 ownership bypass 檢查
 */
export const ADMIN_ROLES: readonly RoleId[] = [
  ROLES.SUPER_ADMIN,
  ROLES.OWNER,
  ROLES.ADMIN,
] as const;

/**
 * 所有有效角色列表
 */
export const ALL_ROLES: readonly RoleId[] = Object.values(ROLES) as RoleId[];

/**
 * 中文角色名稱對照表（用於顯示）
 */
export const ROLE_DISPLAY_NAMES: Record<RoleId, string> = {
  [ROLES.SUPER_ADMIN]: "最高管理員",
  [ROLES.OWNER]: "老闆",
  [ROLES.ADMIN]: "行政管理員",
  [ROLES.PM]: "專案經理",
  [ROLES.DESIGNER]: "設計師",
  [ROLES.ENGINEER]: "現場工程師",
  [ROLES.FINANCE]: "財務人員",
  [ROLES.USER]: "一般使用者",
};

/**
 * 舊角色名稱映射（用於向後相容）
 * 將舊的角色名稱映射到標準角色 ID
 */
export const LEGACY_ROLE_MAPPING: Record<string, RoleId> = {
  // 小寫變體
  super_admin: ROLES.SUPER_ADMIN,
  admin: ROLES.ADMIN,
  owner: ROLES.OWNER,
  pm: ROLES.PM,
  designer: ROLES.DESIGNER,
  engineer: ROLES.ENGINEER,
  finance: ROLES.FINANCE,
  user: ROLES.USER,
  // 中文變體
  最高管理員: ROLES.SUPER_ADMIN,
  管理員: ROLES.ADMIN,
  老闆: ROLES.OWNER,
  專案經理: ROLES.PM,
  設計師: ROLES.DESIGNER,
  工程師: ROLES.ENGINEER,
  財務: ROLES.FINANCE,
  使用者: ROLES.USER,
};

/**
 * 標準化角色名稱
 * 將任何格式的角色名稱轉換為標準 RoleId
 */
export function normalizeRole(role: string | null | undefined): RoleId | null {
  if (!role) return null;

  const upperRole = role.toUpperCase();

  // 直接匹配標準角色
  if (Object.values(ROLES).includes(upperRole as RoleId)) {
    return upperRole as RoleId;
  }

  // 查找舊格式映射
  if (role in LEGACY_ROLE_MAPPING) {
    return LEGACY_ROLE_MAPPING[role];
  }

  return null;
}

/**
 * 檢查角色是否為管理員
 */
export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized !== null && ADMIN_ROLES.includes(normalized);
}

/**
 * 取得角色層級
 */
export function getRoleLevel(role: string | null | undefined): number {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_LEVELS[normalized] : 0;
}
