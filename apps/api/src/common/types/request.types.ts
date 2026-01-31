import { Request } from "express";

/**
 * 已驗證請求介面
 * 用於 Controller 中取代 `@Request() req: any`
 *
 * 相容性屬性：
 * - userId / sub / id: 都指向使用者 ID
 * - role / roles: 都可用於角色檢查
 */
export interface AuthenticatedRequest extends Request {
  user: {
    /** 使用者 ID (主要) */
    userId: string;
    /** JWT subject (別名, 同 userId) */
    sub: string;
    /** 使用者 ID 別名 */
    id: string;
    /** 使用者帳號 */
    username: string;
    /** 使用者主要角色 (單一) */
    role: string;
    /** 使用者角色列表 */
    roles: string[];
    /** 使用者所屬租戶 ID (多租戶用) */
    tenantId?: string;
    /** 使用者所屬業務單位 ID */
    businessUnitId?: string;
  };
}

/**
 * JWT Payload 類型
 * 對應 auth.service.ts 中的 token 內容
 */
export interface JwtPayload {
  sub: string; // userId
  username: string;
  roles: string[];
  tenantId?: string;
  businessUnitId?: string;
  iat?: number;
  exp?: number;
}

/**
 * 分頁查詢參數
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/**
 * 分頁回應結果
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
