import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/project.entity';

/**
 * PurchaseInvoice (進項發票)
 * ACC-ADV-002: 進項發票管理，支援進項稅額抵扣
 * 
 * 進項發票 = 我方收到的發票 (由供應商開立給我方)
 * 銷項發票 = 我方開出的發票 (我方開立給客戶) - 使用 Invoice Entity
 * 
 * 台灣營業稅制度：
 * - 進項稅額可以抵扣銷項稅額
 * - 每期 (單月或雙月) 申報
 * - 需保存發票正本 5 年
 */
@Entity('purchase_invoices')
@Index(['projectId', 'invoiceDate'])
@Index(['vendorTaxId'])
@Index(['status'])
export class PurchaseInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', length: 36, nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * 發票號碼 (統一發票字軌)
   * 格式: XX-12345678 (2碼字軌-8碼號碼)
   */
  @Column({ name: 'invoice_number', length: 20 })
  invoiceNumber: string;

  /**
   * 發票類型
   * - GENERAL: 三聯式統一發票
   * - ELECTRONIC: 電子發票
   * - RECEIPT: 收據/免用統一發票
   */
  @Column({ name: 'invoice_type', length: 20, default: 'GENERAL' })
  invoiceType: string;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: Date;

  /**
   * 供應商資訊
   */
  @Column({ name: 'vendor_id', length: 36, nullable: true })
  vendorId: string;

  @Column({ name: 'vendor_name', length: 200 })
  vendorName: string;

  @Column({ name: 'vendor_tax_id', length: 20 })
  vendorTaxId: string; // 統一編號

  @Column({ name: 'vendor_address', length: 500, nullable: true })
  vendorAddress: string;

  /**
   * 金額資訊
   */
  @Column({ name: 'subtotal', type: 'decimal', precision: 15, scale: 2 })
  subtotal: number; // 未稅金額

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 5.00 })
  taxRate: number; // 稅率 (通常 5%)

  @Column({ name: 'tax_amount', type: 'decimal', precision: 15, scale: 2 })
  taxAmount: number; // 稅額

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number; // 含稅總額

  /**
   * 抵扣資訊
   */
  @Column({ name: 'is_deductible', default: true })
  isDeductible: boolean; // 是否可抵扣

  @Column({ name: 'deduction_status', length: 20, default: 'PENDING' })
  deductionStatus: string; // PENDING | DEDUCTED | NOT_APPLICABLE

  @Column({ name: 'deduction_period', length: 10, nullable: true })
  deductionPeriod: string; // 抵扣期別, e.g. "2026-01" (雙月期)

  /**
   * 分類與成本歸屬
   */
  @Column({ name: 'expense_category', length: 50, nullable: true })
  expenseCategory: string; // MATERIAL | LABOR | EQUIPMENT | SUBCONTRACT | OVERHEAD | OTHER

  @Column({ name: 'cost_code', length: 30, nullable: true })
  costCode: string; // 成本代碼

  @Column({ name: 'wbs_id', length: 36, nullable: true })
  wbsId: string; // 關聯 WBS 項目

  /**
   * 付款資訊
   */
  @Column({ length: 20, default: 'UNPAID' })
  status: string; // DRAFT | RECEIVED | VERIFIED | UNPAID | PARTIALLY_PAID | PAID | CANCELLED

  @Column({ name: 'payment_due_date', type: 'date', nullable: true })
  paymentDueDate: Date;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  /**
   * 關聯單據
   */
  @Column({ name: 'purchase_order_id', length: 36, nullable: true })
  purchaseOrderId: string;

  @Column({ name: 'goods_receipt_id', length: 36, nullable: true })
  goodsReceiptId: string;

  /**
   * 發票明細 (JSONB)
   * [{ description, quantity, unit, unitPrice, amount }]
   */
  @Column({ type: 'jsonb', nullable: true })
  lineItems: any;

  /**
   * 附件 (發票影像)
   */
  @Column({ type: 'jsonb', nullable: true })
  attachments: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'verified_by', length: 100, nullable: true })
  verifiedBy: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'created_by', length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
