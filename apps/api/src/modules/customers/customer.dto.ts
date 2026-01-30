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
import { PipelineStage, CustomerType } from './customer.entity';

export class CreateCustomerDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactName?: string;

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
  @IsEnum(PipelineStage)
  pipelineStage?: PipelineStage;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  budget?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  creditDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  creditRating?: string;

  @IsOptional()
  @IsString()
  driveFolder?: string;

  @IsOptional()
  @IsArray()
  customFields?: Record<string, any>[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactName?: string;

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
  @IsEnum(PipelineStage)
  pipelineStage?: PipelineStage;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  budget?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  creditDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  creditRating?: string;

  @IsOptional()
  @IsString()
  driveFolder?: string;

  @IsOptional()
  @IsArray()
  customFields?: Record<string, any>[];

  @IsOptional()
  @IsArray()
  contactLogs?: any[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateContactDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

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
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CustomerQueryDto {
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
  pipelineStage?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
