import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enum for category level 1
export enum CategoryLevel1 {
  CONSTRUCTION = 'CONSTRUCTION',
  INTERIOR = 'INTERIOR',
}

// Work item input for calculation
export class WorkItemInputDto {
  @ApiProperty({ description: '工項代碼' })
  @IsString()
  itemCode: string;

  @ApiProperty({ description: 'Level 2 分類代碼' })
  @IsString()
  categoryL2: string;

  @ApiPropertyOptional({ description: 'Level 3 分類代碼' })
  @IsOptional()
  @IsString()
  categoryL3?: string;

  @ApiProperty({ description: '數量' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: '單位' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ description: '額外參數（厚度、密度等）' })
  @IsOptional()
  @IsObject()
  params?: Record<string, number>;
}

// Main calculation request DTO (renamed to avoid conflict with legacy CalculateRequestDto)
export class RunCalculationRequestDto {
  @ApiPropertyOptional({ description: '專案 ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ enum: CategoryLevel1, description: '頂層分類（營建/裝潢）' })
  @IsEnum(CategoryLevel1)
  categoryL1: CategoryLevel1;

  @ApiProperty({ type: [WorkItemInputDto], description: '工項列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkItemInputDto)
  workItems: WorkItemInputDto[];

  @ApiPropertyOptional({ description: '規則集版本（預設使用當前版本）' })
  @IsOptional()
  @IsString()
  ruleSetVersion?: string;
}

// Material breakdown line response
export class MaterialBreakdownLineDto {
  id: string;
  sourceWorkItemCode: string;
  categoryL1: string;
  categoryL2: string;
  categoryL3?: string;
  materialCode?: string;
  materialName: string;
  spec?: string;
  baseQuantity: number;
  wasteFactor: number;
  finalQuantity: number;
  unit: string;
  packagingUnit?: string;
  packagingQuantity?: number;
  unitPrice?: number;
  subtotal?: number;
  traceInfo?: {
    ruleApplied?: string;
    conversionFormula?: string;
  };
}

// Suggested estimate line for cost estimation
export class SuggestedEstimateLineDto {
  id: string;
  name: string;
  spec?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  subtotal?: number;
  categoryL1: string;
  categoryL2: string;
  sourceRunId: string;
}

// Calculation result response
export class CalculationResultDto {
  runId: string;
  ruleSetVersion: string;
  timestamp: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  inputSnapshotHash: string;
  durationMs?: number;
  materialBreakdown: MaterialBreakdownLineDto[];
  suggestedEstimateLines: SuggestedEstimateLineDto[];
  errors?: { itemCode: string; message: string }[];
}

// Query params for listing runs
export class ListRunsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: CategoryLevel1 })
  @IsOptional()
  @IsEnum(CategoryLevel1)
  categoryL1?: CategoryLevel1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number = 0;
}

// Category tree response
export class CategoryL3Dto {
  code: string;
  name: string;
  defaultMaterials?: string[];
}

export class CategoryL2Dto {
  code: string;
  name: string;
  defaultUnit?: string;
  children: CategoryL3Dto[];
}

export class CategoryL1Dto {
  code: string;
  name: string;
  children: CategoryL2Dto[];
}

export class TaxonomyResponseDto {
  categories: CategoryL1Dto[];
}
