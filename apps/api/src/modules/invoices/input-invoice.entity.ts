import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Project } from "../projects/project.entity";
import { Vendor } from "../supply-chain/vendors/vendor.entity";

/**
 * InputInvoice (進項發票)
 *
 * 管理可扣抵進項稅額的發票
 * 台灣營業稅: 銷項稅 - 進項稅 = 應繳稅額
 */
@Entity("input_invoices")
@Index(["projectId"])
@Index(["vendorId"])
@Index(["invoicePeriod"])
@Index(["deductionStatus"])
export class InputInvoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // 發票資訊
  @Column({ name: "invoice_track", length: 2 })
  invoiceTrack: string; // 字軌 (AB, CD, etc.)

  @Column({ name: "invoice_number", length: 8 })
  invoiceNumber: string; // 8位數號碼

  @Column({ name: "invoice_date", type: "date" })
  invoiceDate: Date;

  @Column({ name: "invoice_period", length: 5 })
  invoicePeriod: string; // 期別 1-2, 3-4, 5-6, 7-8, 9-10, 11-12

  // 賣方資訊 (供應商)
  @Column({ name: "seller_tax_id", length: 8 })
  sellerTaxId: string;

  @Column({ name: "seller_name", length: 100 })
  sellerName: string;

  @Column({ name: "vendor_id", length: 36, nullable: true })
  vendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;

  // 金額
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

  // 扣抵狀態
  @Column({ name: "deduction_status", length: 30, default: "PENDING" })
  deductionStatus: string; // PENDING | ELIGIBLE | CLAIMED | INELIGIBLE | ADJUSTED

  @Column({ name: "deduction_period", length: 7, nullable: true })
  deductionPeriod: string; // 扣抵期別 (YYYY-MM)

  @Column({ name: "deduction_batch_id", length: 36, nullable: true })
  deductionBatchId: string;

  @Column({
    name: "deductible_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  deductibleAmount: number; // 可扣抵金額

  // 不可扣抵原因 (如有)
  @Column({ name: "ineligible_reason", length: 100, nullable: true })
  ineligibleReason: string; // PERSONAL_USE | ENTERTAINMENT | GIFT | EXEMPT_SALES | OTHER

  // 專案關聯
  @Column({ name: "project_id", length: 36, nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  // 成本分類
  @Column({ name: "cost_category", length: 30, nullable: true })
  costCategory: string; // MATERIAL | LABOR | SUBCONTRACT | EQUIPMENT | OVERHEAD

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  // 附件
  @Column({ name: "file_id", length: 36, nullable: true })
  fileId: string;

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
