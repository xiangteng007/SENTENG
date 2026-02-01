import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  IsDateString,
  IsIn,
} from "class-validator";

export class CreateWorkOrderDto {
  @IsString()
  @MaxLength(20)
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  jobSiteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  businessUnitId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  serviceId?: string;

  @IsString()
  @MaxLength(30)
  woNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsString()
  @MaxLength(30)
  woType: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTimeStart?: string;

  @IsOptional()
  @IsString()
  scheduledTimeEnd?: string;

  @IsOptional()
  @IsNumber()
  estimatedArea?: number;

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @IsOptional()
  @IsString()
  @IsIn(["LOW", "NORMAL", "HIGH", "CRITICAL"])
  priority?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteWorkOrderDto {
  @IsOptional()
  @IsNumber()
  actualArea?: number;

  @IsOptional()
  @IsNumber()
  actualDuration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleWorkOrderDto {
  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsString()
  timeStart?: string;

  @IsOptional()
  @IsString()
  timeEnd?: string;
}

export class CancelWorkOrderDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
