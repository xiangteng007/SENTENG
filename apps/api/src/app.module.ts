import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { CoreModule } from './core';
import { CustomersModule } from './modules/customers/customers.module';
// ClientsModule removed - deprecated, merged into CrmModule
import { ProjectsModule } from './modules/projects/projects.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChangeOrdersModule } from './modules/change-orders/change-orders.module';
import { CostEntriesModule } from './modules/cost-entries/cost-entries.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SupplyChainModule } from './modules/supply-chain';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ProfitAnalysisModule } from './modules/profit-analysis/profit-analysis.module';
import { StorageModule } from './modules/storage/storage.module';
// New Domain Modules
import { PlatformModule } from './modules/platform/platform.module';
import { BimModule } from './modules/bim/bim.module';
import { DroneModule } from './modules/drone/drone.module';
import { ConstructionModule } from './modules/construction/construction.module';
import { EventsModule } from './modules/events/events.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SiteLogsModule } from './modules/site-logs/site-logs.module';
// CMM Domain (Phase 2)
import { CmmModule } from './modules/cmm/cmm.module';
// Regulations Crawler
import { RegulationsModule } from './modules/regulations/regulations.module';
// Smart Home (v3.1)
import { SmartHomeModule } from './modules/smart-home/smart-home.module';
// Unified Contacts (Phase 1.2)
import { ContactsModule } from './modules/contacts/contacts.module';
// Insurance (Phase 2.2)
import { InsuranceModule } from './modules/insurance/insurance.module';
// Schedules (Phase 2.3)
import { SchedulesModule } from './modules/schedules/schedules.module';
// Waste (Phase 2.4)
import { WasteModule } from './modules/waste/waste.module';
import { ScheduleModule } from '@nestjs/schedule';
// CRM Domain (Phase 2 consolidation)
import { CrmModule } from './modules/crm/crm.module';

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
    TypeOrmModule.forRoot({
      type: 'postgres',
      // Use process.env directly to ensure env vars are read correctly
      host: (() => {
        const dbHost = process.env.DB_HOST || 'localhost';
        console.log('[TypeORM] DB_HOST:', dbHost);
        console.log('[TypeORM] All DB env vars:', {
          DB_HOST: process.env.DB_HOST,
          DB_PORT: process.env.DB_PORT,
          DB_USERNAME: process.env.DB_USERNAME,
          DB_DATABASE: process.env.DB_DATABASE,
        });
        return dbHost;
      })(),
      // Port is ignored for Unix socket connections
      port: process.env.DB_HOST?.startsWith('/cloudsql/') 
        ? undefined 
        : parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'erp',
      autoLoadEntities: true,
      synchronize: false, // Important: use migrations in production
      // Unix socket doesn't need SSL; TCP connections use SSL in production
      ssl: process.env.DB_HOST?.startsWith('/cloudsql/') 
        ? false 
        : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
      // Connection timeout settings for Cloud Run
      extra: process.env.NODE_ENV === 'production'
        ? {
            connectionTimeoutMillis: 15000,
            idleTimeoutMillis: 30000,
            max: 10,
          }
        : {},
    }),
    AuthModule,
    UsersModule,
    CustomersModule,
    ProjectsModule,
    QuotationsModule,
    ContractsModule,
    PaymentsModule,
    ChangeOrdersModule,
    CostEntriesModule,
    InvoicesModule,
    SupplyChainModule, // Phase 2: Consolidated vendors + procurements
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
    // Unified Contacts (Phase 1.2)
    ContactsModule,
    // Insurance (Phase 2.2)
    InsuranceModule,
    // Schedules (Phase 2.3)
    SchedulesModule,
    // Waste (Phase 2.4)
    WasteModule,
    // CRM Domain (Phase 2 consolidation)
    CrmModule,
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
