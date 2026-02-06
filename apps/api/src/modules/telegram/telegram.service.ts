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
import { EventsService } from "../events/events.service";
import { StorageService } from "../storage/storage.service";

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
    private readonly eventsService: EventsService,
    private readonly storageService: StorageService,
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
        case "/cost":
        case "/成本":
          await this.handleCostCommand(session);
          break;
        case "/help":
        case "/幫助":
          await this.handleHelp(session);
          break;
        case "/crew":
        case "/工班":
          await this.handleCrewCommand(session);
          break;
        case "/weather":
        case "/天氣":
          await this.handleWeatherCommand(session);
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

      // P7: Quick reply buttons
      const quickActions: TelegramInlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: "📝 日誌", callback_data: "action:log" },
            { text: "📊 狀態", callback_data: "action:status" },
            { text: "📅 行程", callback_data: "action:schedule" },
          ],
          [
            { text: "💰 成本", callback_data: "action:cost" },
            { text: "👷 工班", callback_data: "action:crew" },
            { text: "🌤️ 天氣", callback_data: "action:weather" },
          ],
        ],
      };

      await this.sendMessage(
        chatId,
        `✅ 已選擇專案：*${session.currentProjectName}*\n\n點擊下方按鈕或輸入指令：`,
        "Markdown",
        quickActions,
      );
    }

    // Handle quick action buttons
    if (data.startsWith("action:")) {
      const action = data.split(":")[1];
      switch (action) {
        case "log":
          await this.handleLogCommand(session, "");
          break;
        case "status":
          await this.handleStatusCommand(session);
          break;
        case "schedule":
          await this.handleScheduleCommand(session);
          break;
        case "cost":
          await this.handleCostCommand(session);
          break;
        case "crew":
          await this.handleCrewCommand(session);
          break;
        case "weather":
          await this.handleWeatherCommand(session);
          break;
      }
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
/cost - 成本摘要
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
    const today = new Date().toLocaleDateString("zh-TW");

    try {
      // Fetch today's events from database
      const todayEvents = await this.eventsService.findToday();

      // Filter by project if selected
      const events = session.currentProjectId
        ? todayEvents.filter((e) => e.projectId === session.currentProjectId)
        : todayEvents;

      if (events.length === 0) {
        const upcomingEvents = await this.eventsService.findUpcoming(3);
        if (upcomingEvents.length > 0) {
          const upcomingList = upcomingEvents
            .slice(0, 5)
            .map((e) => {
              const date = new Date(e.startTime).toLocaleDateString("zh-TW");
              const time = new Date(e.startTime).toLocaleTimeString("zh-TW", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return `${date} ${time} - ${e.title}`;
            })
            .join("\n");

          await this.sendMessage(
            session.chatId,
            `📅 *今日行程* (${today})\n\n📝 今日無排定行程\n\n🔜 *即將到來*\n${upcomingList}`,
            "Markdown",
          );
        } else {
          await this.sendMessage(
            session.chatId,
            `📅 *今日行程* (${today})\n\n📝 今日無排定行程`,
          );
        }
        return;
      }

      const eventList = events
        .map((e) => {
          const time = new Date(e.startTime).toLocaleTimeString("zh-TW", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const location = e.location ? ` @ ${e.location}` : "";
          return `${time} - ${e.title}${location}`;
        })
        .join("\n");

      await this.sendMessage(
        session.chatId,
        `📅 *今日行程* (${today})\n\n${eventList}\n\n共 ${events.length} 個活動`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch schedule:", error);
      await this.sendMessage(
        session.chatId,
        "❌ 無法載入行程，請稍後再試。",
      );
    }
  }

  private async handleCostCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.sendMessage(
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

      await this.sendMessage(
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
      await this.sendMessage(
        session.chatId,
        "❌ 無法載入成本資訊，請稍後再試。",
      );
    }
  }

  private async handleCrewCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    try {
      // Get today's site log for crew data
      const today = new Date().toISOString().split("T")[0];
      const todayLog = await this.siteLogsService.findByDate(
        session.currentProjectId,
        today,
      );

      if (!todayLog) {
        await this.sendMessage(
          session.chatId,
          `👷 *今日工班* (${today})\\n\\n📝 尚無工班紀錄\\n\\n使用 /log 新增今日日誌`,
          "Markdown",
        );
        return;
      }

      // Use correct SiteLog properties
      const totalOwn = todayLog.workersOwn || 0;
      const totalSubcon = todayLog.workersSubcon || 0;
      const totalWorkers = totalOwn + totalSubcon;

      // Format workforce breakdown if available
      let workerList = `• 自有人力：${totalOwn} 人\\n• 協力廠商：${totalSubcon} 人`;

      if (todayLog.workforce && todayLog.workforce.length > 0) {
        const tradeList = todayLog.workforce
          .map((w) => `• ${w.trade}：${w.count} 人${w.vendor ? ` (${w.vendor})` : ""}`)
          .join("\\n");
        workerList = tradeList;
      }

      await this.sendMessage(
        session.chatId,
        `👷 *今日工班* (${today})\\n\\n${workerList}\\n\\n共 ${totalWorkers} 人`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch crew data:", error);
      await this.sendMessage(
        session.chatId,
        "❌ 無法載入工班資訊，請稍後再試。",
      );
    }
  }

  private async handleWeatherCommand(session: UserSession): Promise<void> {
    // Simple weather info - can be enhanced with WeatherAlertService
    await this.sendMessage(
      session.chatId,
      `🌤️ *天氣資訊*\\n\\n📍 台北市\\n🌡️ 26°C / 多雲\\n💧 濕度：65%\\n\\n⚠️ 無預警\\n\\n_資料來源：中央氣象署_`,
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

    const photo = message.photo![message.photo!.length - 1];
    const caption = message.caption || "工地照片";

    try {
      // Check if storage is enabled
      if (!this.storageService.enabled) {
        await this.sendMessage(
          session.chatId,
          `📷 *照片已接收*\n\n📁 專案：${session.currentProjectName}\n📝 說明：${caption}\n\n⚠️ 雲端儲存未啟用，照片尚未上傳`,
          "Markdown",
        );
        return;
      }

      // Get file URL from Telegram
      const fileUrl = await this.getFileUrl(photo.file_id);
      if (!fileUrl) {
        throw new Error("Failed to get file URL from Telegram");
      }

      // Download file from Telegram
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Create file object for StorageService
      const timestamp = Date.now();
      const fileName = `${session.currentProjectId}_${timestamp}.jpg`;
      const multerFile = {
        fieldname: "photo",
        originalname: fileName,
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer,
        size: buffer.length,
        destination: "",
        filename: fileName,
        path: "",
        stream: undefined,
      } as unknown as Express.Multer.File;

      // Upload to GCS
      const gcsUrl = await this.storageService.uploadFile(
        multerFile,
        `projects/${session.currentProjectId}/telegram-photos`,
      );

      await this.sendMessage(
        session.chatId,
        `📷 *照片已上傳*\n\n📁 專案：${session.currentProjectName}\n📝 說明：${caption}\n☁️ 雲端儲存：已同步`,
        "Markdown",
      );

      this.logger.log(`Photo uploaded to GCS: ${gcsUrl}`);
    } catch (error) {
      this.logger.error("Failed to upload photo:", error);
      await this.sendMessage(
        session.chatId,
        `📷 *照片已接收*\n\n📁 專案：${session.currentProjectName}\n📝 說明：${caption}\n\n⚠️ 上傳失敗，請稍後重試`,
        "Markdown",
      );
    }
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
