import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  MaxLength,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";
import { ProjectType, ProjectStatus } from "./project.entity";
import { PhaseStatus } from "./project-phase.entity";
import { TaskStatus, TaskPriority } from "./project-task.entity";
import { VendorRole } from "./project-vendor.entity";

export class CreateProjectDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(20)
  customerId: string;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  contractAmount?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  costBudget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pmUserId?: string;

  @IsOptional()
  @IsString()
  driveFolder?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerId?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  contractAmount?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  changeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  costBudget?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  costActual?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pmUserId?: string;

  @IsOptional()
  @IsString()
  driveFolder?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProjectQueryDto {
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
  projectType?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreatePhaseDto {
  @IsString()
  @MaxLength(30)
  phaseCode: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsNumber()
  seq?: number;

  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  budgetAmount?: number;
}

export class AddVendorDto {
  @IsString()
  @MaxLength(20)
  vendorId: string;

  @IsOptional()
  @IsEnum(VendorRole)
  role?: VendorRole;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  contractAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phaseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vendorId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
