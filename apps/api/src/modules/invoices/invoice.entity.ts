import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Project } from "../projects/project.entity";
import { Contract } from "../contracts/contract.entity";
import { Client } from "../crm/clients/client.entity";
import { Vendor } from "../supply-chain/vendors/vendor.entity";

/**
 * 台灣發票管理實體
 * 支援三聯式/二聯式/電子發票/收據/請款單
 */
@Entity("invoices")
@Index(["invoiceTrack", "invoiceNumber", "sellerTaxId", "invoiceDate"], {
  unique: true,
})
@Index(["docType"])
@Index(["currentState"])
@Index(["vatDeductibleStatus"])
@Index(["paymentStatus"])
@Index(["invoicePeriod"])
export class Invoice {
  @PrimaryColumn({ length: 36 })
  id: string;

  // ============================================
  // 文件類型與來源
  // ============================================

  @Column({ name: "doc_type", length: 30, default: "INVOICE_B2B" })
  docType: string; // INVOICE_B2B, INVOICE_B2C, INVOICE_EGUI, RECEIPT, CLAIM

  @Column({ name: "source_type", length: 30, default: "MANUAL" })
  sourceType: string; // PAPER_SCAN, EGUI_QR, EGUI_PDF, MANUAL

  // ============================================
  // 發票資訊 (台灣專用)
  // ============================================

  @Column({ name: "invoice_track", length: 2, nullable: true })
  invoiceTrack: string; // 字軌 (如 AB)

  @Column({ name: "invoice_number", length: 8, nullable: true })
  invoiceNumber: string; // 8位數號碼

  @Column({ name: "invoice_no", length: 50, nullable: true })
  invoiceNo: string; // 完整發票號碼 (向後兼容)

  @Column({ name: "invoice_period", length: 5, nullable: true })
  invoicePeriod: string; // 期別 1-2, 3-4, 5-6...

  @Column({ name: "invoice_date", type: "date", nullable: true })
  invoiceDate: Date;

  @Column({ name: "random_code", length: 4, nullable: true })
  randomCode: string; // 隨機碼 (電子發票)

  // ============================================
  // 賣方/買方資訊
  // ============================================

  @Column({ name: "seller_tax_id", length: 8, nullable: true })
  @Index()
  sellerTaxId: string; // 賣方統編

  @Column({ name: "seller_name", length: 100, nullable: true })
  sellerName: string; // 賣方名稱

  @Column({ name: "buyer_tax_id", length: 8, nullable: true })
  buyerTaxId: string; // 買方統編 (我方)

  // ============================================
  // 金額資訊
  // ============================================

  @Column({ type: "varchar", length: 3, default: "TWD" })
  currency: string;

  @Column({
    name: "fx_rate",
    type: "decimal",
    precision: 10,
    scale: 4,
    default: 1,
  })
  fxRate: number;

  @Column({
    name: "amount_net",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  amountNet: number; // 未稅金額

  @Column({
    name: "amount_tax",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  amountTax: number; // 稅額

  @Column({
    name: "amount_gross",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  amountGross: number; // 含稅金額

  @Column({
    name: "vat_rate",
    type: "decimal",
    precision: 5,
    scale: 4,
    default: 0.05,
  })
  vatRate: number; // 稅率 (預設 5%)

  // 向後兼容舊欄位
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({
    name: "tax_rate",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 5,
  })
  taxRate: number;

  @Column({
    name: "tax_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: "total_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({
    name: "paid_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  // ============================================
  // 進項扣抵
  // ============================================

  @Column({ name: "vat_deductible_status", length: 20, default: "UNKNOWN" })
  vatDeductibleStatus: string; // UNKNOWN, ELIGIBLE, INELIGIBLE, CLAIMED, ADJUSTED

  @Column({ name: "vat_claim_period", length: 7, nullable: true })
  vatClaimPeriod: string; // 扣抵期別

  @Column({ name: "vat_claim_batch_id", length: 36, nullable: true })
  vatClaimBatchId: string;

  // ============================================
  // 保留款
  // ============================================

  @Column({
    name: "retainage_rate",
    type: "decimal",
    precision: 5,
    scale: 4,
    default: 0,
  })
  retainageRate: number;

  @Column({
    name: "retainage_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  retainageAmount: number;

  @Column({ name: "retainage_status", length: 20, default: "NONE" })
  retainageStatus: string; // NONE, HELD, RELEASED, PARTIAL

  // ============================================
  // 狀態
  // ============================================

  @Column({ name: "current_state", length: 30, default: "DRAFT" })
  currentState: string; // DRAFT -> UPLOADED -> AI_EXTRACTED -> NEEDS_REVIEW -> ...

  @Column({ name: "approval_status", length: 20, default: "DRAFT" })
  approvalStatus: string; // DRAFT, PENDING, APPROVED, REJECTED

  @Column({ name: "payment_status", length: 20, default: "UNPAID" })
  paymentStatus: string; // UNPAID, PARTIAL, PAID

  @Column({ length: 30, default: "INV_DRAFT" })
  status: string; // 向後兼容

  // ============================================
  // AI 辨識
  // ============================================

  @Column({
    name: "ai_confidence",
    type: "decimal",
    precision: 3,
    scale: 2,
    nullable: true,
  })
  aiConfidence: number;

  @Column({ name: "ai_needs_review", type: "boolean", default: false })
  aiNeedsReview: boolean;

  @Column({ name: "ai_extracted_data", type: "jsonb", nullable: true })
  aiExtractedData: Record<string, unknown>;

  // ============================================
  // 關聯
  // ============================================

  @Column({ name: "project_id", length: 36, nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "contract_id", length: 36, nullable: true })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: "contract_id" })
  contract: Contract;

  @Column({ name: "client_id", length: 36, nullable: true })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: "client_id" })
  client: Client;

  @Column({ name: "vendor_id", length: 36, nullable: true })
  vendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  // ============================================
  // 成本歸戶
  // ============================================

  @Column({ name: "cost_category", length: 30, nullable: true })
  costCategory: string; // MATERIAL, LABOR, SUBCONTRACT, EQUIPMENT, TRANSPORT, OVERHEAD, MISC

  @Column({ name: "cost_code_id", length: 36, nullable: true })
  costCodeId: string;

  // ============================================
  // 其他
  // ============================================

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "text", array: true, nullable: true })
  tags: string[];

  // ============================================
  // 附件
  // ============================================

  @Column({ name: "primary_file_id", length: 36, nullable: true })
  primaryFileId: string;

  @Column({ name: "thumbnail_url", type: "text", nullable: true })
  thumbnailUrl: string;

  // ============================================
  // 時間戳與審計
  // ============================================

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
