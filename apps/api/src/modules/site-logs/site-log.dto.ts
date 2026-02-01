import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDateString,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateSiteLogDto {
  @IsString()
  @MaxLength(20)
  projectId: string;

  @IsDateString()
  logDate: string;

  @IsOptional()
  @IsString()
  weatherAm?: string;

  @IsOptional()
  @IsString()
  weatherPm?: string;

  @IsOptional()
  @IsNumber()
  tempHigh?: number;

  @IsOptional()
  @IsNumber()
  tempLow?: number;

  @IsOptional()
  @IsNumber()
  workersOwn?: number;

  @IsOptional()
  @IsNumber()
  workersSubcon?: number;

  @IsOptional()
  @IsArray()
  workforce?: { trade: string; count: number; vendor?: string }[];

  @IsOptional()
  @IsArray()
  equipment?: { name: string; quantity: number; hours?: number }[];

  @IsOptional()
  @IsString()
  workPerformed?: string;

  @IsOptional()
  @IsArray()
  activities?: { location: string; description: string; progress: number }[];

  @IsOptional()
  @IsArray()
  materials?: {
    name: string;
    quantity: number;
    unit: string;
    received?: boolean;
  }[];

  @IsOptional()
  @IsArray()
  issues?: { type: string; description: string; resolved: boolean }[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  photos?: { url: string; caption: string; location?: string }[];
}

export class UpdateSiteLogDto {
  @IsOptional()
  @IsString()
  weatherAm?: string;

  @IsOptional()
  @IsString()
  weatherPm?: string;

  @IsOptional()
  @IsNumber()
  tempHigh?: number;

  @IsOptional()
  @IsNumber()
  tempLow?: number;

  @IsOptional()
  @IsNumber()
  workersOwn?: number;

  @IsOptional()
  @IsNumber()
  workersSubcon?: number;

  @IsOptional()
  @IsArray()
  workforce?: { trade: string; count: number; vendor?: string }[];

  @IsOptional()
  @IsArray()
  equipment?: { name: string; quantity: number; hours?: number }[];

  @IsOptional()
  @IsString()
  workPerformed?: string;

  @IsOptional()
  @IsArray()
  activities?: { location: string; description: string; progress: number }[];

  @IsOptional()
  @IsArray()
  materials?: {
    name: string;
    quantity: number;
    unit: string;
    received?: boolean;
  }[];

  @IsOptional()
  @IsArray()
  issues?: { type: string; description: string; resolved: boolean }[];

  @IsOptional()
  safety?: { incidents: number; nearMisses: number; notes?: string };

  @IsOptional()
  @IsArray()
  visitors?: {
    name: string;
    company: string;
    purpose: string;
    timeIn: string;
    timeOut?: string;
  }[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  photos?: { url: string; caption: string; location?: string }[];
}

export class SiteLogQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 20)
  limit?: number;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  approved?: boolean;
}
