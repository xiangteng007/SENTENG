/**
 * waste.dto.ts
 *
 * DTOs for waste management module
 */

import {
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  Min,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import type { WasteType, DisposalMethod } from "./waste.entity";

// WasteRecord DTOs
export class CreateWasteRecordDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(100)
  wasteType: WasteType;

  @IsString()
  @MaxLength(10)
  wasteCode: string;

  @IsDateString()
  wasteDate: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsEnum(["ton", "cubic_meter", "kg", "piece"])
  unit?: "ton" | "cubic_meter" | "kg" | "piece";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  disposerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  disposerLicenseNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  disposalFacility?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  generationLocation?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isRecyclable?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWasteRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  wasteType?: WasteType;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  wasteCode?: string;

  @IsOptional()
  @IsDateString()
  wasteDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsEnum(["generated", "stored", "transported", "disposed", "recycled"])
  status?: "generated" | "stored" | "transported" | "disposed" | "recycled";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  disposerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  disposerLicenseNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  disposalFacility?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transporterName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @IsOptional()
  @IsDateString()
  transportDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  disposalMethod?: DisposalMethod;

  @IsOptional()
  @IsDateString()
  disposalDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  manifestNumber?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  manifestSubmitted?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  disposalCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  transportCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  recycledQuantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  recyclerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WasteRecordQueryDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsString()
  wasteType?: WasteType;

  @IsOptional()
  @IsEnum(["generated", "stored", "transported", "disposed", "recycled"])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isRecyclable?: boolean;
}

// Monthly Report DTOs
export class GenerateMonthlyReportDto {
  @IsUUID()
  projectId: string;

  @IsNumber()
  @Min(2020)
  @Type(() => Number)
  year: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  month: number;
}

export class SubmitMonthlyReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  epaReportNumber?: string;
}

// Statistics Response
export interface WasteStatistics {
  projectId: string;
  period: { startDate: string; endDate: string };
  byType: {
    wasteType: WasteType;
    quantity: number;
    unit: string;
    count: number;
  }[];
  totals: {
    totalQuantity: number;
    recycledQuantity: number;
    recycleRate: number;
    disposalCost: number;
    transportCost: number;
  };
  pendingManifests: number;
}
