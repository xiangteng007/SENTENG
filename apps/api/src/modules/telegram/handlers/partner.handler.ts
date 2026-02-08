import { Injectable, Logger } from "@nestjs/common";
import { TelegramApiClient, UserSession } from "../telegram-api.client";
import { PartnersService } from "../../partners/partners.service";
import { SitesService } from "../../platform/sites/sites.service";
import { AgingAnalysisService } from "../../finance/aging-analysis.service";

@Injectable()
export class PartnerCommandHandler {
  private readonly logger = new Logger(PartnerCommandHandler.name);

  constructor(
    private readonly api: TelegramApiClient,
    private readonly partnersService: PartnersService,
    private readonly sitesService: SitesService,
    private readonly agingAnalysisService: AgingAnalysisService,
  ) {}
  async handleCustomerCommand(session: UserSession): Promise<void> {
    try {
      const result = await this.partnersService.getClients();

      if (!result || result.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `👥 *客戶清單*\\n\\n✅ 目前無客戶資料`,
          "Markdown",
        );
        return;
      }

      let message = `👥 *客戶清單* (${result.length} 筆)\\n\\n`;
      result.slice(0, 5).forEach((c) => {
        message += `• ${c.name}${c.phone ? ` 📞 ${c.phone}` : ""}\\n`;
      });

      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch customers:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入客戶資訊。");
    }
  }

  async handleContactCommand(session: UserSession): Promise<void> {
    try {
      const { items, total } = await this.partnersService.findAll({});
      if (!items || total === 0) {
        await this.api.sendMessage(session.chatId, `📇 *聯絡人*\n\n✅ 無聯絡人資料`, "Markdown");
        return;
      }
      let message = `📇 *聯絡人* (${total} 筆)\n\n`;
      items.slice(0, 5).forEach((c) => {
        message += `• ${c.name}${c.phone ? ` 📞 ${c.phone}` : ""}\n`;
      });
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch contacts:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入聯絡人。");
    }
  }

  async handleSiteCommand(session: UserSession): Promise<void> {
    try {
      const sites = await this.sitesService.findAll();
      if (!sites || sites.length === 0) {
        await this.api.sendMessage(session.chatId, `🏗️ *工地清單*\n\n✅ 無工地資料`, "Markdown");
        return;
      }
      let message = `🏗️ *工地清單* (${sites.length} 座)\n\n`;
      sites.slice(0, 5).forEach((s) => {
        const statusIcon = s.isActive ? "🟢" : "🔴";
        message += `${statusIcon} ${s.name} (${s.address || "無地址"})\n`;
      });
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch sites:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入工地清單。");
    }
  }

  async handleAgingCommand(session: UserSession): Promise<void> {
    try {
      const summary = await this.agingAnalysisService.getOverdueSummary();
      await this.api.sendMessage(
        session.chatId,
        `📊 *帳齡分析*\n\n` +
          `💰 逾期總額：$${Number(summary.totalOverdue || 0).toLocaleString()}\n` +
          `📝 逾期筆數：${summary.overdueCount}\n` +
          `⏱️ 平均逾期：${summary.averageOverdueDays} 天\n` +
          `⚠️ 最長逾期：${summary.oldestOverdueDays} 天`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch aging analysis:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入帳齡分析。");
    }
  }

  async handleClientCommand(session: UserSession): Promise<void> {
    try {
      const result = await this.partnersService.getClients();
      if (!result || result.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `🏢 *委託客戶*\n\n✅ 無客戶資料`,
          "Markdown",
        );
        return;
      }
      let message = `🏢 *委託客戶* (${result.length} 筆)\n\n`;
      result.slice(0, 5).forEach((c) => {
        const statusIcon = c.syncStatus === "SYNCED" ? "🟢" : "🟡";
        message += `${statusIcon} ${c.name}${c.phone ? ` 📞 ${c.phone}` : ""}\n`;
      });
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch clients:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入委託客戶。");
    }
  }

}
