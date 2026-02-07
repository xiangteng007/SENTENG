import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./project.entity";
import { ProjectPhase } from "./project-phase.entity";
import { ProjectVendor } from "./project-vendor.entity";
import { ProjectTask } from "./project-task.entity";
import { ProjectContact } from "./project-contact.entity";
import { ProjectPartner } from "./project-partner.entity";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { ProjectContactsService } from "./project-contacts.service";
import { ProjectContactsController } from "./project-contacts.controller";
import { ProjectPartnersService } from "./project-partners.service";
import { ProjectPartnersController } from "./project-partners.controller";
// Legacy entities via central module
import { LegacyEntitiesModule } from "../legacy-entities/legacy-entities.module";
// Unified Partners
import { PartnersModule } from "../partners/partners.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectPhase,
      ProjectVendor,
      ProjectTask,
      ProjectContact,
      ProjectPartner,
    ]),
    LegacyEntitiesModule, // Provides Contact, CustomerContact, VendorContact repos
    PartnersModule, // Provides PartnerContact repo
  ],
  controllers: [
    ProjectsController,
    ProjectContactsController,
    ProjectPartnersController,
  ],
  providers: [ProjectsService, ProjectContactsService, ProjectPartnersService],
  exports: [ProjectsService, ProjectContactsService, ProjectPartnersService],
})
export class ProjectsModule {}
