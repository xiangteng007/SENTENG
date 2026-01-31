/**
 * Event Listeners Module
 *
 * 集中管理事件監聽器，處理跨模組的事件響應
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from './event-types';
import type {
  ProjectStatusChangedEvent,
  InvoiceOverdueEvent,
  NotificationSendEvent,
  NotificationBroadcastEvent,
} from './event-types';
import { LineNotifyService } from '../../modules/notifications/line-notify.service';

@Injectable()
export class EventListeners {
  private readonly logger = new Logger(EventListeners.name);

  constructor(private readonly lineNotifyService: LineNotifyService) {}

  /**
   * 專案狀態變更 -> 發送 LINE 通知
   */
  @OnEvent(EventNames.PROJECT_STATUS_CHANGED)
  async handleProjectStatusChanged(event: ProjectStatusChangedEvent) {
    this.logger.log(
      `Project ${event.projectId} status changed: ${event.previousStatus} -> ${event.newStatus}`
    );

    // 如果是重要狀態變更，發送通知
    const importantStatuses = ['completed', 'delayed', '已完成', '延遲'];
    if (importantStatuses.includes(event.newStatus.toLowerCase())) {
      try {
        // Enhancement: Fetch project manager's LINE ID from users table
        // Issue: SENG-TODO-001 - Implement user contact lookup service
        // For now, just log the event
        this.logger.log(
          `Would notify project manager about ${event.projectName} status: ${event.newStatus}`
        );
      } catch (error) {
        this.logger.error(`Failed to send project notification: ${error}`);
      }
    }
  }

  /**
   * 發票逾期 -> 發送提醒通知
   */
  @OnEvent(EventNames.INVOICE_OVERDUE)
  async handleInvoiceOverdue(event: InvoiceOverdueEvent) {
    this.logger.warn(`Invoice ${event.invoiceNumber} is ${event.daysOverdue} days overdue`);

    // Enhancement: Send reminder to finance team and client
    // Issue: SENG-TODO-002 - Implement overdue invoice notification workflow
    // Will use email service when available
  }

  /**
   * 通用通知發送
   */
  @OnEvent(EventNames.NOTIFICATION_SEND)
  async handleNotificationSend(event: NotificationSendEvent) {
    this.logger.log(`Sending notification to ${event.recipientId}: ${event.title}`);

    if (event.recipientType === 'line') {
      try {
        await this.lineNotifyService.sendTextMessage(
          event.recipientId,
          `${event.title}\n\n${event.message}`
        );
      } catch (error) {
        this.logger.error(`LINE notification failed: ${error}`);
      }
    }
    // Enhancement: Handle email notifications via EmailService
    // Issue: SENG-TODO-003 - Implement email notification channel
    if (event.recipientType === 'email') {
      this.logger.log(`Email notification pending: ${event.recipientId}`);
    }
  }

  /**
   * 廣播通知
   */
  @OnEvent(EventNames.NOTIFICATION_BROADCAST)
  async handleBroadcast(event: NotificationBroadcastEvent) {
    this.logger.log(`Broadcasting: ${event.title}`);

    if (event.channel === 'line' || event.channel === 'all') {
      try {
        await this.lineNotifyService.broadcast(`${event.title}\n\n${event.message}`);
      } catch (error) {
        this.logger.error(`LINE broadcast failed: ${error}`);
      }
    }
  }
}
