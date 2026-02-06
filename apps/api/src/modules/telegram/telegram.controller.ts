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
   */
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: TelegramUpdate,
  ): Promise<{ ok: boolean }> {
    this.logger.log(`Received Telegram update: ${update.update_id}`);

    try {
      await this.telegramService.handleUpdate(update);
      return { ok: true };
    } catch (error) {
      this.logger.error("Error handling Telegram update:", error);
      // Always return OK to Telegram to prevent retry spam
      return { ok: true };
    }
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
