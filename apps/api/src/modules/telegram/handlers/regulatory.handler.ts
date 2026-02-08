import { Injectable, Logger } from "@nestjs/common";
import { TelegramApiClient, UserSession } from "../telegram-api.client";
import { InsuranceService } from "../../insurance/insurance.service";
import { EInvoiceService } from "../../invoices/e-invoice.service";
import { BuildingCodeService } from "../../regulations/building-code.service";
import { FireSafetyService } from "../../regulations/fire-safety.service";
import { CnsStandardsService } from "../../regulations/cns-standards.service";

@Injectable()
export class RegulatoryCommandHandler {
  private readonly logger = new Logger(RegulatoryCommandHandler.name);

  constructor(
    private readonly api: TelegramApiClient,
    private readonly insuranceService: InsuranceService,
    private readonly eInvoiceService: EInvoiceService,
    private readonly buildingCodeService: BuildingCodeService,
    private readonly fireSafetyService: FireSafetyService,
    private readonly cnsStandardsService: CnsStandardsService,
  ) {}
  async handleInsuranceCommand(session: UserSession): Promise<void> {
    try {
      const expiring = await this.insuranceService.getExpiringInsurance(30);
      if (expiring.length === 0) {
        await this.api.sendMessage(session.chatId, `🛡️ *保險提醒*\\n\\n✅ 30 天內無到期保單`, "Markdown");
        return;
      }
      let message = `🛡️ *保險提醒* (${expiring.length} 張即將到期)\\n\\n`;
      expiring.slice(0, 5).forEach((ins) => {
        const days = Math.ceil((new Date(ins.expiryDate).getTime() - Date.now()) / 86400000);
        message += `⚠️ ${ins.type}: ${days} 天後到期\\n`;
      });
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch insurance:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入保險資訊。");
    }
  }

  async handleEInvoiceCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `🧾 *電子發票服務*\n\n` +
        `📋 支援功能：\n` +
        `• ECPay (綠界) 電子發票\n` +
        `• ezPay (藍新) 電子發票\n` +
        `• 開立/作廢發票\n\n` +
        `ℹ️ 請透過網頁版管理電子發票`,
      "Markdown",
    );
  }

  async handleBuildingCodeCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `🏛️ *建築技術規則檢核*\n\n` +
        `📋 可檢核項目：\n` +
        `• 建蔽率 (BCR)\n` +
        `• 容積率 (FAR)\n` +
        `• 建築高度限制\n` +
        `• 退縮距離\n` +
        `• 停車位需求\n` +
        `• 無障礙設施\n\n` +
        `ℹ️ 使用網頁版進行完整檢核`,
      "Markdown",
    );
  }

  async handleFireSafetyCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `🔥 *消防法規檢核*\n\n` +
        `📋 可計算項目：\n` +
        `• 滅火器數量/配置\n` +
        `• 逃生距離\n` +
        `• 出口寬度\n` +
        `• 煙霧偵測器\n` +
        `• 緊急照明\n\n` +
        `ℹ️ 使用網頁版進行完整消防法規檢核`,
      "Markdown",
    );
  }

  async handleCnsCommand(session: UserSession): Promise<void> {
    try {
      const categories = this.cnsStandardsService.getCategories();
      let message = `📐 *CNS 國家標準*\n\n📋 可查詢類別：\n`;
      categories.slice(0, 6).forEach((cat) => {
        message += `• ${cat.label} (${cat.count} 項)\n`;
      });
      message += `\nℹ️ 使用網頁版查詢完整標準資料`;
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch CNS standards:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入國家標準。");
    }
  }

}
