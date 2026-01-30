import { IsString, IsNumber, IsOptional, Min, IsIn, IsUUID } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  spec?: string;

  @IsString()
  mainCategory: string;

  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  safeStock?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInventoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  spec?: string;

  @IsString()
  @IsOptional()
  mainCategory?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  safeStock?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class StockMovementDto {
  @IsString()
  type: 'in' | 'out';

  @IsNumber()
  @Min(1)
  quantity: number;
}

/**
 * 庫存異動 DTO
 */
export class CreateMovementDto {
  @IsUUID()
  inventoryId: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsIn(['IN', 'OUT', 'TRANSFER', 'ADJUST'])
  movementType: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @IsString()
  @IsOptional()
  referenceNo?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
