import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { TelegramService } from "./telegram.service";
import type { TelegramUpdate } from "./dto/telegram-update.dto";

@Controller("telegram")
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Telegram Webhook Endpoint
   * Receives updates from Telegram Bot API
   * Uses async processing for faster response times
   */
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() update: TelegramUpdate): { ok: boolean } {
    this.logger.log(`Received Telegram update: ${update.update_id}`);

    // Process update asynchronously - respond to Telegram immediately
    setImmediate(async () => {
      try {
        await this.telegramService.handleUpdate(update);
      } catch (error) {
        this.logger.error("Error handling Telegram update:", error);
      }
    });

    // Return immediately to Telegram (< 100ms)
    return { ok: true };
  }

  /**
   * Health check for Telegram integration
   */
  @Post("health")
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ status: string; botConfigured: boolean }> {
    const botConfigured = await this.telegramService.isBotConfigured();
    return {
      status: "ok",
      botConfigured,
    };
  }
}
