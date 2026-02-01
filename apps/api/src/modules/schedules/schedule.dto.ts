/**
 * schedule.dto.ts
 *
 * DTOs for schedule/Gantt module
 */

import {
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  MaxLength,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

// ScheduleTask DTOs
export class CreateScheduleTaskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress?: number;

  @IsOptional()
  @IsEnum(["task", "milestone", "project", "phase"])
  type?: "task" | "milestone" | "project" | "phase";

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  dependencies?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignee?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedCost?: number;
}

export class UpdateScheduleTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress?: number;

  @IsOptional()
  @IsEnum(["pending", "in_progress", "completed", "delayed", "cancelled"])
  status?: "pending" | "in_progress" | "completed" | "delayed" | "cancelled";

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  dependencies?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignee?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actualCost?: number;
}

export class ScheduleTaskQueryDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsEnum(["task", "milestone", "project", "phase"])
  type?: string;

  @IsOptional()
  @IsEnum(["pending", "in_progress", "completed", "delayed", "cancelled"])
  status?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  rootOnly?: boolean;
}

// ScheduleDependency DTOs
export class CreateDependencyDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  dependsOnTaskId: string;

  @IsOptional()
  @IsEnum([
    "finish_to_start",
    "start_to_start",
    "finish_to_finish",
    "start_to_finish",
  ])
  type?:
    | "finish_to_start"
    | "start_to_start"
    | "finish_to_finish"
    | "start_to_finish";

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lagDays?: number;
}

// ScheduleMilestone DTOs
export class CreateMilestoneDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  targetDate: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isContractual?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paymentAmount?: number;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsDateString()
  actualDate?: string;

  @IsOptional()
  @IsEnum(["pending", "completed", "missed"])
  status?: "pending" | "completed" | "missed";

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isContractual?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paymentAmount?: number;
}

// Gantt Chart Response DTO
export interface GanttChartData {
  tasks: GanttTask[];
  milestones: GanttMilestone[];
  dependencies: GanttDependency[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    overallProgress: number;
    startDate: string;
    endDate: string;
  };
}

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  type: string;
  status: string;
  parentId?: string;
  color: string;
  assignee?: string;
  children?: GanttTask[];
}

export interface GanttMilestone {
  id: string;
  name: string;
  date: string;
  status: string;
  isContractual: boolean;
}

export interface GanttDependency {
  from: string;
  to: string;
  type: string;
  lagDays: number;
}
