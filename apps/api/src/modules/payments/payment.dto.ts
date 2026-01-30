import { IsString, IsNumber, IsOptional, IsDateString, IsIn, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  contractId: string;

  @IsDateString()
  applicationDate: string;

  @IsNumber()
  progressPercent: number;

  @IsNumber()
  requestAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  progressPercent?: number;

  @IsOptional()
  @IsNumber()
  requestAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReceiptDto {
  @IsString()
  applicationId: string;

  @IsDateString()
  receiptDate: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsIn(['BANK_TRANSFER', 'CHECK', 'CASH', 'OTHER'])
  paymentMethod?: string = 'BANK_TRANSFER';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
