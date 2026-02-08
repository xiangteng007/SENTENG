import { Injectable, Logger } from "@nestjs/common";
import {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
} from "./dto";
import { TelegramApiClient, UserSession } from "./telegram-api.client";
import { ProjectCommandHandler } from "./handlers/project.handler";
import { FinancialCommandHandler } from "./handlers/financial.handler";
import { ContractCommandHandler } from "./handlers/contract.handler";
import { PartnerCommandHandler } from "./handlers/partner.handler";
import { PlatformCommandHandler } from "./handlers/platform.handler";
import { IntegrationCommandHandler } from "./handlers/integration.handler";
import { RegulatoryCommandHandler } from "./handlers/regulatory.handler";

/**
 * Core Telegram Bot Service — Lean Router
 *
 * Routes incoming Telegram updates to domain-specific command handlers.
 * Manages user sessions and delegates command execution.
 *
 * Handler domains:
 *   - ProjectCommandHandler:     /project, /log, /status, /schedule, /crew, /weather, /material, /safety, /report, /punch
 *   - FinancialCommandHandler:   /cost, /payment, /invoice, /expense, /finance, /profit, /aging
 *   - ContractCommandHandler:    /contract, /change, /quote, /workorder
 *   - PartnerCommandHandler:     /customer, /contact, /client
 *   - PlatformCommandHandler:    /ask, /audit, /site, /role, /tenant
 *   - IntegrationCommandHandler: /line, /calendar, /drive, /export, /email, /push, /sheets, /banking, /contacts, /lineapi, /nhi, /govdata
 *   - RegulatoryCommandHandler:  /insurance, /einvoice, /building, /firesafety, /cns
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  // In-memory session store (should use Redis in production)
  private sessions: Map<number, UserSession> = new Map();

  constructor(
    private readonly api: TelegramApiClient,
    private readonly projectHandler: ProjectCommandHandler,
    private readonly financialHandler: FinancialCommandHandler,
    private readonly contractHandler: ContractCommandHandler,
    private readonly partnerHandler: PartnerCommandHandler,
    private readonly platformHandler: PlatformCommandHandler,
    private readonly integrationHandler: IntegrationCommandHandler,
    private readonly regulatoryHandler: RegulatoryCommandHandler,
  ) {}

  async isBotConfigured(): Promise<boolean> {
    return this.api.isBotConfigured;
  }

  /**
   * Main update handler - routes to appropriate command handler
   */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  /**
   * Handle incoming messages — command routing
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const userId = message.from?.id;
    const text = message.text?.trim() || "";

    if (!userId) return;

    // Initialize session if needed
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, { userId, chatId });
    }
    const session = this.sessions.get(userId)!;
    session.chatId = chatId;

    // Check if it's a command
    if (text.startsWith("/")) {
      const command = text.split(" ")[0].toLowerCase();
      const args = text.slice(command.length).trim();

      switch (command) {
        // === Project Operations ===
        case "/start":
          await this.projectHandler.handleStart(session);
          break;
        case "/project":
        case "/專案":
          await this.projectHandler.handleProjectSelect(session);
          break;
        case "/log":
        case "/日誌":
          await this.projectHandler.handleLogCommand(session, args);
          break;
        case "/status":
        case "/狀態":
          await this.projectHandler.handleStatusCommand(session);
          break;
        case "/schedule":
        case "/行程":
          await this.projectHandler.handleScheduleCommand(session);
          break;
        case "/crew":
        case "/工班":
          await this.projectHandler.handleCrewCommand(session);
          break;
        case "/weather":
        case "/天氣":
          await this.projectHandler.handleWeatherCommand(session);
          break;
        case "/material":
        case "/材料":
          await this.projectHandler.handleMaterialCommand(session);
          break;
        case "/safety":
        case "/安全":
          await this.projectHandler.handleSafetyCommand(session);
          break;
        case "/report":
        case "/報表":
          await this.projectHandler.handleReportCommand(session);
          break;
        case "/punch":
        case "/缺失":
          await this.projectHandler.handlePunchCommand(session);
          break;
        case "/help":
        case "/幫助":
          await this.projectHandler.handleHelp(session);
          break;

        // === Financial ===
        case "/cost":
        case "/成本":
          await this.financialHandler.handleCostCommand(session);
          break;
        case "/payment":
        case "/請款":
          await this.financialHandler.handlePaymentCommand(session);
          break;
        case "/invoice":
        case "/發票":
          await this.financialHandler.handleInvoiceCommand(session);
          break;
        case "/expense":
        case "/支出":
          await this.financialHandler.handleExpenseCommand(session);
          break;
        case "/finance":
        case "/財務":
          await this.financialHandler.handleFinanceCommand(session);
          break;
        case "/profit":
        case "/利潤":
          await this.financialHandler.handleProfitCommand(session);
          break;
        case "/aging":
        case "/帳齡":
          await this.financialHandler.handleAgingCommand(session);
          break;

        // === Contracts & Quotes ===
        case "/contract":
        case "/合約":
          await this.contractHandler.handleContractCommand(session);
          break;
        case "/change":
        case "/變更":
          await this.contractHandler.handleChangeOrderCommand(session);
          break;
        case "/quote":
        case "/報價":
          await this.contractHandler.handleQuoteCommand(session);
          break;
        case "/workorder":
        case "/派工":
          await this.contractHandler.handleWorkOrderCommand(session);
          break;

        // === Partners / CRM ===
        case "/customer":
        case "/客戶":
          await this.partnerHandler.handleCustomerCommand(session);
          break;
        case "/contact":
        case "/聯絡人":
          await this.partnerHandler.handleContactCommand(session);
          break;
        case "/client":
        case "/委託":
          await this.partnerHandler.handleClientCommand(session);
          break;

        // === Platform / Admin ===
        case "/ask":
        case "/問":
          await this.platformHandler.handleAskCommand(session, text);
          break;
        case "/audit":
        case "/稽核":
          await this.platformHandler.handleAuditCommand(session);
          break;
        case "/site":
        case "/工地":
          await this.platformHandler.handleSiteCommand(session);
          break;
        case "/role":
        case "/角色":
          await this.platformHandler.handleRoleCommand(session);
          break;
        case "/tenant":
        case "/公司":
          await this.platformHandler.handleTenantCommand(session);
          break;

        // === Integrations ===
        case "/line":
        case "/推播":
          await this.integrationHandler.handleLineNotifyCommand(session);
          break;
        case "/calendar":
        case "/日曆":
          await this.integrationHandler.handleCalendarCommand(session);
          break;
        case "/drive":
        case "/雲端":
          await this.integrationHandler.handleDriveCommand(session);
          break;
        case "/export":
        case "/匯出":
          await this.integrationHandler.handleExportCommand(session);
          break;
        case "/email":
        case "/郵件":
          await this.integrationHandler.handleEmailCommand(session);
          break;
        case "/push":
        case "/推送":
          await this.integrationHandler.handlePushCommand(session);
          break;
        case "/sheets":
        case "/試算表":
          await this.integrationHandler.handleSheetsCommand(session);
          break;
        case "/banking":
        case "/銀行":
          await this.integrationHandler.handleBankingCommand(session);
          break;
        case "/contacts":
        case "/同步聯絡人":
          await this.integrationHandler.handleContactsCommand(session);
          break;
        case "/lineapi":
        case "/LINE推播":
          await this.integrationHandler.handleLineApiCommand(session);
          break;
        case "/nhi":
        case "/勞健保":
          await this.integrationHandler.handleNhiCommand(session);
          break;
        case "/govdata":
        case "/公開資料":
          await this.integrationHandler.handleGovDataCommand(session);
          break;

        // === Regulatory ===
        case "/insurance":
        case "/保險":
          await this.regulatoryHandler.handleInsuranceCommand(session);
          break;
        case "/einvoice":
        case "/電子發票":
          await this.regulatoryHandler.handleEInvoiceCommand(session);
          break;
        case "/building":
        case "/建規":
          await this.regulatoryHandler.handleBuildingCodeCommand(session);
          break;
        case "/firesafety":
        case "/消防":
          await this.regulatoryHandler.handleFireSafetyCommand(session);
          break;
        case "/cns":
        case "/標準":
          await this.regulatoryHandler.handleCnsCommand(session);
          break;

        default:
          await this.api.sendMessage(
            chatId,
            "❓ 未知指令，請輸入 /help 查看可用指令",
          );
      }
    } else if (message.photo && message.photo.length > 0) {
      // Handle photo upload
      await this.projectHandler.handlePhotoUpload(session, message);
    } else if (session.awaitingInput === "log_content") {
      // Handle log content input
      await this.projectHandler.handleLogInput(session, text);
    }
  }

  /**
   * Handle callback queries (inline button clicks)
   */
  private async handleCallbackQuery(
    query: TelegramCallbackQuery,
  ): Promise<void> {
    const userId = query.from.id;
    const data = query.data || "";

    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        userId,
        chatId: query.message?.chat?.id || userId,
      });
    }
    const session = this.sessions.get(userId)!;

    // Answer callback to remove loading state
    await this.api.answerCallbackQuery(query.id);

    // Route callback by prefix
    if (data.startsWith("project:")) {
      const parts = data.split(":");
      const projectId = parts[1];
      const projectName = parts[2]
        ? decodeURIComponent(parts[2])
        : projectId;
      session.currentProjectId = projectId;
      session.currentProjectName = projectName;

      await this.api.sendMessage(
        session.chatId,
        `✅ 已選擇專案: *${session.currentProjectName}*\n\n可以使用以下指令:\n/status - 查看狀態\n/log - 新增施工日誌\n/schedule - 查看行程\n/cost - 查看成本\n/crew - 查看工班`,
        "Markdown",
      );
    }
  }
}
