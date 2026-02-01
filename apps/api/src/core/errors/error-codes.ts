/**
 * Centralized Error Codes for SENTENG ERP
 * Phase 3 optimization - Production readiness
 *
 * Error codes follow the format: DOMAIN_CATEGORY_SEQUENCE
 * Example: AUTH_001, CRM_002, INV_003
 */

// ========== Base Error Code Types ==========

export interface AppErrorOptions {
  code: string;
  message: string;
  httpStatus: number;
  details?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details: Record<string, any>;
  public readonly timestamp: Date;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.details = options.details || {};
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp.toISOString(),
        ...(Object.keys(this.details).length > 0 && { details: this.details }),
      },
    };
  }
}

// ========== Error Code Definitions ==========

/**
 * Authentication & Authorization Errors (AUTH_xxx)
 */
export const AuthErrors = {
  UNAUTHORIZED: {
    code: "AUTH_001",
    message: "未經授權的訪問",
    httpStatus: 401,
  },
  INVALID_TOKEN: {
    code: "AUTH_002",
    message: "無效的認證令牌",
    httpStatus: 401,
  },
  TOKEN_EXPIRED: {
    code: "AUTH_003",
    message: "認證令牌已過期",
    httpStatus: 401,
  },
  INSUFFICIENT_PERMISSIONS: {
    code: "AUTH_004",
    message: "權限不足",
    httpStatus: 403,
  },
  ACCOUNT_LOCKED: {
    code: "AUTH_005",
    message: "帳號已被鎖定",
    httpStatus: 403,
  },
  INVALID_CREDENTIALS: {
    code: "AUTH_006",
    message: "無效的帳號或密碼",
    httpStatus: 401,
  },
} as const;

/**
 * Resource Errors (RES_xxx)
 */
export const ResourceErrors = {
  NOT_FOUND: { code: "RES_001", message: "找不到指定的資源", httpStatus: 404 },
  ALREADY_EXISTS: { code: "RES_002", message: "資源已存在", httpStatus: 409 },
  CONFLICT: { code: "RES_003", message: "操作衝突", httpStatus: 409 },
  DELETED: { code: "RES_004", message: "資源已被刪除", httpStatus: 410 },
} as const;

/**
 * Validation Errors (VAL_xxx)
 */
export const ValidationErrors = {
  INVALID_INPUT: { code: "VAL_001", message: "輸入資料無效", httpStatus: 400 },
  MISSING_REQUIRED: {
    code: "VAL_002",
    message: "缺少必要欄位",
    httpStatus: 400,
  },
  INVALID_FORMAT: { code: "VAL_003", message: "格式不正確", httpStatus: 400 },
  OUT_OF_RANGE: { code: "VAL_004", message: "數值超出範圍", httpStatus: 400 },
} as const;

/**
 * CRM Domain Errors (CRM_xxx)
 */
export const CrmErrors = {
  CLIENT_NOT_FOUND: { code: "CRM_001", message: "找不到客戶", httpStatus: 404 },
  CONTACT_NOT_FOUND: {
    code: "CRM_002",
    message: "找不到聯絡人",
    httpStatus: 404,
  },
  INVALID_CLIENT_STATUS: {
    code: "CRM_003",
    message: "無效的客戶狀態",
    httpStatus: 400,
  },
  DUPLICATE_CLIENT: { code: "CRM_004", message: "客戶已存在", httpStatus: 409 },
} as const;

/**
 * Supply Chain Domain Errors (SCM_xxx)
 */
export const SupplyChainErrors = {
  VENDOR_NOT_FOUND: {
    code: "SCM_001",
    message: "找不到供應商",
    httpStatus: 404,
  },
  PROCUREMENT_NOT_FOUND: {
    code: "SCM_002",
    message: "找不到採購單",
    httpStatus: 404,
  },
  VENDOR_BLACKLISTED: {
    code: "SCM_003",
    message: "供應商已被列入黑名單",
    httpStatus: 403,
  },
  BID_ALREADY_SUBMITTED: {
    code: "SCM_004",
    message: "已提交過報價",
    httpStatus: 409,
  },
  INVALID_PROCUREMENT_STATUS: {
    code: "SCM_005",
    message: "無效的採購狀態",
    httpStatus: 400,
  },
} as const;

/**
 * Project Domain Errors (PRJ_xxx)
 */
export const ProjectErrors = {
  PROJECT_NOT_FOUND: {
    code: "PRJ_001",
    message: "找不到專案",
    httpStatus: 404,
  },
  INVALID_PROJECT_STATUS: {
    code: "PRJ_002",
    message: "無效的專案狀態",
    httpStatus: 400,
  },
  BUDGET_EXCEEDED: { code: "PRJ_003", message: "超出預算", httpStatus: 400 },
  SCHEDULE_CONFLICT: { code: "PRJ_004", message: "排程衝突", httpStatus: 409 },
} as const;

/**
 * Finance Domain Errors (FIN_xxx)
 */
export const FinanceErrors = {
  INVOICE_NOT_FOUND: {
    code: "FIN_001",
    message: "找不到發票",
    httpStatus: 404,
  },
  PAYMENT_NOT_FOUND: {
    code: "FIN_002",
    message: "找不到付款記錄",
    httpStatus: 404,
  },
  INSUFFICIENT_BALANCE: {
    code: "FIN_003",
    message: "餘額不足",
    httpStatus: 400,
  },
  INVOICE_ALREADY_PAID: {
    code: "FIN_004",
    message: "發票已付款",
    httpStatus: 409,
  },
} as const;

/**
 * System Errors (SYS_xxx)
 */
export const SystemErrors = {
  INTERNAL_ERROR: { code: "SYS_001", message: "系統內部錯誤", httpStatus: 500 },
  DATABASE_ERROR: { code: "SYS_002", message: "資料庫錯誤", httpStatus: 500 },
  EXTERNAL_SERVICE_ERROR: {
    code: "SYS_003",
    message: "外部服務錯誤",
    httpStatus: 502,
  },
  RATE_LIMIT_EXCEEDED: {
    code: "SYS_004",
    message: "請求頻率過高",
    httpStatus: 429,
  },
  SERVICE_UNAVAILABLE: {
    code: "SYS_005",
    message: "服務暫時不可用",
    httpStatus: 503,
  },
} as const;

// ========== Error Factory Functions ==========

export function createAppError(
  errorDef: { code: string; message: string; httpStatus: number },
  details?: Record<string, any>,
  customMessage?: string,
): AppError {
  return new AppError({
    ...errorDef,
    message: customMessage || errorDef.message,
    details,
  });
}

// Export all error codes
export const ErrorCodes = {
  Auth: AuthErrors,
  Resource: ResourceErrors,
  Validation: ValidationErrors,
  Crm: CrmErrors,
  SupplyChain: SupplyChainErrors,
  Project: ProjectErrors,
  Finance: FinanceErrors,
  System: SystemErrors,
} as const;
