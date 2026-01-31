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
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChangeOrdersModule } from './modules/change-orders/change-orders.module';
import { CostEntriesModule } from './modules/cost-entries/cost-entries.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { VendorsModule } from './modules/vendors/vendors.module';
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
import { ProcurementsModule } from './modules/procurements/procurements.module';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false, // Important: use migrations in production
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CustomersModule,
    ClientsModule,
    ProjectsModule,
    QuotationsModule,
    ContractsModule,
    PaymentsModule,
    ChangeOrdersModule,
    CostEntriesModule,
    InvoicesModule,
    VendorsModule,
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
    ProcurementsModule,
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
