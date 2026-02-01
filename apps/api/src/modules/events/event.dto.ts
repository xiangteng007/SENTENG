import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsInt,
  MaxLength,
  Min,
  IsIn,
} from "class-validator";

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @IsIn(["general", "meeting", "deadline", "reminder", "milestone"])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recurrenceRule?: string;

  @IsOptional()
  @IsDateString()
  recurrenceEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderMinutes?: number;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @IsIn(["general", "meeting", "deadline", "reminder", "milestone"])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recurrenceRule?: string;

  @IsOptional()
  @IsDateString()
  recurrenceEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(["scheduled", "completed", "cancelled"])
  status?: string;
}

export class QueryEventsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
