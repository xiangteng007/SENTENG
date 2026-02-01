import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BiExportService } from "./bi-export.service";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [TypeOrmModule],
  controllers: [ReportsController],
  providers: [BiExportService],
  exports: [BiExportService],
})
export class ReportsModule {}
