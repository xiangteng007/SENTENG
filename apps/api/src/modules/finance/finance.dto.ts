import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from "class-validator";

// ==================== Account DTOs ====================
export class CreateAccountDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  bank?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bank?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// ==================== Transaction DTOs ====================
export class CreateTransactionDto {
  @IsString()
  type: string; // '收入' | '支出'

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  desc?: string;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  desc?: string;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}

// ==================== Loan DTOs ====================
export class CreateLoanDto {
  @IsString()
  bankName: string;

  @IsNumber()
  @Min(0)
  principalAmount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  remainingPrincipal?: number;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsNumber()
  totalTerms: number;

  @IsNumber()
  @IsOptional()
  paidTerms?: number;

  @IsNumber()
  @IsOptional()
  monthlyPayment?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateLoanDto {
  @IsString()
  @IsOptional()
  bankName?: string;

  @IsNumber()
  @IsOptional()
  principalAmount?: number;

  @IsNumber()
  @IsOptional()
  remainingPrincipal?: number;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsNumber()
  @IsOptional()
  totalTerms?: number;

  @IsNumber()
  @IsOptional()
  paidTerms?: number;

  @IsNumber()
  @IsOptional()
  monthlyPayment?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordPaymentDto {
  @IsNumber()
  @IsOptional()
  paymentAmount?: number;
}
