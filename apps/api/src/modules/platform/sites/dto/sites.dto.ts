import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, IsIn } from 'class-validator';

export class CreateJobSiteDto {
  @IsString()
  @MaxLength(20)
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  projectId?: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: string;

  @IsOptional()
  @IsString()
  accessInfo?: string;

  @IsOptional()
  @IsBoolean()
  waterSource?: boolean;

  @IsOptional()
  @IsBoolean()
  powerSource?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateJobSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: string;

  @IsOptional()
  @IsString()
  accessInfo?: string;

  @IsOptional()
  @IsBoolean()
  waterSource?: boolean;

  @IsOptional()
  @IsBoolean()
  powerSource?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
