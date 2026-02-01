/**
 * Invoice Export DTOs
 * 匯出請求資料傳輸物件
 */

import { IsOptional, IsString, IsEnum, IsNumber } from "class-validator";
import { Transform } from "class-transformer";
import { QueryInvoiceDto } from "./invoice.dto";

export enum ExportFormat {
  XLSX = "xlsx",
  CSV = "csv",
}

/**
 * Excel/CSV 匯出請求
 */
export class ExportExcelDto extends QueryInvoiceDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.XLSX;
}

/**
 * 401 申報格式匯出請求
 */
export class Export401Dto {
  @IsString()
  period: string; // 期別 e.g., "1-2", "3-4"

  @IsString()
  buyerTaxId: string; // 買方統編（我方）

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  year?: number; // 民國年 (e.g., 115)
}

/**
 * PDF 匯出請求
 */
export class ExportPdfDto extends QueryInvoiceDto {
  @IsOptional()
  @IsString()
  companyName?: string; // 公司名稱（用於報表表頭）

  @IsOptional()
  @IsString()
  reportTitle?: string; // 報表標題
}
