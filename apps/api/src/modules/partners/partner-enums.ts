/**
 * Partner Enums
 * 
 * 獨立的 enum 定義，避免 circular dependency
 */

/**
 * Partner 類型
 */
export enum PartnerType {
  CLIENT = "CLIENT",   // 客戶（業主）
  VENDOR = "VENDOR",   // 廠商
  PERSON = "PERSON",   // 個人
}

/**
 * 同步狀態
 */
export enum SyncStatus {
  PENDING = "PENDING",
  SYNCED = "SYNCED",
  FAILED = "FAILED",
  UNSYNCED = "UNSYNCED",
}

/**
 * 廠商分類
 */
export enum PartnerCategory {
  CONSTRUCTION = "工程工班",
  MATERIALS = "建材供應",
  EQUIPMENT = "設備廠商",
  DESIGN = "設計規劃",
  OTHER = "其他",
}
