import { Injectable, Logger } from "@nestjs/common";
import { TelegramApiClient, UserSession } from "../telegram-api.client";
import { AuditService } from "../../platform/audit/audit.service";
import { SitesService } from "../../platform/sites/sites.service";
import { RbacService } from "../../platform/rbac/rbac.service";
import { TenantsService } from "../../platform/tenants/tenants.service";
import { GeminiAiService } from "../../regulations/gemini-ai.service";

@Injectable()
export class PlatformCommandHandler {
  private readonly logger = new Logger(PlatformCommandHandler.name);

  constructor(
    private readonly api: TelegramApiClient,
    private readonly auditService: AuditService,
    private readonly sitesService: SitesService,
    private readonly rbacService: RbacService,
    private readonly tenantsService: TenantsService,
    private readonly geminiAiService: GeminiAiService,
  ) {}
  async handleAskCommand(
    session: UserSession,
    text: string,
  ): Promise<void> {
    // Extract question from command: /ask <question>
    const question = text.replace(/^\/(ask|問)\s*/i, "").trim();

    if (!question) {
      await this.api.sendMessage(
        session.chatId,
        `🤖 *AI 法規助手*\\n\\n使用方式：\\n/ask <問題>\\n\\n範例：\\n/ask 消防安全設備有哪些規定？\\n/問 建築技術規則第407條是什麼？`,
        "Markdown",
      );
      return;
    }

    if (!this.geminiAiService.isEnabled()) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ AI 服務未啟用，請聯繫管理員設定 GEMINI_API_KEY。",
      );
      return;
    }

    await this.api.sendMessage(
      session.chatId,
      "🤖 正在查詢中，請稍候...",
    );

    try {
      const response = await this.geminiAiService.generateRegulationSummary(
        `使用者問題：${question}`,
      );

      await this.api.sendMessage(
        session.chatId,
        `🤖 *AI 法規助手*\\n\\n❓ *問題：* ${question}\\n\\n💡 *回答：*\\n${response}`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("AI query failed:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ AI 查詢失敗，請稍後再試。",
      );
    }
  }

  async handleAuditCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `📋 *稽核紀錄*\n\n` +
        `ℹ️ 稽核功能可查詢特定實體或用戶的操作記錄\n` +
        `請使用網頁版管理後台查看完整稽核日誌`,
      "Markdown",
    );
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

  async handleRoleCommand(session: UserSession): Promise<void> {
    try {
      const roles = await this.rbacService.findAllRoles();
      if (!roles || roles.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `👥 *角色權限*\n\n✅ 無角色設定`,
          "Markdown",
        );
        return;
      }
      let message = `👥 *角色權限* (${roles.length} 個)\n\n`;
      roles.slice(0, 5).forEach((r) => {
        message += `• ${r.name}${r.description ? ` - ${r.description}` : ""}\n`;
      });
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch roles:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入角色權限。");
    }
  }

  async handleTenantCommand(session: UserSession): Promise<void> {
    try {
      const units = await this.tenantsService.findAllBusinessUnits();
      if (!units || units.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `🏢 *事業單位*\n\n✅ 無事業單位`,
          "Markdown",
        );
        return;
      }
      let message = `🏢 *事業單位* (${units.length} 個)\n\n`;
      units.slice(0, 5).forEach((bu) => {
        const statusIcon = bu.isActive ? "🟢" : "🔴";
        message += `${statusIcon} ${bu.name} (${bu.code})\n`;
      });
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch tenants:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入事業單位。");
    }
  }

}
