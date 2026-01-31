import {
  IsString,
  IsOptional,
  IsEmail,
  IsIn,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsIn(['INDIVIDUAL', 'COMPANY'])
  type?: string = 'COMPANY';

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
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @ValidateIf(o => o.email !== '' && o.email !== null)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['TWD', 'CNY', 'USD'])
  defaultCurrency?: string = 'TWD';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  creditDays?: number = 30;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lineId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  budget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  driveFolder?: string;

  @IsOptional()
  @IsArray()
  customFields?: any[];

  @IsOptional()
  @IsArray()
  contactLogs?: any[];

  @IsOptional()
  @IsArray()
  contacts?: any[];

  @IsOptional()
  @IsIn([
    '洽談中',
    '提案/報價',
    '預售屋',
    '工程中',
    '已簽約',
    '已完工',
    '暫緩',
    'ACTIVE',
    'INACTIVE',
  ])
  status?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(['INDIVIDUAL', 'COMPANY'])
  type?: string;

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
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @ValidateIf(o => o.email !== '' && o.email !== null)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['TWD', 'CNY', 'USD'])
  defaultCurrency?: string;

  @IsOptional()
  @IsInt()
  creditDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lineId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  budget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  driveFolder?: string;

  @IsOptional()
  @IsArray()
  customFields?: any[];

  @IsOptional()
  @IsArray()
  contactLogs?: any[];

  @IsOptional()
  @IsArray()
  contacts?: any[];

  @IsOptional()
  @IsIn([
    '洽談中',
    '提案/報價',
    '預售屋',
    '工程中',
    '已簽約',
    '已完工',
    '暫緩',
    'ACTIVE',
    'INACTIVE',
  ])
  status?: string;
}
