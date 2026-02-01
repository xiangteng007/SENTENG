/**
 * insurance.dto.ts
 *
 * DTOs for insurance module
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
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import type { InsuranceType } from "./insurance.entity";

export class CreateInsuranceDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(100)
  type: InsuranceType;

  @IsString()
  @MaxLength(255)
  policyNumber: string;

  @IsString()
  @MaxLength(255)
  insurerName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurerCode?: string;

  @IsDateString()
  effectiveDate: string;

  @IsDateString()
  expiryDate: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  coverageAmount: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  premiumAmount: number;

  @IsString()
  @MaxLength(255)
  insuredName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  insuredTaxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  ratePercent?: number;

  @IsOptional()
  @IsString()
  coverageDescription?: string;

  @IsOptional()
  @IsString()
  exclusions?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  reminderDaysBefore?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  reminderEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  agentPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  agentEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInsuranceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  policyNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  insurerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurerCode?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  coverageAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  premiumAmount?: number;

  @IsOptional()
  @IsEnum(["pending", "active", "expired", "cancelled", "claimed"])
  status?: "pending" | "active" | "expired" | "cancelled" | "claimed";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  insuredName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  insuredTaxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  ratePercent?: number;

  @IsOptional()
  @IsString()
  coverageDescription?: string;

  @IsOptional()
  @IsString()
  exclusions?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  reminderDaysBefore?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  reminderEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  agentPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  agentEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InsuranceQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  type?: InsuranceType;

  @IsOptional()
  @IsEnum(["pending", "active", "expired", "cancelled", "claimed"])
  status?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  expiringWithin30Days?: boolean;
}

export class AddClaimDto {
  @IsString()
  claimNumber: string;

  @IsDateString()
  incidentDate: string;

  @IsDateString()
  reportDate: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  claimAmount: number;
}
