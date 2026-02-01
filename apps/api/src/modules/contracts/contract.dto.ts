import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
  MaxLength,
} from "class-validator";

export class CreateContractDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  quotationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contractNo?: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsIn(["FIXED_PRICE", "COST_PLUS", "UNIT_PRICE"])
  contractType?: string = "FIXED_PRICE";

  @IsOptional()
  @IsIn(["TWD", "CNY", "USD"])
  currency?: string = "TWD";

  @IsNumber()
  originalAmount: number;

  @IsOptional()
  @IsNumber()
  retentionRate?: number = 0;

  @IsOptional()
  @IsIn(["PROGRESS", "MILESTONE", "FIXED_INSTALLMENT"])
  paymentTerms?: string = "PROGRESS";

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  warrantyMonths?: number = 12;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contractNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsNumber()
  retentionRate?: number;

  @IsOptional()
  @IsIn(["PROGRESS", "MILESTONE", "FIXED_INSTALLMENT"])
  paymentTerms?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  warrantyMonths?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConvertFromQuotationDto {
  @IsString()
  quotationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contractNo?: string;

  @IsOptional()
  @IsNumber()
  retentionRate?: number = 0;

  @IsOptional()
  @IsIn(["PROGRESS", "MILESTONE", "FIXED_INSTALLMENT"])
  paymentTerms?: string = "PROGRESS";

  @IsOptional()
  @IsNumber()
  warrantyMonths?: number = 12;
}
