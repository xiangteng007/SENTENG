/**
 * ProjectPartner DTOs
 *
 * Data Transfer Objects for Project Partner relations
 */

import { ProjectPartnerRole } from "./project-partner.entity";

export class CreateProjectPartnerDto {
  projectId!: string;
  partnerId!: string;
  role?: ProjectPartnerRole;
  contractAmount?: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export class UpdateProjectPartnerDto {
  role?: ProjectPartnerRole;
  contractAmount?: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}
