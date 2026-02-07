/**
 * integrations.module.ts
 *
 * 外部系統整合模組
 *
 * 子模組結構：
 * - google/: Google Workspace 整合 (OAuth, Drive, Sheets, Calendar, Contacts)
 * - taiwan/: 台灣本地整合 (政府資料, 健保, 氣象, LINE)
 * - banking/: 金融整合 (銀行 API, 會計匯出)
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

// Controllers
import { IntegrationsController } from "./integrations.controller";
import { ExportsController } from "./exports.controller";

// Google Services
import {
  GoogleOAuthService,
  GoogleSheetsService,
  GoogleDriveService,
  CalendarSyncService,
  ContactsSyncService,
} from "./google";

// Taiwan Services
import {
  TaiwanGovDataService,
  NhiApiService,
  LineApiService,
  WeatherService,
} from "./taiwan";

// Banking Services
import {
  AccountingExportService,
  BankingIntegrationService,
} from "./banking";

// Entities
import { GoogleOAuthAccount } from "./entities";
import { Event } from "../events/event.entity";
import { AuditModule } from "../platform/audit/audit.module";
// Legacy entities via central module
import { LegacyEntitiesModule } from "../legacy-entities/legacy-entities.module";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      GoogleOAuthAccount,
      Event,
    ]),
    LegacyEntitiesModule, // Provides Client, Vendor, ClientContact, VendorContact repos
    AuditModule,
  ],
  controllers: [IntegrationsController, ExportsController],
  providers: [
    // Google
    GoogleOAuthService,
    GoogleSheetsService,
    GoogleDriveService,
    CalendarSyncService,
    ContactsSyncService,
    // Taiwan
    TaiwanGovDataService,
    NhiApiService,
    LineApiService,
    WeatherService,
    // Banking
    AccountingExportService,
    BankingIntegrationService,
  ],
  exports: [
    // Google
    GoogleOAuthService,
    GoogleSheetsService,
    GoogleDriveService,
    CalendarSyncService,
    ContactsSyncService,
    // Taiwan
    TaiwanGovDataService,
    NhiApiService,
    LineApiService,
    WeatherService,
    // Banking
    AccountingExportService,
    BankingIntegrationService,
  ],
})
export class IntegrationsModule {}
