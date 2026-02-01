/**
 * Supply Chain Shared Enums
 * Phase 2 optimization - Shared constants for supply chain domain
 */

/**
 * Vendor status in the system
 */
export enum VendorStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  BLACKLISTED = "blacklisted",
}

/**
 * Vendor trade types (工種)
 */
export enum TradeCode {
  CIVIL = "civil", // 土木
  ELECTRICAL = "electrical", // 電氣
  PLUMBING = "plumbing", // 水電
  HVAC = "hvac", // 空調
  FINISHING = "finishing", // 裝修
  STEEL = "steel", // 鋼構
  LANDSCAPING = "landscaping", // 景觀
  PAINTING = "painting", // 油漆
  FLOORING = "flooring", // 地板
  WATERPROOFING = "waterproofing", // 防水
}

/**
 * Procurement status
 */
export enum ProcurementStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  ORDERED = "ordered",
  PARTIAL_RECEIVED = "partial_received",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

/**
 * Payment terms
 */
export enum PaymentTerms {
  CASH = "cash",
  NET_30 = "net_30",
  NET_60 = "net_60",
  NET_90 = "net_90",
  COD = "cod", // Cash on delivery
  PREPAID = "prepaid",
}
