import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./project.entity";
import { ProjectPhase } from "./project-phase.entity";
import { ProjectVendor } from "./project-vendor.entity";
import { ProjectTask } from "./project-task.entity";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectPhase,
      ProjectVendor,
      ProjectTask,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
