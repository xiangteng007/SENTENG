import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator";
import { ProjectContactSourceType, ProjectContactRole } from "./project-contact.entity";

export class CreateProjectContactDto {
  @IsString()
  contactId: string;

  @IsEnum(ProjectContactSourceType)
  sourceType: ProjectContactSourceType;

  @IsEnum(ProjectContactRole)
  @IsOptional()
  roleInProject?: ProjectContactRole;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateProjectContactDto {
  @IsEnum(ProjectContactRole)
  @IsOptional()
  roleInProject?: ProjectContactRole;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ProjectContactResponseDto {
  id: string;
  projectId: string;
  contactId: string;
  sourceType: ProjectContactSourceType;
  roleInProject: ProjectContactRole;
  isPrimary: boolean;
  notes: string | null;
  createdAt: Date;
  
  // Populated contact info
  contact?: {
    name: string;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    title: string | null;
    lineId: string | null;
    syncStatus?: string;
  };
}
