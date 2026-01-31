/**
 * integrations.module.ts
 *
 * Google 整合模組 + 外部系統串接 (Phase 3)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { ExportsController } from './exports.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleSheetsService } from './google-sheets.service';
import { GoogleDriveService } from './google-drive.service';
import { CalendarSyncService } from './calendar-sync.service';
import { ContactsSyncService } from './contacts-sync.service';
// Phase 3: External Integrations
import { TaiwanGovDataService } from './taiwan-gov-data.service';
import { AccountingExportService } from './accounting-export.service';
import { BankingIntegrationService } from './banking-integration.service';
import { GoogleOAuthAccount, ClientContact, VendorContact } from './entities';
import { Event } from '../events/event.entity';
import { Client } from '../crm/clients/client.entity';
import { Vendor } from '../supply-chain/vendors/vendor.entity';
import { AuditModule } from '../platform/audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      GoogleOAuthAccount,
      ClientContact,
      VendorContact,
      Event,
      Client,
      Vendor,
    ]),
    AuditModule,
  ],
  controllers: [IntegrationsController, ExportsController],
  providers: [
    GoogleOAuthService,
    GoogleSheetsService,
    GoogleDriveService,
    CalendarSyncService,
    ContactsSyncService,
    // Phase 3
    TaiwanGovDataService,
    AccountingExportService,
    BankingIntegrationService,
  ],
  exports: [
    GoogleOAuthService,
    GoogleSheetsService,
    GoogleDriveService,
    CalendarSyncService,
    ContactsSyncService,
    // Phase 3
    TaiwanGovDataService,
    AccountingExportService,
    BankingIntegrationService,
  ],
})
export class IntegrationsModule {}
