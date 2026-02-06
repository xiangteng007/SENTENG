import { Module } from "@nestjs/common";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";
import { ProjectsModule } from "../projects/projects.module";
import { SiteLogsModule } from "../site-logs/site-logs.module";

@Module({
  imports: [ProjectsModule, SiteLogsModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
