/**
 * calendar-sync.service.ts
 *
 * Google Calendar 同步服務（正式實作）
 * ERP Events → Google Calendar（單向同步）
 * 支援建立、更新同步（避免重複建立）
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { google, calendar_v3 } from "googleapis";
import { Event } from "../../events/event.entity";
import { GoogleOAuthService } from "./google-oauth.service";
import { SyncResultDto, BulkSyncResultDto } from "../dto";
import { AuditService, AuditContext } from "../../platform/audit/audit.service";

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly oauthService: GoogleOAuthService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 同步單一事件到 Google Calendar
   * 支援「更新同步」：若 googleEventId 存在則 update，否則 insert
   */
  async syncEvent(
    eventId: string,
    userId: string,
    context?: AuditContext,
  ): Promise<SyncResultDto> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: "事件不存在",
      };
    }

    // 檢查是否可同步
    if (event.syncStatus === "DISABLED") {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: "此事件已停用同步",
      };
    }

    const previousStatus = event.syncStatus;

    try {
      const account = await this.oauthService.getAccountByUserId(userId);
      if (!account) {
        return {
          success: false,
          syncedAt: new Date().toISOString(),
          error: "Google 帳號未連結",
        };
      }

      // 取得 OAuth2 Client 並建立 Calendar API
      const auth = await this.oauthService.getOAuth2Client(userId);
      const calendar = google.calendar({ version: "v3", auth });
      const calendarId = account.calendarId || "primary";

      // 建立 Google Calendar 事件資料
      const calendarEvent: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description || "",
        location: event.location || "",
        start: event.allDay
          ? { date: this.formatDate(event.startTime) }
          : {
              dateTime: event.startTime.toISOString(),
              timeZone: "Asia/Taipei",
            },
        end: event.allDay
          ? { date: this.formatDate(event.endTime || event.startTime) }
          : {
              dateTime: (event.endTime || event.startTime).toISOString(),
              timeZone: "Asia/Taipei",
            },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: event.reminderMinutes || 30 },
          ],
        },
      };

      // 加入 recurrence 規則（若有）
      if (event.recurrenceRule) {
        calendarEvent.recurrence = [`RRULE:${event.recurrenceRule}`];
      }

      let googleEventId: string;

      if (event.googleEventId) {
        // 更新現有事件
        this.logger.log(
          `Updating existing Google Calendar event: ${event.googleEventId}`,
        );
        const response = await calendar.events.update({
          calendarId,
          eventId: event.googleEventId,
          requestBody: calendarEvent,
        });
        googleEventId = response.data.id || event.googleEventId;
      } else {
        // 建立新事件
        this.logger.log(
          `Creating new Google Calendar event for: ${event.title}`,
        );
        const response = await calendar.events.insert({
          calendarId,
          requestBody: calendarEvent,
        });
        googleEventId = response.data.id || "";
      }

      // 更新 ERP 事件狀態
      event.googleEventId = googleEventId;
      event.googleCalendarId = calendarId;
      event.syncStatus = "SYNCED";
      event.lastSyncedAt = new Date();
      event.lastSyncError = "";
      await this.eventRepo.save(event);

      // Audit log
      await this.auditService.logUpdate(
        "Event",
        eventId,
        { syncStatus: previousStatus },
        { syncStatus: "SYNCED", googleEventId },
        context,
      );

      this.logger.log(
        `Event ${eventId} synced to Google Calendar: ${googleEventId}`,
      );

      return {
        success: true,
        syncedAt: new Date().toISOString(),
        googleId: googleEventId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 更新失敗狀態
      event.syncStatus = "FAILED";
      event.lastSyncError = errorMessage;
      await this.eventRepo.save(event);

      // Audit log 失敗
      await this.auditService.logUpdate(
        "Event",
        eventId,
        { syncStatus: previousStatus },
        { syncStatus: "FAILED", lastSyncError: errorMessage },
        context,
      );

      this.logger.error(
        `Calendar sync failed for event ${eventId}: ${errorMessage}`,
      );

      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }

  /**
   * 批量同步所有待同步事件
   */
  async syncBulk(
    userId: string,
    context?: AuditContext,
  ): Promise<BulkSyncResultDto> {
    const pendingEvents = await this.eventRepo.find({
      where: { syncStatus: "PENDING" },
      take: 100,
    });

    const result: BulkSyncResultDto = {
      total: pendingEvents.length,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const event of pendingEvents) {
      const syncResult = await this.syncEvent(event.id, userId, context);
      if (syncResult.success) {
        result.synced++;
      } else {
        result.failed++;
        result.errors.push({
          id: event.id,
          error: syncResult.error || "Unknown error",
        });
      }
    }

    await this.oauthService.updateLastSync(
      userId,
      result.failed > 0 ? `${result.failed} events failed to sync` : undefined,
    );

    return result;
  }

  /**
   * 重試失敗的同步
   */
  async retryFailed(
    userId: string,
    context?: AuditContext,
  ): Promise<BulkSyncResultDto> {
    const failedEvents = await this.eventRepo.find({
      where: { syncStatus: "FAILED" },
      take: 50,
    });

    const result: BulkSyncResultDto = {
      total: failedEvents.length,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const event of failedEvents) {
      const syncResult = await this.syncEvent(event.id, userId, context);
      if (syncResult.success) {
        result.synced++;
      } else {
        result.failed++;
        result.errors.push({
          id: event.id,
          error: syncResult.error || "Unknown error",
        });
      }
    }

    return result;
  }

  /**
   * 格式化日期為 YYYY-MM-DD（用於全天事件）
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
