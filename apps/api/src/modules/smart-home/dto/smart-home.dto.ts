import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSmartHomeProductDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  detailUrl?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  protocols?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  specs?: Record<string, string>;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceMin?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  priceMax?: number;
}

export class SyncResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  syncedAt: Date;

  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  newProducts: number;

  @ApiProperty()
  updatedProducts: number;

  @ApiPropertyOptional()
  errors?: string[];
}

export class SmartHomeQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;
}
