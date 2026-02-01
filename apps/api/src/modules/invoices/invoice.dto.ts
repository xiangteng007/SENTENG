import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType } from "@nestjs/mapped-types";

/**
 * 文件類型枚舉
 */
export enum DocType {
  INVOICE_B2B = "INVOICE_B2B", // 三聯式
  INVOICE_B2C = "INVOICE_B2C", // 二聯式
  INVOICE_EGUI = "INVOICE_EGUI", // 電子發票
  RECEIPT = "RECEIPT", // 收據
  CLAIM = "CLAIM", // 請款單
}

/**
 * 來源類型
 */
export enum SourceType {
  PAPER_SCAN = "PAPER_SCAN",
  EGUI_QR = "EGUI_QR",
  EGUI_PDF = "EGUI_PDF",
  MANUAL = "MANUAL",
}

/**
 * 發票狀態
 */
export enum InvoiceState {
  DRAFT = "DRAFT",
  UPLOADED = "UPLOADED",
  AI_EXTRACTED = "AI_EXTRACTED",
  NEEDS_REVIEW = "NEEDS_REVIEW",
  REVIEWED = "REVIEWED",
  ASSIGNED = "ASSIGNED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAYABLE_SCHEDULED = "PAYABLE_SCHEDULED",
  PAID = "PAID",
  VAT_CLAIMED = "VAT_CLAIMED",
  VOIDED = "VOIDED",
}

/**
 * 進項扣抵狀態
 */
export enum VatDeductibleStatus {
  UNKNOWN = "UNKNOWN",
  ELIGIBLE = "ELIGIBLE",
  INELIGIBLE = "INELIGIBLE",
  CLAIMED = "CLAIMED",
  ADJUSTED = "ADJUSTED",
}

/**
 * 付款狀態
 */
export enum PaymentStatus {
  UNPAID = "UNPAID",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
}

/**
 * 成本科目
 */
export enum CostCategory {
  MATERIAL = "MATERIAL",
  LABOR = "LABOR",
  SUBCONTRACT = "SUBCONTRACT",
  EQUIPMENT = "EQUIPMENT",
  TRANSPORT = "TRANSPORT",
  OVERHEAD = "OVERHEAD",
  MISC = "MISC",
}

/**
 * 建立發票 DTO
 */
export class CreateInvoiceDto {
  // 文件類型
  @IsOptional()
  @IsEnum(DocType)
  docType?: DocType;

  @IsOptional()
  @IsEnum(SourceType)
  sourceType?: SourceType;

  // 發票資訊
  @IsOptional()
  @IsString()
  invoiceTrack?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @IsOptional()
  @IsString()
  invoicePeriod?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsString()
  randomCode?: string;

  // 賣方/買方
  @IsOptional()
  @IsString()
  sellerTaxId?: string;

  @IsOptional()
  @IsString()
  sellerName?: string;

  @IsOptional()
  @IsString()
  buyerTaxId?: string;

  // 金額
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  fxRate?: number;

  @IsOptional()
  @IsNumber()
  amountNet?: number;

  @IsOptional()
  @IsNumber()
  amountTax?: number;

  @IsOptional()
  @IsNumber()
  amountGross?: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  // 向後兼容
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  // 進項扣抵
  @IsOptional()
  @IsEnum(VatDeductibleStatus)
  vatDeductibleStatus?: VatDeductibleStatus;

  @IsOptional()
  @IsString()
  vatClaimPeriod?: string;

  // 保留款
  @IsOptional()
  @IsNumber()
  retainageRate?: number;

  @IsOptional()
  @IsNumber()
  retainageAmount?: number;

  // 狀態
  @IsOptional()
  @IsEnum(InvoiceState)
  currentState?: InvoiceState;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  status?: string;

  // AI
  @IsOptional()
  @IsNumber()
  aiConfidence?: number;

  @IsOptional()
  @IsBoolean()
  aiNeedsReview?: boolean;

  // 關聯
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // 成本歸戶
  @IsOptional()
  @IsEnum(CostCategory)
  costCategory?: CostCategory;

  @IsOptional()
  @IsString()
  costCodeId?: string;

  // 其他
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // 附件
  @IsOptional()
  @IsString()
  primaryFileId?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

/**
 * 更新發票 DTO
 */
export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

/**
 * 查詢發票 DTO
 */
export class QueryInvoiceDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DocType)
  docType?: DocType;

  @IsOptional()
  @IsEnum(InvoiceState)
  currentState?: InvoiceState;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(VatDeductibleStatus)
  vatDeductibleStatus?: VatDeductibleStatus;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  invoicePeriod?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  amountMin?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  amountMax?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  aiNeedsReview?: boolean;
}

/**
 * 發票響應 DTO
 */
export class InvoiceResponseDto {
  id: string;
  docType: string;
  sourceType: string;
  invoiceTrack: string;
  invoiceNumber: string;
  invoiceNo: string;
  invoicePeriod: string;
  invoiceDate: string;
  sellerTaxId: string;
  sellerName: string;
  buyerTaxId: string;
  currency: string;
  amountNet: number;
  amountTax: number;
  amountGross: number;
  vatRate: number;
  vatDeductibleStatus: string;
  currentState: string;
  paymentStatus: string;
  aiConfidence: number;
  aiNeedsReview: boolean;
  projectId: string;
  projectName?: string;
  vendorId: string;
  vendorName?: string;
  costCategory: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 發票統計 DTO
 */
export class InvoiceStatsDto {
  totalCount: number;
  totalAmountNet: number;
  totalAmountTax: number;
  totalAmountGross: number;
  byState: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  byVatStatus: Record<string, number>;
  needsReviewCount: number;
  pendingApprovalCount: number;
  unpaidCount: number;
}
