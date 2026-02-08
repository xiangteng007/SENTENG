/**
 * integrations.controller.ts
 *
 * Google 整合 API 端點
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Public } from "../../common/decorators/public.decorator";
import type { AuthenticatedRequest } from "../../common/types";
import {
  GoogleOAuthService,
  CalendarSyncService,
  ContactsSyncService,
} from "./google";
import {
  GoogleIntegrationStatusDto,
  GoogleConnectResponseDto,
  GoogleCallbackDto,
  GoogleConfigureDto,
  SyncResultDto,
  BulkSyncResultDto,
} from "./dto";

/** Audit context for tracking user actions */
interface AuditContext {
  userId: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
}

@ApiTags("Integrations - Google")
@ApiBearerAuth()
@Controller("integrations/google")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class IntegrationsController {
  constructor(
    private readonly oauthService: GoogleOAuthService,
    private readonly calendarSyncService: CalendarSyncService,
    private readonly contactsSyncService: ContactsSyncService,
    private readonly configService: ConfigService,
  ) {}

  // ========================================
  // Google OAuth 管理
  // ========================================

  @Get("status")
  async getStatus(
    @Req() request: AuthenticatedRequest,
  ): Promise<GoogleIntegrationStatusDto> {
    const userId = this.getUserId(request);
    const account = await this.oauthService.getAccountByUserId(userId);

    if (!account) {
      return {
        connected: false,
        googleAccountEmail: null,
        calendarId: null,
        contactsLabel: null,
        autoSyncEvents: false,
        autoSyncContacts: false,
        lastSyncedAt: null,
        lastSyncError: null,
      };
    }

    return {
      connected: account.isActive,
      googleAccountEmail: account.googleAccountEmail,
      calendarId: account.calendarId,
      contactsLabel: account.contactsLabel,
      autoSyncEvents: account.autoSyncEvents,
      autoSyncContacts: account.autoSyncContacts,
      lastSyncedAt: account.lastSyncedAt?.toISOString() || null,
      lastSyncError: account.lastSyncError || null,
    };
  }

  @Post("connect")
  @RequirePermissions("integrations:manage")
  async connect(
    @Req() request: AuthenticatedRequest,
  ): Promise<GoogleConnectResponseDto> {
    const userId = this.getUserId(request);
    const authUrl = this.oauthService.getAuthUrl(userId);
    return { authUrl };
  }

  @Public()
  @Get("callback")
  async callbackGet(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const code = request.query.code as string | undefined;
    const state = request.query.state as string | undefined;
    const error = request.query.error as string | undefined;

    const frontendUrl = this.configService.get(
      "FRONTEND_URL",
      "https://senteng.co",
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/integrations?error=missing_params`);
    }

    try {
      await this.oauthService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations?google_connected=true`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return res.redirect(
        `${frontendUrl}/integrations?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post("callback")
  @RequirePermissions("integrations:manage")
  @HttpCode(HttpStatus.OK)
  async callback(
    @Body() dto: GoogleCallbackDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const userId = dto.state || this.getUserId(request);
    await this.oauthService.handleCallback(dto.code, userId);
    return { success: true };
  }

  @Post("disconnect")
  @RequirePermissions("integrations:admin")
  @HttpCode(HttpStatus.OK)
  async disconnect(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const userId = this.getUserId(request);
    await this.oauthService.disconnect(userId);
    return { success: true };
  }

  @Post("configure")
  @RequirePermissions("integrations:manage")
  @HttpCode(HttpStatus.OK)
  async configure(
    @Body() dto: GoogleConfigureDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const userId = this.getUserId(request);
    await this.oauthService.updateConfig(userId, {
      calendarId: dto.calendarId,
      contactsLabel: dto.contactsLabel,
      autoSyncEvents: dto.autoSyncEvents,
      autoSyncContacts: dto.autoSyncContacts,
    });
    return { success: true };
  }

  // ========================================
  // Calendar Sync
  // ========================================

  @Post("calendar/sync/events/:eventId")
  @RequirePermissions("integrations:sync")
  async syncEvent(
    @Param("eventId") eventId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<SyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);
    return this.calendarSyncService.syncEvent(eventId, userId, context);
  }

  @Post("calendar/sync/bulk")
  @RequirePermissions("integrations:admin")
  async syncCalendarBulk(
    @Req() request: AuthenticatedRequest,
  ): Promise<BulkSyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);
    return this.calendarSyncService.syncBulk(userId, context);
  }

  @Post("calendar/retry")
  @RequirePermissions("integrations:sync")
  async retryCalendarSync(
    @Req() request: AuthenticatedRequest,
  ): Promise<BulkSyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);
    return this.calendarSyncService.retryFailed(userId, context);
  }

  // ========================================
  // Contacts Sync
  // ========================================

  @Post("contacts/sync/contact/:contactId")
  @RequirePermissions("integrations:sync")
  async syncContact(
    @Param("contactId") contactId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<SyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);

    const clientResult = await this.contactsSyncService.syncClientContact(
      contactId,
      userId,
      context,
    );
    if (clientResult.success || clientResult.error !== "聯絡人不存在") {
      return clientResult;
    }

    return this.contactsSyncService.syncVendorContact(
      contactId,
      userId,
      context,
    );
  }

  @Post("contacts/sync/client/:clientId")
  @RequirePermissions("integrations:sync")
  async syncClientContacts(
    @Param("clientId") clientId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<BulkSyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);
    return this.contactsSyncService.syncAllClientContacts(
      clientId,
      userId,
      context,
    );
  }

  @Post("contacts/sync/vendor/:vendorId")
  @RequirePermissions("integrations:sync")
  async syncVendorContacts(
    @Param("vendorId") vendorId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<BulkSyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);
    return this.contactsSyncService.syncAllVendorContacts(
      vendorId,
      userId,
      context,
    );
  }

  @Post("contacts/delete/client/:clientId")
  @RequirePermissions("integrations:sync")
  async deleteClientContacts(
    @Param("clientId") clientId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<BulkSyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);
    return this.contactsSyncService.deleteAllClientContactsFromGoogle(
      clientId,
      userId,
      context,
    );
  }

  @Post("contacts/delete/vendor/:vendorId")
  @RequirePermissions("integrations:sync")
  async deleteVendorContacts(
    @Param("vendorId") vendorId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<BulkSyncResultDto> {
    const userId = this.getUserId(request);
    const context = this.getAuditContext(request);
    return this.contactsSyncService.deleteAllVendorContactsFromGoogle(
      vendorId,
      userId,
      context,
    );
  }

  // ========================================
  // Helpers
  // ========================================

  private getUserId(request: AuthenticatedRequest): string {
    const user = request.user;
    return user?.sub || user?.userId || "";
  }

  private getAuditContext(request: AuthenticatedRequest): AuditContext {
    const user = request.user;
    return {
      userId: user?.sub || user?.userId,
      ipAddress: request.ip,
      userAgent: request.get?.("user-agent"),
    };
  }
}
