import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateCostEntryDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsDateString()
  entryDate: string;

  @IsIn(['MATERIAL', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER'])
  category: string;

  @IsString()
  @MaxLength(200)
  description: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vendorName?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCostEntryDto {
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsIn(['MATERIAL', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkPaidDto {
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsIn(['BANK_TRANSFER', 'CHECK', 'CASH', 'CREDIT_CARD', 'OTHER'])
  paymentMethod?: string = 'BANK_TRANSFER';
}
