/**
 * google-integration.dto.ts
 *
 * Google 整合相關 DTOs
 */

import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * Google 整合狀態回應
 */
export class GoogleIntegrationStatusDto {
  connected: boolean;
  googleAccountEmail: string | null;
  calendarId: string | null;
  contactsLabel: string | null;
  autoSyncEvents: boolean;
  autoSyncContacts: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
}

/**
 * OAuth 連結回應
 */
export class GoogleConnectResponseDto {
  authUrl: string;
}

/**
 * OAuth Callback 請求
 */
export class GoogleCallbackDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}

/**
 * 整合設定請求
 */
export class GoogleConfigureDto {
  @IsOptional()
  @IsString()
  calendarId?: string;

  @IsOptional()
  @IsString()
  contactsLabel?: string;

  @IsOptional()
  @IsBoolean()
  autoSyncEvents?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSyncContacts?: boolean;
}

/**
 * 同步結果
 */
export class SyncResultDto {
  success: boolean;
  syncedAt: string;
  googleId?: string;
  error?: string;
}

/**
 * 批量同步結果
 */
export class BulkSyncResultDto {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
