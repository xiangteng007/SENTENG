import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "./event.entity";
import { EventsService } from "./events.service";
import { EventsController } from "./events.controller";

/**
 * EventsModule
 *
 * 行事曆事件管理模組
 *
 * API 端點:
 * - GET    /events            - 取得所有事件 (支援篩選)
 * - GET    /events/today      - 取得今日事件
 * - GET    /events/upcoming   - 取得即將到來的事件
 * - GET    /events/project/:id - 取得專案相關事件
 * - GET    /events/:id        - 取得單一事件
 * - POST   /events            - 建立事件
 * - PATCH  /events/:id        - 更新事件
 * - POST   /events/:id/complete - 完成事件
 * - POST   /events/:id/cancel   - 取消事件
 * - DELETE /events/:id        - 刪除事件
 */
@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
