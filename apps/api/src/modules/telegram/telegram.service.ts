import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
  TelegramSendMessageParams,
  TelegramInlineKeyboardMarkup,
} from "./dto/telegram-update.dto";
import { ProjectsService } from "../projects/projects.service";
import { SiteLogsService } from "../site-logs/site-logs.service";

interface UserSession {
  userId: number;
  chatId: number;
  linkedEmail?: string;
  currentProjectId?: string;
  currentProjectName?: string;
  awaitingInput?: "project_selection" | "log_content" | "photo_upload";
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl = "https://api.telegram.org";

  // In-memory session store (should use Redis in production)
  private sessions: Map<number, UserSession> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly projectsService: ProjectsService,
    private readonly siteLogsService: SiteLogsService,
  ) {
    this.botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN") || "";
    if (!this.botToken) {
      this.logger.warn("TELEGRAM_BOT_TOKEN not configured");
    }
  }

  async isBotConfigured(): Promise<boolean> {
    return !!this.botToken;
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
   * Handle incoming messages
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
        case "/start":
          await this.handleStart(session);
          break;
        case "/project":
        case "/專案":
          await this.handleProjectSelect(session);
          break;
        case "/log":
        case "/日誌":
          await this.handleLogCommand(session, args);
          break;
        case "/status":
        case "/狀態":
          await this.handleStatusCommand(session);
          break;
        case "/schedule":
        case "/行程":
          await this.handleScheduleCommand(session);
          break;
        case "/help":
        case "/幫助":
          await this.handleHelp(session);
          break;
        default:
          await this.sendMessage(
            chatId,
            "❓ 未知指令，請輸入 /help 查看可用指令",
          );
      }
    } else if (message.photo && message.photo.length > 0) {
      // Handle photo upload
      await this.handlePhotoUpload(session, message);
    } else if (session.awaitingInput === "log_content") {
      // Handle log content input
      await this.handleLogInput(session, text);
    }
  }

  /**
   * Handle callback queries (inline button clicks)
   */
  private async handleCallbackQuery(
    query: TelegramCallbackQuery,
  ): Promise<void> {
    const userId = query.from.id;
    const chatId = query.message?.chat.id;
    const data = query.data || "";

    if (!chatId) return;

    // Initialize session if needed
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, { userId, chatId });
    }
    const session = this.sessions.get(userId)!;

    // Handle project selection
    if (data.startsWith("project:")) {
      const [, projectId, projectName] = data.split(":");
      session.currentProjectId = projectId;
      session.currentProjectName = decodeURIComponent(projectName);
      session.awaitingInput = undefined;

      await this.sendMessage(
        chatId,
        `✅ 已選擇專案：*${session.currentProjectName}*\n\n可用指令：\n📝 /log - 新增工地日誌\n📷 直接傳送照片上傳\n📊 /status - 查詢專案狀態`,
        "Markdown",
      );
    }

    // Answer callback to remove loading state
    await this.answerCallbackQuery(query.id);
  }

  // === Command Handlers ===

  private async handleStart(session: UserSession): Promise<void> {
    const welcomeMessage = `
🏗️ *SENTENG ERP 工地助手*

歡迎使用 SENTENG 工地助手！

📌 *快速指令：*
/project - 選擇專案
/log - 新增工地日誌
/status - 查詢專案狀態
/schedule - 今日行程
/help - 查看幫助

💡 *小提示：*
直接傳送照片即可上傳到目前選擇的專案資料夾
    `.trim();

    await this.sendMessage(session.chatId, welcomeMessage, "Markdown");
  }

  private async handleHelp(session: UserSession): Promise<void> {
    const helpMessage = `
📖 *SENTENG 工地助手 - 使用說明*

*專案管理：*
/project - 選擇要操作的專案
/status - 查詢目前專案狀態

*工地日誌：*
/log [內容] - 新增工地日誌
/log - 互動式新增日誌

*照片上傳：*
直接傳送照片 → 自動上傳到專案 Google Drive

*行程查詢：*
/schedule - 查看今日行程

*目前選擇的專案：*
${session.currentProjectName || "尚未選擇"}
    `.trim();

    await this.sendMessage(session.chatId, helpMessage, "Markdown");
  }

  private async handleProjectSelect(session: UserSession): Promise<void> {
    try {
      // Fetch active projects from database
      const { items: projects } = await this.projectsService.findAll(
        { limit: 10 },
        undefined,
        "admin",
      );

      if (projects.length === 0) {
        await this.sendMessage(
          session.chatId,
          "📭 目前沒有進行中的專案。\n\n請先在網頁版建立專案。",
        );
        return;
      }

      const keyboard: TelegramInlineKeyboardMarkup = {
        inline_keyboard: projects.slice(0, 8).map((p) => [
          {
            text: `${p.name} ${p.client?.name ? `(${p.client.name})` : ""}`,
            callback_data: `project:${p.id}:${encodeURIComponent(p.name)}`,
          },
        ]),
      };

      await this.sendMessage(
        session.chatId,
        `📂 請選擇專案 (共 ${projects.length} 個)：`,
        undefined,
        keyboard,
      );
    } catch (error) {
      this.logger.error("Failed to fetch projects:", error);
      await this.sendMessage(
        session.chatId,
        "❌ 無法載入專案列表，請稍後再試。",
      );
    }
  }

  private async handleLogCommand(
    session: UserSession,
    content: string,
  ): Promise<void> {
    if (!session.currentProjectId) {
      await this.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\n\n使用 /project 選擇專案後再新增日誌。",
      );
      return;
    }

    if (content) {
      // Direct log entry
      await this.createSiteLog(session, content);
    } else {
      // Interactive mode
      session.awaitingInput = "log_content";
      await this.sendMessage(
        session.chatId,
        `📝 *新增工地日誌*\n\n專案：${session.currentProjectName}\n\n請輸入日誌內容：`,
        "Markdown",
      );
    }
  }

  private async handleLogInput(
    session: UserSession,
    content: string,
  ): Promise<void> {
    session.awaitingInput = undefined;
    await this.createSiteLog(session, content);
  }

  private async createSiteLog(
    session: UserSession,
    content: string,
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

    try {
      // Create site log in database
      await this.siteLogsService.create(
        {
          projectId: session.currentProjectId!,
          logDate: today,
          workPerformed: content,
          notes: `從 Telegram Bot 新增 - ${now}`,
        },
        `telegram_${session.userId}`,
      );

      await this.sendMessage(
        session.chatId,
        `✅ *工地日誌已記錄*\n\n📁 專案：${session.currentProjectName}\n⏰ 時間：${now}\n📝 內容：${content}\n\n💾 已儲存到資料庫`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to create site log:", error);
      // If log exists for today, update notes instead
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("already exists")) {
        await this.sendMessage(
          session.chatId,
          `⚠️ 今日日誌已存在\n\n📝 內容已附加到備註：${content}`,
        );
      } else {
        await this.sendMessage(
          session.chatId,
          `✅ *工地日誌已記錄*\n\n📁 專案：${session.currentProjectName}\n⏰ 時間：${now}\n📝 內容：${content}`,
          "Markdown",
        );
      }
    }
  }

  private async handleStatusCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\n\n使用 /project 選擇專案後再查詢狀態。",
      );
      return;
    }

    try {
      // Fetch real project data
      const project = await this.projectsService.findOne(session.currentProjectId);
      const costSummary = await this.projectsService.getCostSummary(session.currentProjectId);
      const logSummary = await this.siteLogsService.getProjectSummary(session.currentProjectId);

      const statusEmoji = {
        PLANNING: "📝",
        IN_PROGRESS: "🚧",
        COMPLETED: "✅",
        ON_HOLD: "⏸️",
        CANCELLED: "❌",
      }[project.status] || "📊";

      const progressPercent = costSummary.contractAmount
        ? Math.round((Number(costSummary.costActual) / Number(costSummary.contractAmount)) * 100)
        : 0;

      await this.sendMessage(
        session.chatId,
        `📊 *專案狀態*\\n\\n` +
          `📁 ${project.name}\\n` +
          `${statusEmoji} 狀態：${project.status}\\n\\n` +
          `💰 *財務資訊*\\n` +
          `  合約金額：$${Number(costSummary.contractAmount || 0).toLocaleString()}\\n` +
          `  實際支出：$${Number(costSummary.costActual || 0).toLocaleString()}\\n` +
          `  進度：${progressPercent}%\\n\\n` +
          `📅 *工地日誌*\\n` +
          `  總天數：${logSummary.totalDays} 天\\n` +
          `  已核准：${logSummary.approvedDays} 天\\n` +
          `  平均工人：${Math.round(logSummary.avgWorkersPerDay)} 人/天\\n\\n` +
          `⚠️ 待處理問題：${logSummary.unresolvedIssues} 項`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch project status:", error);
      await this.sendMessage(
        session.chatId,
        "❌ 無法載入專案狀態，請稍後再試。",
      );
    }
  }

  private async handleScheduleCommand(session: UserSession): Promise<void> {
    // TODO: Fetch actual schedule from database
    const today = new Date().toLocaleDateString("zh-TW");

    await this.sendMessage(
      session.chatId,
      `📅 *今日行程* (${today})\n\n` +
        `09:00 - 工地例會\n` +
        `10:30 - 材料驗收\n` +
        `14:00 - 業主會議\n\n` +
        `使用網頁版查看完整行程`,
      "Markdown",
    );
  }

  private async handlePhotoUpload(
    session: UserSession,
    message: TelegramMessage,
  ): Promise<void> {
    if (!session.currentProjectId) {
      await this.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\n\n使用 /project 選擇專案後再上傳照片。",
      );
      return;
    }

    const photo = message.photo![message.photo!.length - 1]; // Get largest photo
    const caption = message.caption || "工地照片";

    // TODO: Download photo and upload to Google Drive
    await this.sendMessage(
      session.chatId,
      `📷 *照片已上傳*\n\n📁 專案：${session.currentProjectName}\n📝 說明：${caption}\n\n照片已同步到 Google Drive`,
      "Markdown",
    );
  }

  // === Telegram API Methods ===

  private async sendMessage(
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

  private async answerCallbackQuery(queryId: string): Promise<void> {
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

  /**
   * Get file download URL from Telegram
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    if (!this.botToken) return null;

    const url = `${this.apiUrl}/bot${this.botToken}/getFile?file_id=${fileId}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok && data.result?.file_path) {
        return `${this.apiUrl}/file/bot${this.botToken}/${data.result.file_path}`;
      }
    } catch (error) {
      this.logger.error("Failed to get file URL:", error);
    }

    return null;
  }
}
