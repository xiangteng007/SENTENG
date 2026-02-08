import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  TelegramSendMessageParams,
  TelegramInlineKeyboardMarkup,
} from "./dto";

/**
 * Shared session interface used across all handlers
 */
export interface UserSession {
  userId: number;
  chatId: number;
  linkedEmail?: string;
  currentProjectId?: string;
  currentProjectName?: string;
  awaitingInput?: "project_selection" | "log_content" | "photo_upload";
}

/**
 * Lightweight Telegram API client — handles HTTP calls to Bot API.
 * Injected into TelegramService + all command handlers to avoid circular DI.
 */
@Injectable()
export class TelegramApiClient {
  private readonly logger = new Logger(TelegramApiClient.name);
  private readonly botToken: string;
  private readonly apiUrl = "https://api.telegram.org";

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN") || "";
    if (!this.botToken) {
      this.logger.warn("TELEGRAM_BOT_TOKEN not configured");
    }
  }

  get isBotConfigured(): boolean {
    return !!this.botToken;
  }

  async sendMessage(
    chatId: number | string,
    text: string,
    parseMode?: "HTML" | "Markdown" | "MarkdownV2",
    replyMarkup?: TelegramInlineKeyboardMarkup,
  ): Promise<void> {
    if (!this.botToken) {
      this.logger.warn("Cannot send message: Bot token not configured");
      return;
    }

    const url = `${this.apiUrl}/bot${this.botToken}/sendMessage`;
    const body: TelegramSendMessageParams = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      reply_markup: replyMarkup,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Telegram API error: ${error}`);
      }
    } catch (error) {
      this.logger.error("Failed to send Telegram message:", error);
    }
  }

  async answerCallbackQuery(queryId: string): Promise<void> {
    if (!this.botToken) return;

    const url = `${this.apiUrl}/bot${this.botToken}/answerCallbackQuery`;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: queryId }),
      });
    } catch (error) {
      this.logger.error("Failed to answer callback query:", error);
    }
  }

  async getFileUrl(fileId: string): Promise<string | null> {
    if (!this.botToken) return null;

    const url = `${this.apiUrl}/bot${this.botToken}/getFile`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          result?: { file_path?: string };
        };
        if (data.result?.file_path) {
          return `${this.apiUrl}/file/bot${this.botToken}/${data.result.file_path}`;
        }
      }
    } catch (error) {
      this.logger.error("Failed to get file URL:", error);
    }
    return null;
  }
}
