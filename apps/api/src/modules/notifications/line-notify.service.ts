/**
 * LINE Notify Service (LINE 通知服務)
 *
 * 使用 LINE Messaging API 發送工程進度通知
 * 支援文字訊息、Flex Message、圖片等多種格式
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

/** LINE Messaging API types */
interface LineFlexContent {
  type: string;
  [key: string]: unknown;
}

interface LineMessageObject {
  type: string;
  text?: string;
  altText?: string;
  contents?: LineFlexContent;
  originalContentUrl?: string;
  previewImageUrl?: string;
}

interface LineFlexBubble extends LineFlexContent {
  type: "bubble";
  hero: Record<string, unknown>;
  body: Record<string, unknown>;
  footer: Record<string, unknown>;
}

export interface LineMessageDto {
  /** 接收者 LINE User ID 或 Group ID */
  to: string;
  /** 訊息類型 */
  type: "text" | "flex" | "image";
  /** 文字內容 (type=text 時使用) */
  text?: string;
  /** Flex Message 內容 (type=flex 時使用) */
  flexContent?: LineFlexContent;
  /** 圖片網址 (type=image 時使用) */
  imageUrl?: string;
  /** 預覽圖網址 */
  previewImageUrl?: string;
}

export interface ProjectNotificationDto {
  /** 專案名稱 */
  projectName: string;
  /** 專案編號 */
  projectNumber: string;
  /** 通知類型 */
  notificationType:
    | "progress_update"
    | "milestone"
    | "delay_alert"
    | "completed";
  /** 進度百分比 */
  progressPercent?: number;
  /** 訊息內容 */
  message: string;
  /** 附加資訊 */
  details?: string;
  /** 接收者 LINE ID 列表 */
  recipients: string[];
}

export interface LineNotificationResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors?: string[];
}

@Injectable()
export class LineNotifyService {
  private readonly logger = new Logger(LineNotifyService.name);
  private readonly apiClient: AxiosInstance;
  private readonly channelAccessToken: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.channelAccessToken = this.configService.get(
      "LINE_CHANNEL_ACCESS_TOKEN",
      "",
    );
    this.enabled = !!this.channelAccessToken;

    this.apiClient = axios.create({
      baseURL: "https://api.line.me/v2/bot",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
    });

    if (this.enabled) {
      this.logger.log("LINE Notify service initialized");
    } else {
      this.logger.warn(
        "LINE Notify service disabled - missing channel access token",
      );
    }
  }

  /**
   * 發送專案進度通知
   */
  async sendProjectNotification(
    dto: ProjectNotificationDto,
  ): Promise<LineNotificationResult> {
    if (!this.enabled) {
      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        errors: ["LINE service not configured"],
      };
    }

    const flexMessage = this.buildProjectFlexMessage(dto);
    const results = await Promise.allSettled(
      dto.recipients.map((recipient) =>
        this.sendMessage({
          to: recipient,
          type: "flex",
          flexContent: flexMessage,
        }),
      ),
    );

    const sentCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.filter((r) => r.status === "rejected").length;
    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r: PromiseRejectedResult) => r.reason?.message || "Unknown error");

    return {
      success: failedCount === 0,
      sentCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 發送文字訊息
   */
  async sendTextMessage(to: string, text: string): Promise<boolean> {
    return this.sendMessage({ to, type: "text", text });
  }

  /**
   * 發送訊息
   */
  async sendMessage(dto: LineMessageDto): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn("LINE service not configured, skipping message");
      return false;
    }

    try {
      const messages = this.buildMessages(dto);

      await this.apiClient.post("/message/push", {
        to: dto.to,
        messages,
      });

      this.logger.log(`Message sent to ${dto.to}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send LINE message: ${message}`, stack);
      throw error;
    }
  }

  /**
   * 發送廣播訊息 (給所有好友)
   */
  async broadcast(text: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      await this.apiClient.post("/message/broadcast", {
        messages: [{ type: "text", text }],
      });
      this.logger.log("Broadcast message sent");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Broadcast failed: ${message}`);
      return false;
    }
  }

  /**
   * 取得用戶資料
   */
  async getUserProfile(userId: string): Promise<any> {
    if (!this.enabled) return null;

    try {
      const response = await this.apiClient.get(`/profile/${userId}`);
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get user profile: ${message}`);
      return null;
    }
  }

  private buildMessages(dto: LineMessageDto): LineMessageObject[] {
    switch (dto.type) {
      case "text":
        return [{ type: "text", text: dto.text }];

      case "flex":
        return [
          {
            type: "flex",
            altText: "專案通知",
            contents: dto.flexContent,
          },
        ];

      case "image":
        return [
          {
            type: "image",
            originalContentUrl: dto.imageUrl,
            previewImageUrl: dto.previewImageUrl || dto.imageUrl,
          },
        ];

      default:
        return [{ type: "text", text: dto.text || "" }];
    }
  }

  private buildProjectFlexMessage(dto: ProjectNotificationDto): LineFlexBubble {
    const statusColors: Record<string, string> = {
      progress_update: "#17C950",
      milestone: "#1DB446",
      delay_alert: "#DD4444",
      completed: "#0066FF",
    };

    const statusLabels: Record<string, string> = {
      progress_update: "進度更新",
      milestone: "里程碑達成",
      delay_alert: "⚠️ 延遲警告",
      completed: "🎉 專案完工",
    };

    return {
      type: "bubble",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: statusLabels[dto.notificationType] || "專案通知",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
          },
        ],
        backgroundColor: statusColors[dto.notificationType] || "#17C950",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: dto.projectName,
            weight: "bold",
            size: "lg",
            wrap: true,
          },
          {
            type: "text",
            text: `專案編號: ${dto.projectNumber}`,
            size: "sm",
            color: "#aaaaaa",
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: dto.message,
            wrap: true,
            margin: "lg",
          },
          ...(dto.progressPercent !== undefined
            ? [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "filler",
                        },
                      ],
                      width: `${dto.progressPercent}%`,
                      backgroundColor:
                        statusColors[dto.notificationType] || "#17C950",
                      height: "8px",
                    },
                  ],
                  backgroundColor: "#E0E0E0",
                  height: "8px",
                  margin: "lg",
                  cornerRadius: "4px",
                },
                {
                  type: "text",
                  text: `完成度: ${dto.progressPercent}%`,
                  size: "sm",
                  color: "#888888",
                  align: "end",
                  margin: "sm",
                },
              ]
            : []),
          ...(dto.details
            ? [
                {
                  type: "text",
                  text: dto.details,
                  size: "sm",
                  color: "#666666",
                  wrap: true,
                  margin: "lg",
                },
              ]
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `森騰科技 ERP`,
            size: "xs",
            color: "#aaaaaa",
            align: "center",
          },
        ],
      },
    };
  }
}
