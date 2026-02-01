import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  MaxLength,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";
import { ProcurementType, ProcurementStatus } from "./procurement.entity";

export class CreateProcurementDto {
  @IsString()
  @MaxLength(20)
  projectId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  budgetAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsDateString()
  rfqDeadline?: string;

  @IsOptional()
  @IsArray()
  specifications?: string[];
}

export class UpdateProcurementDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  budgetAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsDateString()
  rfqDeadline?: string;

  @IsOptional()
  @IsArray()
  specifications?: string[];
}

export class SubmitBidDto {
  @IsString()
  @MaxLength(20)
  vendorId: string;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  bidAmount: number;

  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;

  @IsOptional()
  @IsNumber()
  validityDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AwardBidDto {
  @IsString()
  bidId: string;

  @IsOptional()
  @IsString()
  awardReason?: string;
}

export class EvaluateBidDto {
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  score: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcurementQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 20)
  limit?: number;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
