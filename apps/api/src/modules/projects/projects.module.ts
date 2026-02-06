import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./project.entity";
import { ProjectPhase } from "./project-phase.entity";
import { ProjectVendor } from "./project-vendor.entity";
import { ProjectTask } from "./project-task.entity";
import { ProjectContact } from "./project-contact.entity";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { ProjectContactsService } from "./project-contacts.service";
import { ProjectContactsController } from "./project-contacts.controller";
import { Contact } from "../contacts/contact.entity";
import { CustomerContact } from "../customers/customer-contact.entity";
import { VendorContact } from "../supply-chain/vendors/vendor-contact.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectPhase,
      ProjectVendor,
      ProjectTask,
      ProjectContact,
      Contact,
      CustomerContact,
      VendorContact,
    ]),
  ],
  controllers: [ProjectsController, ProjectContactsController],
  providers: [ProjectsService, ProjectContactsService],
  exports: [ProjectsService, ProjectContactsService],
})
export class ProjectsModule {}

