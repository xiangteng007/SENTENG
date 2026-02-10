import { Module, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CommonModule } from "./common/common.module";
import { CoreModule } from "./core";
// Legacy entity registration (no services/controllers - see LegacyEntitiesModule)
import { LegacyEntitiesModule } from "./modules/legacy-entities/legacy-entities.module";
// Active modules
import { ProjectsModule } from "./modules/projects/projects.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { QuotationsModule } from "./modules/quotations/quotations.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ChangeOrdersModule } from "./modules/change-orders/change-orders.module";
import { CostEntriesModule } from "./modules/cost-entries/cost-entries.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { ProfitAnalysisModule } from "./modules/profit-analysis/profit-analysis.module";
import { StorageModule } from "./modules/storage/storage.module";
// New Domain Modules
import { PlatformModule } from "./modules/platform/platform.module";
import { BimModule } from "./modules/bim/bim.module";
import { DroneModule } from "./modules/drone/drone.module";
import { ConstructionModule } from "./modules/construction/construction.module";
import { EventsModule } from "./modules/events/events.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { SiteLogsModule } from "./modules/site-logs/site-logs.module";
// CMM Domain (Phase 2)
import { CmmModule } from "./modules/cmm/cmm.module";
// Regulations Crawler
import { RegulationsModule } from "./modules/regulations/regulations.module";
// Smart Home (v3.1)
import { SmartHomeModule } from "./modules/smart-home/smart-home.module";
// Insurance (Phase 2.2)
import { InsuranceModule } from "./modules/insurance/insurance.module";
// Schedules (Phase 2.3)
import { SchedulesModule } from "./modules/schedules/schedules.module";
// Waste (Phase 2.4)
import { WasteModule } from "./modules/waste/waste.module";
import { ScheduleModule } from "@nestjs/schedule";
// Telegram Bot (Phase 6)
import { TelegramModule } from "./modules/telegram/telegram.module";
// Unified Partners CRM (Phase 7 - replaces legacy modules above)
import { PartnersModule } from "./modules/partners/partners.module";
// Supply Chain - Procurements
import { ProcurementsModule } from "./modules/supply-chain/procurements/procurements.module";

const logger = new Logger("TypeORM");

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting: 60 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 60, // 60 requests
      },
    ]),
    CommonModule,
    CoreModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbHost = process.env.DB_HOST || "localhost";
        const isUnixSocket = dbHost.startsWith("/cloudsql/");

        logger.log(
          `DB connection: ${isUnixSocket ? "Unix Socket" : "TCP"} to ${dbHost}`,
        );

        return {
          type: "postgres" as const,
          host: dbHost,
          // Port is ignored for Unix socket connections
          port: isUnixSocket
            ? undefined
            : parseInt(process.env.DB_PORT || "5432", 10),
          username: process.env.DB_USERNAME || "postgres",
          password: process.env.DB_PASSWORD || "postgres",
          database: process.env.DB_DATABASE || "erp",
          autoLoadEntities: true,
          synchronize: false, // Important: use migrations in production
          // Unix socket doesn't need SSL; TCP connections use SSL in production
          ssl: isUnixSocket
            ? false
            : process.env.NODE_ENV === "production"
              ? { rejectUnauthorized: false }
              : false,
          // Connection timeout settings for Cloud Run
          extra:
            process.env.NODE_ENV === "production"
              ? {
                  connectionTimeoutMillis: 15000,
                  idleTimeoutMillis: 30000,
                  max: 10,
                }
              : {},
        };
      },
    }),
    AuthModule,
    UsersModule,
    // Legacy entity registration only (services/controllers removed)
    LegacyEntitiesModule,
    ProjectsModule,
    QuotationsModule,
    ContractsModule,
    PaymentsModule,
    ChangeOrdersModule,
    CostEntriesModule,
    InvoicesModule,
    InventoryModule,
    FinanceModule,
    ProfitAnalysisModule,
    StorageModule,
    // New Domain Modules
    PlatformModule,
    BimModule,
    DroneModule,
    ConstructionModule,
    EventsModule,
    IntegrationsModule,
    RealtimeModule,
    SiteLogsModule,
    // CMM Domain
    CmmModule,
    // Regulations Crawler
    RegulationsModule,
    // Smart Home (v3.1)
    ScheduleModule.forRoot(),
    SmartHomeModule,
    // Insurance (Phase 2.2)
    InsuranceModule,
    // Schedules (Phase 2.3)
    SchedulesModule,
    // Waste (Phase 2.4)
    WasteModule,
    // Telegram Bot (Phase 6)
    TelegramModule,
    // Unified Partners CRM (Phase 7)
    PartnersModule,
    // Supply Chain - Procurements
    ProcurementsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
