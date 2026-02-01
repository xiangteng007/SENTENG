import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * LINE Messaging API 服務
 *
 * 提供客戶通知、簽核提醒等推播功能
 *
 * API 文件: https://developers.line.biz/en/docs/messaging-api/
 *
 * 支援功能：
 * - 推播訊息 (Push Message)
 * - 回覆訊息 (Reply Message)
 * - 多格式訊息 (Text, Flex, Template)
 * - 通知群組
 */

export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  notifyToken?: string;
}

export interface LineMessage {
  type: "text" | "flex" | "template";
  text?: string;
  altText?: string;
  contents?: Record<string, unknown>;
  template?: Record<string, unknown>;
}

export interface LinePushResult {
  success: boolean;
  sentMessages: number;
  errorMessage?: string;
}

export interface LineNotifyResult {
  success: boolean;
  status: number;
  message: string;
}

@Injectable()
export class LineApiService {
  private readonly logger = new Logger(LineApiService.name);
  private readonly config: LineConfig;
  private readonly messagingApiHost = "https://api.line.me/v2/bot";
  private readonly notifyApiHost = "https://notify-api.line.me/api/notify";

  constructor(private readonly configService: ConfigService) {
    this.config = {
      channelAccessToken:
        this.configService.get<string>("LINE_CHANNEL_ACCESS_TOKEN") || "",
      channelSecret:
        this.configService.get<string>("LINE_CHANNEL_SECRET") || "",
      notifyToken: this.configService.get<string>("LINE_NOTIFY_TOKEN"),
    };
  }

  /**
   * 檢查 Messaging API 是否已設定
   */
  isMessagingConfigured(): boolean {
    return !!this.config.channelAccessToken;
  }

  /**
   * 檢查 LINE Notify 是否已設定
   */
  isNotifyConfigured(): boolean {
    return !!this.config.notifyToken;
  }

  /**
   * 推播訊息給單一用戶
   */
  async pushMessage(
    userId: string,
    messages: LineMessage[],
  ): Promise<LinePushResult> {
    if (!this.isMessagingConfigured()) {
      return {
        success: false,
        sentMessages: 0,
        errorMessage: "LINE Messaging API not configured",
      };
    }

    try {
      const response = await fetch(`${this.messagingApiHost}/message/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: messages.map((msg) => this.formatMessage(msg)),
        }),
      });

      if (response.ok) {
        this.logger.log(`Push message sent to ${userId}`);
        return { success: true, sentMessages: messages.length };
      }

      const error = await response.json();
      this.logger.error(`Push failed: ${JSON.stringify(error)}`);
      return {
        success: false,
        sentMessages: 0,
        errorMessage: error.message || "Push failed",
      };
    } catch (error) {
      return {
        success: false,
        sentMessages: 0,
        errorMessage: String(error),
      };
    }
  }

  /**
   * 群發訊息
   */
  async multicast(
    userIds: string[],
    messages: LineMessage[],
  ): Promise<LinePushResult> {
    if (!this.isMessagingConfigured()) {
      return {
        success: false,
        sentMessages: 0,
        errorMessage: "LINE Messaging API not configured",
      };
    }

    try {
      const response = await fetch(
        `${this.messagingApiHost}/message/multicast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.channelAccessToken}`,
          },
          body: JSON.stringify({
            to: userIds,
            messages: messages.map((msg) => this.formatMessage(msg)),
          }),
        },
      );

      if (response.ok) {
        this.logger.log(`Multicast sent to ${userIds.length} users`);
        return {
          success: true,
          sentMessages: messages.length * userIds.length,
        };
      }

      const error = await response.json();
      return {
        success: false,
        sentMessages: 0,
        errorMessage: error.message || "Multicast failed",
      };
    } catch (error) {
      return {
        success: false,
        sentMessages: 0,
        errorMessage: String(error),
      };
    }
  }

  /**
   * LINE Notify 推播 (簡易通知)
   */
  async notify(message: string): Promise<LineNotifyResult> {
    if (!this.isNotifyConfigured()) {
      return {
        success: false,
        status: 0,
        message: "LINE Notify not configured",
      };
    }

    try {
      const response = await fetch(this.notifyApiHost, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.config.notifyToken}`,
        },
        body: `message=${encodeURIComponent(message)}`,
      });

      const data = (await response.json()) as {
        status: number;
        message: string;
      };
      this.logger.debug(`LINE Notify: ${data.status}`);

      return {
        success: data.status === 200,
        status: data.status,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        message: String(error),
      };
    }
  }

  /**
   * 發送報價通知
   */
  async sendQuotationNotification(
    userId: string,
    quotationNumber: string,
    clientName: string,
    amount: number,
  ): Promise<LinePushResult> {
    const messages: LineMessage[] = [
      {
        type: "flex",
        altText: `報價單 ${quotationNumber} 已建立`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📋 新報價單通知",
                weight: "bold",
                size: "lg",
                color: "#1DB446",
              },
            ],
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `報價單號：${quotationNumber}`,
                size: "md",
              },
              {
                type: "text",
                text: `客戶：${clientName}`,
                size: "sm",
                color: "#666666",
              },
              {
                type: "text",
                text: `金額：NT$ ${amount.toLocaleString()}`,
                size: "lg",
                weight: "bold",
                margin: "md",
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "請登入系統查看詳情",
                size: "xs",
                color: "#AAAAAA",
                align: "center",
              },
            ],
          },
        },
      },
    ];

    return this.pushMessage(userId, messages);
  }

  /**
   * 發送簽核提醒
   */
  async sendApprovalReminder(
    userId: string,
    documentType: string,
    documentNumber: string,
    requester: string,
  ): Promise<LinePushResult> {
    const messages: LineMessage[] = [
      {
        type: "text",
        text: `⚠️ 簽核待辦提醒\n\n文件類型：${documentType}\n編號：${documentNumber}\n申請人：${requester}\n\n請儘速登入系統處理。`,
      },
    ];

    return this.pushMessage(userId, messages);
  }

  /**
   * 發送工期預警
   */
  async sendScheduleAlert(
    userId: string,
    projectName: string,
    milestone: string,
    daysRemaining: number,
  ): Promise<LinePushResult> {
    const emoji = daysRemaining <= 3 ? "🔴" : daysRemaining <= 7 ? "🟡" : "🟢";
    const messages: LineMessage[] = [
      {
        type: "text",
        text: `${emoji} 工期提醒\n\n專案：${projectName}\n里程碑：${milestone}\n剩餘天數：${daysRemaining} 天`,
      },
    ];

    return this.pushMessage(userId, messages);
  }

  /**
   * 格式化訊息
   */
  private formatMessage(msg: LineMessage): Record<string, unknown> {
    switch (msg.type) {
      case "text":
        return { type: "text", text: msg.text };
      case "flex":
        return { type: "flex", altText: msg.altText, contents: msg.contents };
      case "template":
        return {
          type: "template",
          altText: msg.altText,
          template: msg.template,
        };
      default:
        return { type: "text", text: msg.text || "" };
    }
  }
}
