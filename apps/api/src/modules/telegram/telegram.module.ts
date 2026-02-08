import { Module } from "@nestjs/common";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";
import { TelegramApiClient } from "./telegram-api.client";
import { ProjectCommandHandler } from "./handlers/project.handler";
import { FinancialCommandHandler } from "./handlers/financial.handler";
import { ContractCommandHandler } from "./handlers/contract.handler";
import { PartnerCommandHandler } from "./handlers/partner.handler";
import { PlatformCommandHandler } from "./handlers/platform.handler";
import { IntegrationCommandHandler } from "./handlers/integration.handler";
import { RegulatoryCommandHandler } from "./handlers/regulatory.handler";
import { ProjectsModule } from "../projects/projects.module";
import { SiteLogsModule } from "../site-logs/site-logs.module";
import { EventsModule } from "../events/events.module";
import { InventoryModule } from "../inventory/inventory.module";
import { PaymentsModule } from "../payments/payments.module";
import { ContractsModule } from "../contracts/contracts.module";
import { ChangeOrdersModule } from "../change-orders/change-orders.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { InvoicesModule } from "../invoices/invoices.module";
import { RegulationsModule } from "../regulations/regulations.module";
import { ConstructionModule } from "../construction/construction.module";
import { QuotationsModule } from "../quotations/quotations.module";
import { PartnersModule } from "../partners/partners.module";
import { CostEntriesModule } from "../cost-entries/cost-entries.module";
import { FinanceModule } from "../finance/finance.module";
import { InsuranceModule } from "../insurance/insurance.module";
import { ProfitAnalysisModule } from "../profit-analysis/profit-analysis.module";
import { PlatformModule } from "../platform/platform.module";
import { DroneModule } from "../drone/drone.module";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [
    ProjectsModule,
    SiteLogsModule,
    EventsModule,
    InventoryModule,
    PaymentsModule,
    ContractsModule,
    ChangeOrdersModule,
    NotificationsModule,
    InvoicesModule,
    RegulationsModule,
    ConstructionModule,
    QuotationsModule,
    PartnersModule,
    CostEntriesModule,
    FinanceModule,
    InsuranceModule,
    ProfitAnalysisModule,
    PlatformModule,
    DroneModule,
    IntegrationsModule,
  ],
  controllers: [TelegramController],
  providers: [
    TelegramApiClient,
    TelegramService,
    ProjectCommandHandler,
    FinancialCommandHandler,
    ContractCommandHandler,
    PartnerCommandHandler,
    PlatformCommandHandler,
    IntegrationCommandHandler,
    RegulatoryCommandHandler,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
