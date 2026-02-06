import { Module } from "@nestjs/common";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";
import { ProjectsModule } from "../projects/projects.module";
import { SiteLogsModule } from "../site-logs/site-logs.module";
import { EventsModule } from "../events/events.module";
import { InventoryModule } from "../inventory/inventory.module";
import { PaymentsModule } from "../payments/payments.module";
import { ContractsModule } from "../contracts/contracts.module";
import { ChangeOrdersModule } from "../change-orders/change-orders.module";

@Module({
  imports: [
    ProjectsModule,
    SiteLogsModule,
    EventsModule,
    InventoryModule,
    PaymentsModule,
    ContractsModule,
    ChangeOrdersModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
