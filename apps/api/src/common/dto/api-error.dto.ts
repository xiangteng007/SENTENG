/**
 * api-error.dto.ts｜統一 API 錯誤回應格式
 *
 * 用途：定義前後端一致的錯誤契約
 * 規格：與 OpenAPI 定義一致
 *
 * 更新日期：2026-01-15
 */

/**
 * 驗證錯誤詳情
 */
export class ValidationErrorDetail {
  /** 欄位名稱 */
  field: string;

  /** 錯誤原因 */
  reason: string;

  /** 錯誤訊息 */
  message?: string;
}

/**
 * 統一 API 錯誤回應格式（固定規格，不得變更）
 *
 * @example
 * {
 *   "statusCode": 400,
 *   "error": "BAD_REQUEST",
 *   "message": "驗證失敗",
 *   "details": [{"field": "email", "reason": "invalid_format"}],
 *   "traceId": "abc-123-xyz"
 * }
 */
export class ApiErrorResponse {
  /** HTTP 狀態碼 */
  statusCode: number;

  /** 錯誤代碼 */
  error: string;

  /** 錯誤訊息（可顯示給用戶） */
  message: string;

  /** 驗證錯誤詳情 */
  details?: ValidationErrorDetail[];

  /** 追蹤 ID（用於除錯） */
  traceId?: string;

  /** 時間戳記 */
  timestamp?: string;

  /** API 路徑 */
  path?: string;
}

/**
 * 錯誤代碼對照表（中英文）
 */
export const ERROR_CODES: Record<string, { en: string; zh: string }> = {
  // 通用錯誤
  BAD_REQUEST: { en: 'Bad Request', zh: '請求格式錯誤' },
  UNAUTHORIZED: { en: 'Unauthorized', zh: '未授權' },
  FORBIDDEN: { en: 'Forbidden', zh: '權限不足' },
  NOT_FOUND: { en: 'Not Found', zh: '資源不存在' },
  CONFLICT: { en: 'Conflict', zh: '資源衝突' },
  INTERNAL_ERROR: { en: 'Internal Server Error', zh: '系統錯誤' },

  // 驗證錯誤
  VALIDATION_FAILED: { en: 'Validation Failed', zh: '驗證失敗' },
  INVALID_FORMAT: { en: 'Invalid Format', zh: '格式不正確' },
  REQUIRED_FIELD: { en: 'Required Field', zh: '必填欄位' },

  // 認證錯誤
  TOKEN_EXPIRED: { en: 'Token Expired', zh: '登入已過期' },
  TOKEN_INVALID: { en: 'Token Invalid', zh: '無效的登入憑證' },
  SESSION_EXPIRED: { en: 'Session Expired', zh: '會話已過期' },

  // 業務錯誤
  ALREADY_EXISTS: { en: 'Already Exists', zh: '資料已存在' },
  STATUS_INVALID: { en: 'Invalid Status', zh: '狀態不正確' },
  OPERATION_FAILED: { en: 'Operation Failed', zh: '操作失敗' },
};

/**
 * 取得錯誤訊息（優先中文）
 */
export function getErrorMessage(code: string, locale: 'zh' | 'en' = 'zh'): string {
  const error = ERROR_CODES[code];
  if (!error) {
    return code;
  }
  return locale === 'zh' ? error.zh : error.en;
}
