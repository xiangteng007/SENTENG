import { IsString, IsOptional, IsNumber, IsEnum, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ProcurementStatus, ProcurementType } from "./procurement.entity";

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
  @MaxLength(30)
  type?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  deadline?: string;
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
  @MaxLength(30)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;
}

export class ProcurementQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  status?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  projectId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;
}
