/**
 * CRM 銷售漏斗階段
 * 用於客戶追蹤與銷售管理
 */
export enum PipelineStage {
  /** 潛在客戶 - 初次接觸 */
  LEAD = 'lead',
  /** 已接洽 - 主動聯繫中 */
  CONTACTED = 'contacted',
  /** 報價中 - 已提供估價單 */
  QUOTED = 'quoted',
  /** 議價中 - 價格協商階段 */
  NEGOTIATING = 'negotiating',
  /** 已成交 - 簽約完成 */
  WON = 'won',
  /** 失敗 - 客戶流失 */
  LOST = 'lost',
}

/**
 * 客戶狀態
 */
export enum ClientStatus {
  /** 活躍客戶 */
  ACTIVE = 'active',
  /** 非活躍客戶 */
  INACTIVE = 'inactive',
  /** VIP 客戶 */
  VIP = 'vip',
}

/**
 * 聯絡人類型
 */
export enum ContactType {
  /** 主要聯絡人 */
  PRIMARY = 'primary',
  /** 技術聯絡人 */
  TECHNICAL = 'technical',
  /** 財務聯絡人 */
  BILLING = 'billing',
  /** 一般聯絡人 */
  GENERAL = 'general',
}
