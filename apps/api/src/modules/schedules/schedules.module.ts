import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ScheduleTask,
  ScheduleDependency,
  ScheduleMilestone,
} from "./schedule-task.entity";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from "./schedule.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleTask,
      ScheduleDependency,
      ScheduleMilestone,
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class SchedulesModule {}
