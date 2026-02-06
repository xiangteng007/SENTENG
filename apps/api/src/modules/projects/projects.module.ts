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
import { Contact } from "../contacts/contact.entity";
import { CustomerContact } from "../customers/customer-contact.entity";
import { VendorContact } from "../supply-chain/vendors/vendor-contact.entity";
import { Partner } from "../partners/partner.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectPhase,
      ProjectVendor,
      ProjectTask,
      ProjectContact,
      ProjectPartner,
      Contact,
      CustomerContact,
      VendorContact,
      Partner,
    ]),
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
