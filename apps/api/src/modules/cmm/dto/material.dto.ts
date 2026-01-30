import { IsString, IsOptional, IsEnum, IsNumber, IsArray, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialCategory, MaterialStatus } from '../cmm-material-master.entity';

export class CreateMaterialDto {
  @ApiProperty({ description: '物料代碼', example: 'MAT-REBAR-001' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: '物料名稱', example: '竹節鋼筋 #3' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '英文名稱' })
  @IsOptional()
  @IsString()
  englishName?: string;

  @ApiProperty({ enum: MaterialCategory, description: '物料類別' })
  @IsEnum(MaterialCategory)
  category: MaterialCategory;

  @ApiPropertyOptional({ description: '子類別' })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiProperty({ description: '基礎單位', example: 'kg' })
  @IsString()
  @MaxLength(20)
  baseUnit: string;

  @ApiPropertyOptional({ description: '規格描述' })
  @IsOptional()
  @IsString()
  specification?: string;

  @ApiPropertyOptional({ description: '密度 (kg/m³)' })
  @IsOptional()
  @IsNumber()
  density?: number;

  @ApiPropertyOptional({ description: '單位重量' })
  @IsOptional()
  @IsNumber()
  unitWeight?: number;

  @ApiPropertyOptional({ description: '每公尺重量 (kg/m)' })
  @IsOptional()
  @IsNumber()
  standardWeightPerLength?: number;

  @ApiPropertyOptional({ description: 'RC 用量係數' })
  @IsOptional()
  @IsNumber()
  usageFactorRc?: number;

  @ApiPropertyOptional({ description: 'SRC 用量係數' })
  @IsOptional()
  @IsNumber()
  usageFactorSrc?: number;

  @ApiPropertyOptional({ description: 'SC 用量係數' })
  @IsOptional()
  @IsNumber()
  usageFactorSc?: number;

  @ApiPropertyOptional({ description: '參考價格' })
  @IsOptional()
  @IsNumber()
  referencePrice?: number;

  @ApiPropertyOptional({ description: '標籤' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '備註' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaterialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  englishName?: string;

  @ApiPropertyOptional({ enum: MaterialCategory })
  @IsOptional()
  @IsEnum(MaterialCategory)
  category?: MaterialCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  density?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  usageFactorRc?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  usageFactorSrc?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  usageFactorSc?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  referencePrice?: number;

  @ApiPropertyOptional({ enum: MaterialStatus })
  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MaterialQueryDto {
  @ApiPropertyOptional({ enum: MaterialCategory })
  @IsOptional()
  @IsEnum(MaterialCategory)
  category?: MaterialCategory;

  @ApiPropertyOptional({ enum: MaterialStatus })
  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
