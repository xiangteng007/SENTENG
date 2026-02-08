import { Injectable, Logger } from "@nestjs/common";
import { TelegramApiClient, UserSession } from "../telegram-api.client";
import { ProjectsService } from "../../projects/projects.service";
import { CostEntriesService } from "../../cost-entries/cost-entries.service";
import { PaymentsService } from "../../payments/payments.service";
import { InvoicesService } from "../../invoices/invoices.service";
import { FinanceService } from "../../finance/finance.service";
import { ProfitAnalysisService } from "../../profit-analysis/profit-analysis.service";
import { AgingAnalysisService } from "../../finance/aging-analysis.service";
import { InsuranceService } from "../../insurance/insurance.service";

@Injectable()
export class FinancialCommandHandler {
  private readonly logger = new Logger(FinancialCommandHandler.name);

  constructor(
    private readonly api: TelegramApiClient,
    private readonly projectsService: ProjectsService,
    private readonly costEntriesService: CostEntriesService,
    private readonly paymentsService: PaymentsService,
    private readonly invoicesService: InvoicesService,
    private readonly financeService: FinanceService,
    private readonly profitAnalysisService: ProfitAnalysisService,
    private readonly agingAnalysisService: AgingAnalysisService,
    private readonly insuranceService: InsuranceService,
  ) {}
  async handleCostCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    try {
      const costSummary = await this.projectsService.getCostSummary(
        session.currentProjectId,
      );

      const contractAmount = Number(costSummary.contractAmount || 0);
      const costActual = Number(costSummary.costActual || 0);
      const costBudget = Number(costSummary.costBudget || 0);
      const changeAmount = Number(costSummary.changeAmount || 0);

      const usedPercent = costBudget
        ? Math.round((costActual / costBudget) * 100)
        : 0;
      const profitMargin = contractAmount
        ? Math.round(((contractAmount - costActual) / contractAmount) * 100)
        : 0;

      await this.api.sendMessage(
        session.chatId,
        `💰 *成本摘要*\\n\\n` +
          `📁 ${session.currentProjectName}\\n\\n` +
          `💵 合約金額：$${contractAmount.toLocaleString()}\\n` +
          `📊 成本預算：$${costBudget.toLocaleString()}\\n` +
          `📤 實際支出：$${costActual.toLocaleString()} (${usedPercent}%)\\n` +
          `📝 變更金額：$${changeAmount.toLocaleString()}\\n` +
          `📈 毛利率：${profitMargin}%`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch cost summary:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入成本資訊，請稍後再試。",
      );
    }
  }

  async handlePaymentCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    try {
      const payments = await this.paymentsService.findAll({
        projectId: session.currentProjectId,
      });

      if (!payments || payments.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          `💰 *請款狀態* (${session.currentProjectName})\\n\\n📝 目前無請款記錄`,
          "Markdown",
        );
        return;
      }

      const pending = payments.filter((p) => p.status === "PAY_PENDING");
      const approved = payments.filter((p) => p.status === "PAY_APPROVED");
      const pendingTotal = pending.reduce((sum, p) => sum + Number(p.requestAmount || 0), 0);
      const approvedTotal = approved.reduce((sum, p) => sum + Number(p.requestAmount || 0), 0);

      let message = `💰 *請款狀態* (${session.currentProjectName})\\n\\n`;
      message += `⏳ 待審核：${pending.length} 筆 ($${pendingTotal.toLocaleString()})\\n`;
      message += `✅ 已核准：${approved.length} 筆 ($${approvedTotal.toLocaleString()})\\n\\n`;

      // Show latest 3 pending
      if (pending.length > 0) {
        message += `*待審請款單：*\\n`;
        pending.slice(0, 3).forEach((p) => {
          message += `• ${p.id}: $${Number(p.requestAmount || 0).toLocaleString()}\\n`;
        });
      }

      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch payments:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入請款資訊，請稍後再試。");
    }
  }

  async handleInvoiceCommand(session: UserSession): Promise<void> {
    try {
      const stats = await this.invoicesService.getStats();

      await this.api.sendMessage(
        session.chatId,
        `🧾 *發票統計*\\n\\n` +
          `📊 總張數：${stats.totalCount} 張\\n` +
          `💰 總金額：$${Number(stats.totalAmountGross || 0).toLocaleString()}\\n` +
          `⏳ 待付款：${stats.unpaidCount || 0} 張\\n` +
          `🔍 待審核：${stats.needsReviewCount || 0} 張\\n` +
          `📝 待核准：${stats.pendingApprovalCount || 0} 張`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch invoice stats:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入發票資訊，請稍後再試。",
      );
    }
  }

  async handleExpenseCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(session.chatId, "⚠️ 請先選擇專案 /project");
      return;
    }
    try {
      const summary = await this.costEntriesService.getSummary(session.currentProjectId);
      await this.api.sendMessage(
        session.chatId,
        `💰 *支出摘要* (${session.currentProjectName})\\n\\n` +
          `📊 總支出：$${Number(summary.totalCost || 0).toLocaleString()}\\n` +
          `✅ 已付款：$${Number(summary.paidCost || 0).toLocaleString()}\\n` +
          `⏳ 未付款：$${Number(summary.unpaidCost || 0).toLocaleString()}\\n` +
          `📝 筆數：${summary.entryCount || 0}`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch expense summary:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入支出摘要。");
    }
  }

  async handleFinanceCommand(session: UserSession): Promise<void> {
    try {
      const transactions = await this.financeService.findAllTransactions();
      const income = transactions.filter((t) => t.type === "收入").reduce((s, t) => s + Number(t.amount || 0), 0);
      const expense = transactions.filter((t) => t.type === "支出").reduce((s, t) => s + Number(t.amount || 0), 0);
      await this.api.sendMessage(
        session.chatId,
        `📊 *財務總覽*\\n\\n` +
          `💵 總收入：$${income.toLocaleString()}\\n` +
          `💸 總支出：$${expense.toLocaleString()}\\n` +
          `📈 淨收入：$${(income - expense).toLocaleString()}\\n` +
          `📝 交易筆數：${transactions.length}`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch finance summary:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入財務摘要。");
    }
  }

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

  async handleProfitCommand(session: UserSession): Promise<void> {
    try {
      const dashboard = await this.profitAnalysisService.getDashboard();
      await this.api.sendMessage(
        session.chatId,
        `📈 *利潤分析*\\n\\n` +
          `📊 進行中專案：${dashboard.totalContracts}\\n` +
          `💰 總營收：$${Number(dashboard.totalRevenue || 0).toLocaleString()}\\n` +
          `💸 總成本：$${Number(dashboard.totalCost || 0).toLocaleString()}\\n` +
          `📈 總利潤：$${Number(dashboard.totalProfit || 0).toLocaleString()}\\n` +
          `📊 平均毛利率：${dashboard.avgMarginRate}%`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch profit analysis:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入利潤分析。");
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

}
