import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class ChangeOrderItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsNumber()
  itemOrder?: number;

  @IsString()
  @MaxLength(200)
  itemName: string;

  @IsOptional()
  @IsString()
  spec?: string;

  @IsOptional()
  @IsString()
  unit?: string = "式";

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateChangeOrderDto {
  @IsString()
  contractId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  daysImpact?: number = 0;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeOrderItemDto)
  items?: ChangeOrderItemDto[];
}

export class UpdateChangeOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  daysImpact?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeOrderItemDto)
  items?: ChangeOrderItemDto[];
}
