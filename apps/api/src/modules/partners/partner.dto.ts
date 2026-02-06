import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, Max, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PartnerType } from "./partner.entity";

// ============ Partner DTOs ============

export class CreatePartnerDto {
  @IsEnum(PartnerType)
  type: PartnerType;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  lineId?: string;

  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePartnerContactDto)
  @IsOptional()
  contacts?: CreatePartnerContactDto[];
}

export class UpdatePartnerDto {
  @IsEnum(PartnerType)
  @IsOptional()
  type?: PartnerType;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  lineId?: string;

  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ PartnerContact DTOs ============

export class CreatePartnerContactDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  lineId?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePartnerContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  lineId?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ Query DTOs ============

export class PartnerQueryDto {
  @IsEnum(PartnerType)
  @IsOptional()
  type?: PartnerType;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
