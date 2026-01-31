import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VendorType, VendorStatus, PaymentTerms } from './vendor.entity';
import { TradeCode, CapabilityLevel } from './vendor-trade.entity';

export class CreateVendorDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  shortName?: string;

  @IsOptional()
  @IsEnum(VendorType)
  vendorType?: VendorType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lineId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // Banking
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountHolder?: string;

  // Payment
  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @IsOptional()
  @IsString()
  taxType?: string;

  // Classification
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  trades?: { tradeCode: TradeCode; capabilityLevel?: CapabilityLevel }[];

  @IsOptional()
  @IsString()
  driveFolder?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  shortName?: string;

  @IsOptional()
  @IsEnum(VendorType)
  vendorType?: VendorType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lineId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountHolder?: string;

  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @IsOptional()
  @IsString()
  taxType?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @IsOptional()
  @IsString()
  blacklistReason?: string;

  @IsOptional()
  @IsArray()
  certifications?: any[];

  @IsOptional()
  @IsArray()
  reviews?: any[];

  @IsOptional()
  @IsString()
  driveFolder?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VendorQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 20)
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  vendorType?: string;

  @IsOptional()
  @IsString()
  tradeCode?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}

export class AddTradeDto {
  @IsEnum(TradeCode)
  tradeCode: TradeCode;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsOptional()
  @IsEnum(CapabilityLevel)
  capabilityLevel?: CapabilityLevel;

  @IsOptional()
  @IsString()
  description?: string;
}
