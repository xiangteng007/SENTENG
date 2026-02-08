import { Injectable, Logger } from "@nestjs/common";
import { TelegramApiClient, UserSession } from "../telegram-api.client";
import { ContractsService } from "../../contracts/contracts.service";
import { ChangeOrdersService } from "../../change-orders/change-orders.service";
import { QuotationsService } from "../../quotations/quotations.service";
import { WorkOrdersService } from "../../drone/work-orders/work-orders.service";

@Injectable()
export class ContractCommandHandler {
  private readonly logger = new Logger(ContractCommandHandler.name);

  constructor(
    private readonly api: TelegramApiClient,
    private readonly contractsService: ContractsService,
    private readonly changeOrdersService: ChangeOrdersService,
    private readonly quotationsService: QuotationsService,
    private readonly workOrdersService: WorkOrdersService,
  ) {}
  async handleContractCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    try {
      const contracts = await this.contractsService.findAll({
        projectId: session.currentProjectId,
      });

      if (!contracts || contracts.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `📜 *合約資訊* (${session.currentProjectName})\\n\\n📝 目前無合約記錄`,
          "Markdown",
        );
        return;
      }

      const contract = contracts[0]; // Primary contract
      const originalAmount = Number(contract.originalAmount || 0);
      const changeAmount = Number(contract.changeAmount || 0);
      const currentAmount = Number(contract.currentAmount || originalAmount + changeAmount);
      const retentionAmount = Number(contract.retentionAmount || 0);

      await this.api.sendMessage(
        session.chatId,
        `📜 *合約資訊* (${session.currentProjectName})\\n\\n` +
          `📋 合約編號：${contract.contractNo || contract.id}\\n` +
          `💰 原始金額：$${originalAmount.toLocaleString()}\\n` +
          `📝 變更金額：$${changeAmount.toLocaleString()}\\n` +
          `📊 現行金額：$${currentAmount.toLocaleString()}\\n` +
          `🔒 保留款：$${retentionAmount.toLocaleString()}`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch contract:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入合約資訊，請稍後再試。");
    }
  }

  async handleChangeOrderCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    try {
      const changeOrders = await this.changeOrdersService.findAll({
        projectId: session.currentProjectId,
      });

      if (!changeOrders || changeOrders.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `📝 *變更單* (${session.currentProjectName})\\n\\n✅ 目前無變更單`,
          "Markdown",
        );
        return;
      }

      const approved = changeOrders.filter((c) => c.status === "CO_APPROVED");
      const pending = changeOrders.filter((c) => c.status === "CO_PENDING");
      const approvedTotal = approved.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const pendingTotal = pending.reduce((sum, c) => sum + Number(c.amount || 0), 0);

      let message = `📝 *變更單* (${session.currentProjectName})\\n\\n`;
      message += `✅ 已核准：${approved.length} 件 ($${approvedTotal.toLocaleString()})\\n`;
      message += `⏳ 審核中：${pending.length} 件 ($${pendingTotal.toLocaleString()})\\n\\n`;

      // List recent change orders
      changeOrders.slice(0, 5).forEach((co) => {
        const statusIcon = co.status === "CO_APPROVED" ? "✅" : co.status === "CO_PENDING" ? "⏳" : "📋";
        message += `${statusIcon} ${co.coNumber || co.id}: $${Number(co.amount || 0).toLocaleString()}\\n`;
      });

      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch change orders:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入變更單資訊，請稍後再試。");
    }
  }

  async handleQuoteCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(session.chatId, "⚠️ 請先選擇專案 /project");
      return;
    }

    try {
      const quotes = await this.quotationsService.findAll({
        projectId: session.currentProjectId,
      });

      if (!quotes || quotes.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `📝 *報價單* (${session.currentProjectName})\\n\\n✅ 目前無報價單`,
          "Markdown",
        );
        return;
      }

      let message = `📝 *報價單* (${session.currentProjectName})\\n\\n`;
      quotes.slice(0, 5).forEach((q) => {
        const statusIcon = q.status === "APPROVED" ? "✅" : q.status === "PENDING" ? "⏳" : "📋";
        message += `${statusIcon} ${q.id} ${q.title || ""}: $${Number(q.totalAmount || 0).toLocaleString()}\\n`;
      });

      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch quotations:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入報價單資訊。");
    }
  }

  async handleWorkOrderCommand(session: UserSession): Promise<void> {
    try {
      const workOrders = await this.workOrdersService.findAll();
      if (!workOrders || workOrders.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `📋 *派工單*\n\n✅ 無派工資料`,
          "Markdown",
        );
        return;
      }
      let message = `📋 *派工單* (${workOrders.length} 張)\n\n`;
      workOrders.slice(0, 5).forEach((wo) => {
        const statusIcon = wo.status === "WO_COMPLETED" ? "✅" : wo.status === "WO_IN_PROGRESS" ? "🔄" : "📝";
        message += `${statusIcon} ${wo.woNumber || wo.id} - ${wo.project?.name || "無專案"}\n`;
      });
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch work orders:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入派工單。");
    }
  }

}
