import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SiteLog } from "./site-log.entity";
import { SitePhoto } from "./site-photo.entity";
import { SiteLogsService } from "./site-logs.service";
import { SiteLogsController } from "./site-logs.controller";
import { SitePhotosService } from "./site-photos.service";
import { SitePhotosController } from "./site-photos.controller";
import { IntegrationsModule } from "../integrations/integrations.module";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteLog, SitePhoto]),
    IntegrationsModule,
    ProjectsModule,
  ],
  controllers: [SiteLogsController, SitePhotosController],
  providers: [SiteLogsService, SitePhotosService],
  exports: [SiteLogsService, SitePhotosService],
})
export class SiteLogsModule {}
