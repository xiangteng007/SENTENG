/**
 * Google Integration Services
 *
 * 此目錄將包含所有 Google Workspace 整合服務：
 * - google-oauth.service.ts (OAuth 認證)
 * - google-drive.service.ts (雲端硬碟)
 * - google-sheets.service.ts (試算表)
 * - calendar-sync.service.ts (日曆同步)
 * - contacts-sync.service.ts (聯絡人同步)
 *
 * 目前這些服務仍在父目錄，待 Phase 4 完成後遷移
 */

// Re-export from parent for now
export * from "../google-oauth.service";
export * from "../google-drive.service";
export * from "../google-sheets.service";
export * from "../calendar-sync.service";
export * from "../contacts-sync.service";
