import { IsNumber, IsString, IsArray, IsObject } from 'class-validator';

/**
 * 權限回應 DTO
 *
 * 用於 GET /auth/permissions 端點
 * 前端 RBAC gating 的唯一權威來源
 */
export class PermissionsResponseDto {
  /**
   * 權限契約版本（用於前端快取失效判斷）
   */
  permissionsVersion: number;

  /**
   * 當前用戶 ID
   */
  userId: string;

  /**
   * 角色層級（數字越高權限越大）
   * 1 = user, 2 = 工程師, 3 = 會計, 4 = 經理, 5 = admin, 6 = super_admin
   */
  roleLevel: number;

  /**
   * 當前角色名稱
   */
  role: string;

  /**
   * 可存取的頁面路徑清單
   */
  pages: string[];

  /**
   * 各模組的操作權限
   */
  actions: Record<string, string[]>;
}

/**
 * 角色層級對照表（固定規格，不得變更）
 *
 * Level 1: user - 基本瀏覽（只讀）
 * Level 2: engineer - 專案與事件操作
 * Level 3: accountant - 財務與發票相關操作
 * Level 4: manager - 多數功能 + 審核權限
 * Level 5: admin - 全部功能（含設定）
 * Level 6: super_admin - 最高權限（含租戶/系統級管理）
 */
export const ROLE_LEVELS: Record<string, number> = {
  user: 1,
  一般使用者: 1,
  engineer: 2,
  工程師: 2,
  accountant: 3,
  會計: 3,
  manager: 4,
  經理: 4,
  admin: 5,
  管理員: 5,
  super_admin: 6,
  最高管理員: 6,
};

/**
 * 角色可存取頁面對照表
 */
export const ROLE_PAGES: Record<number, string[]> = {
  // Level 1: user - 基本瀏覽
  1: ['dashboard'],
  // Level 2: 工程師 - 專案相關
  2: ['dashboard', 'projects', 'schedule', 'events'],
  // Level 3: 會計 - 財務相關
  3: [
    'dashboard',
    'finance',
    'invoices',
    'payments',
    'cost-entries',
    'profit',
    'invoice', // 發票小幫手
  ],
  // Level 4: 經理 - 大部分功能
  4: [
    'dashboard',
    'clients',
    'vendors',
    'projects',
    'quotations',
    'contracts',
    'payments',
    'change-orders',
    'cost-entries',
    'inventory',
    'finance',
    'profit',
    'schedule',
    'invoices',
    'events',
    'settings',
    'integrations',
    // 工具箱
    'materials',
    'invoice',
    'unit',
    'cost',
    'calc',
    'material-calc',
  ],
  // Level 5: admin - 全部功能
  5: [
    'dashboard',
    'clients',
    'vendors',
    'projects',
    'quotations',
    'contracts',
    'payments',
    'change-orders',
    'cost-entries',
    'inventory',
    'finance',
    'profit',
    'schedule',
    'invoices',
    'user-management',
    'events',
    'settings',
    'integrations',
    // 工具箱
    'materials',
    'invoice',
    'unit',
    'cost',
    'calc',
    'material-calc',
  ],
  // Level 6: super_admin - 全部功能
  6: [
    'dashboard',
    'clients',
    'vendors',
    'projects',
    'quotations',
    'contracts',
    'payments',
    'change-orders',
    'cost-entries',
    'inventory',
    'finance',
    'profit',
    'schedule',
    'invoices',
    'user-management',
    'events',
    'settings',
    'integrations',
    // 工具箱
    'materials',
    'invoice',
    'unit',
    'cost',
    'calc',
    'material-calc',
  ],
};

/**
 * 角色可執行動作對照表
 */
export const ROLE_ACTIONS: Record<number, Record<string, string[]>> = {
  // Level 1: user - 只能瀏覽
  1: {
    dashboard: ['read'],
  },
  // Level 2: 工程師 - 專案與事件操作
  2: {
    dashboard: ['read'],
    projects: ['read'],
    schedule: ['read'],
    events: ['create', 'read', 'update'],
  },
  // Level 3: 會計 - 財務操作
  3: {
    dashboard: ['read'],
    finance: ['read', 'export'],
    invoices: ['create', 'read', 'update', 'issue', 'void'],
    payments: ['create', 'read', 'update'],
    'cost-entries': ['create', 'read', 'update'],
    'profit-analysis': ['read', 'export'],
  },
  // Level 4: 經理 - 審核權限
  4: {
    dashboard: ['read'],
    clients: ['create', 'read', 'update'],
    vendors: ['create', 'read', 'update'],
    projects: ['create', 'read', 'update'],
    quotations: ['create', 'read', 'update', 'submit', 'approve', 'reject', 'new-version'],
    contracts: ['create', 'read', 'update', 'approve'],
    payments: ['create', 'read', 'update', 'approve'],
    'change-orders': ['create', 'read', 'update', 'approve'],
    'cost-entries': ['create', 'read', 'update'],
    inventory: ['create', 'read', 'update', 'adjust', 'transfer'],
    finance: ['read', 'export'],
    'profit-analysis': ['read', 'export'],
    schedule: ['create', 'read', 'update', 'delete'],
    events: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'issue', 'void'],
    // Google Integrations 權限（manager 級）
    'integrations.google': ['read', 'connect', 'configure'],
    'integrations.google.calendar': ['sync_event', 'retry_failed', 'set_target_calendar'],
    'integrations.google.contacts': [
      'sync_contact',
      'sync_client',
      'sync_vendor',
      'retry_failed',
      'set_label',
    ],
  },
  // Level 5-6: admin/super_admin - 完整權限
  5: {
    clients: ['create', 'read', 'update', 'delete'],
    vendors: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    quotations: ['create', 'read', 'update', 'submit', 'approve', 'reject', 'new-version'],
    contracts: ['create', 'read', 'update', 'approve', 'terminate'],
    payments: ['create', 'read', 'update', 'approve'],
    'change-orders': ['create', 'read', 'update', 'approve'],
    'cost-entries': ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'adjust', 'transfer', 'delete'],
    finance: ['read', 'export'],
    'profit-analysis': ['read', 'export'],
    schedule: ['create', 'read', 'update', 'delete'],
    events: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'issue', 'void'],
    'user-management': ['create', 'read', 'update', 'delete'],
    // Google Integrations 權限（admin 級，含 disconnect 和 sync_bulk）
    'integrations.google': ['read', 'connect', 'configure', 'disconnect'],
    'integrations.google.calendar': [
      'sync_event',
      'sync_bulk',
      'retry_failed',
      'set_target_calendar',
    ],
    'integrations.google.contacts': [
      'sync_contact',
      'sync_client',
      'sync_vendor',
      'sync_bulk',
      'retry_failed',
      'set_label',
    ],
  },
  6: {
    clients: ['create', 'read', 'update', 'delete'],
    vendors: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    quotations: ['create', 'read', 'update', 'submit', 'approve', 'reject', 'new-version'],
    contracts: ['create', 'read', 'update', 'approve', 'terminate'],
    payments: ['create', 'read', 'update', 'approve'],
    'change-orders': ['create', 'read', 'update', 'approve'],
    'cost-entries': ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'adjust', 'transfer', 'delete'],
    finance: ['read', 'export'],
    'profit-analysis': ['read', 'export'],
    schedule: ['create', 'read', 'update', 'delete'],
    events: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'issue', 'void'],
    'user-management': ['create', 'read', 'update', 'delete'],
    // Google Integrations 權限（super_admin 級）
    'integrations.google': ['read', 'connect', 'configure', 'disconnect'],
    'integrations.google.calendar': [
      'sync_event',
      'sync_bulk',
      'retry_failed',
      'set_target_calendar',
    ],
    'integrations.google.contacts': [
      'sync_contact',
      'sync_client',
      'sync_vendor',
      'sync_bulk',
      'retry_failed',
      'set_label',
    ],
  },
};
