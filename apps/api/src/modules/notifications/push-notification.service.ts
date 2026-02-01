/**
 * push-notification.service.ts
 *
 * Web Push notification service - Mock mode when web-push is not installed
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationLog, NotificationStatus } from "./notification-log.entity";
import {
  NotificationTemplate,
  NotificationChannel,
} from "./notification-template.entity";

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface PushOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

interface SendPushResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  private webpush: any = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {
    this.initWebPush();
  }

  private initWebPush(): void {
    try {
      const webpush = require("web-push");
      const vapidPublicKey = this.configService.get("VAPID_PUBLIC_KEY");
      const vapidPrivateKey = this.configService.get("VAPID_PRIVATE_KEY");
      const vapidEmail = this.configService.get(
        "VAPID_EMAIL",
        "mailto:admin@senteng.com.tw",
      );

      if (!vapidPublicKey || !vapidPrivateKey) {
        this.logger.warn(
          "VAPID keys not configured. Push service will operate in mock mode.",
        );
        return;
      }

      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
      this.webpush = webpush;
      this.logger.log("Push notification service initialized");
    } catch {
      this.logger.warn(
        "web-push not installed. Push service will operate in mock mode.",
      );
    }
  }

  async send(
    subscription: PushSubscription,
    options: PushOptions,
    userId?: string,
  ): Promise<SendPushResult> {
    const log = this.logRepository.create({
      channel: NotificationChannel.PUSH,
      subject: options.title,
      message: options.body,
      userId,
      status: NotificationStatus.PENDING,
      metadata: { subscription: { endpoint: subscription.endpoint } },
    });

    try {
      if (!this.webpush) {
        this.logger.warn(`[MOCK] Would send push: ${options.title}`);
        log.status = NotificationStatus.SENT;
        log.sentAt = new Date();
        await this.logRepository.save(log);
        return { success: true };
      }

      const payload = JSON.stringify({
        notification: {
          title: options.title,
          body: options.body,
          icon: options.icon || "/assets/icons/icon-192x192.png",
          badge: options.badge || "/assets/icons/badge-72x72.png",
          data: options.data,
          actions: options.actions,
        },
      });

      await this.webpush.sendNotification(subscription, payload);
      log.status = NotificationStatus.SENT;
      log.sentAt = new Date();
      await this.logRepository.save(log);
      this.logger.log(`Push sent: ${options.title}`);
      return { success: true };
    } catch (error) {
      log.status = NotificationStatus.FAILED;
      log.errorMessage = error instanceof Error ? error.message : String(error);
      await this.logRepository.save(log);
      this.logger.error("Failed to send push notification", error);
      return { success: false, error: log.errorMessage };
    }
  }

  async sendFromTemplate(
    templateCode: string,
    subscription: PushSubscription,
    variables: Record<string, string>,
    userId?: string,
  ): Promise<SendPushResult> {
    const template = await this.templateRepository.findOne({
      where: {
        code: templateCode,
        channel: NotificationChannel.PUSH,
        isActive: true,
      },
    });

    if (!template) {
      return { success: false, error: `Template ${templateCode} not found` };
    }

    let body = template.messageBody || "";
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      body = body.replace(regex, value);
    }

    return this.send(subscription, { title: template.name, body }, userId);
  }

  async broadcast(
    subscriptions: PushSubscription[],
    options: PushOptions,
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.all(
      subscriptions.map((sub) => this.send(sub, options)),
    );
    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  async sendWeatherAlert(
    subscription: PushSubscription,
    alertType: string,
    location: string,
    description: string,
    userId?: string,
  ): Promise<SendPushResult> {
    return this.send(
      subscription,
      {
        title: `⚠️ ${alertType}`,
        body: `${location}: ${description}`,
        data: { type: "weather_alert", alertType, location },
        actions: [
          { action: "view", title: "查看詳情" },
          { action: "dismiss", title: "忽略" },
        ],
      },
      userId,
    );
  }
}
