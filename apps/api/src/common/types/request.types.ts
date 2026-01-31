import { Request } from "express";

/**
 * 已驗證請求介面
 * 用於 Controller 中取代 `@Request() req: any`
 */
export interface AuthenticatedRequest extends Request {
  user: {
    /** 使用者 ID (如 USR-2026-0001) */
    userId: string;
    /** 使用者帳號 */
    username: string;
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
