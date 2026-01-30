import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StructureType, BuildingUsage } from '../cmm-building-profile.entity';

/**
 * CMM 計算請求 DTO
 */
export class CalculateRequestDto {
  @ApiProperty({ enum: StructureType, description: '結構類型' })
  @IsEnum(StructureType)
  structureType: StructureType;

  @ApiPropertyOptional({ enum: BuildingUsage, description: '建築用途' })
  @IsOptional()
  @IsEnum(BuildingUsage)
  buildingUsage?: BuildingUsage;

  @ApiProperty({ description: '地上樓層數', example: 7 })
  @IsInt()
  @Min(1)
  @Max(100)
  floorCount: number;

  @ApiPropertyOptional({ description: '地下室層數', example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  basementCount?: number;

  @ApiProperty({ description: '每層樓地板面積 (m²)', example: 500 })
  @IsNumber()
  @Min(1)
  floorArea: number;

  @ApiPropertyOptional({ description: '建築參數代碼' })
  @IsOptional()
  @IsString()
  profileCode?: string;

  @ApiPropertyOptional({ description: '牆厚 (cm)', example: 15 })
  @IsOptional()
  @IsNumber()
  wallThickness?: number;

  @ApiPropertyOptional({ description: '地梁規格' })
  @IsOptional()
  @IsString()
  groundBeamSpec?: string;

  @ApiPropertyOptional({ description: '是否儲存結果' })
  @IsOptional()
  save?: boolean;

  @ApiPropertyOptional({ description: '關聯估價 ID' })
  @IsOptional()
  @IsString()
  estimateId?: string;
}

/**
 * 物料計算結果
 */
export class MaterialResultDto {
  @ApiProperty({ description: '物料類別' })
  category: string;

  @ApiProperty({ description: '數量' })
  quantity: number;

  @ApiProperty({ description: '單位' })
  unit: string;

  @ApiPropertyOptional({ description: '每平方米用量' })
  perSqm?: number;

  @ApiPropertyOptional({ description: '明細' })
  breakdown?: Record<string, any>;
}

/**
 * CMM 計算回應 DTO
 */
export class CalculateResponseDto {
  @ApiProperty({ description: '計算結果 ID' })
  resultId?: string;

  @ApiProperty({ description: '總樓地板面積 (m²)' })
  totalArea: number;

  @ApiProperty({ description: '總樓地板面積 (坪)' })
  totalAreaPing: number;

  @ApiProperty({ description: '鋼筋計算結果' })
  rebar: MaterialResultDto;

  @ApiProperty({ description: '混凝土計算結果' })
  concrete: MaterialResultDto;

  @ApiProperty({ description: '模板計算結果' })
  formwork: MaterialResultDto;

  @ApiPropertyOptional({ description: '鋼骨計算結果 (SRC/SC)' })
  steel?: MaterialResultDto;

  @ApiPropertyOptional({ description: '砂漿計算結果' })
  mortar?: MaterialResultDto;

  @ApiProperty({ description: '使用的建築參數' })
  profileUsed: {
    code: string;
    name: string;
    structureType: string;
  };

  @ApiProperty({ description: '計算版本' })
  version: number;

  @ApiProperty({ description: '計算時間' })
  calculatedAt: Date;

  @ApiProperty({ description: '輸入參數快照' })
  inputSnapshot: CalculateRequestDto;
}
