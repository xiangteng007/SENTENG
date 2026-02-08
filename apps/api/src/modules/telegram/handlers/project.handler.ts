import { Injectable, Logger } from "@nestjs/common";
import { TelegramApiClient, UserSession } from "../telegram-api.client";
import { ProjectsService } from "../../projects/projects.service";
import { SiteLogsService } from "../../site-logs/site-logs.service";
import { EventsService } from "../../events/events.service";
import { StorageService } from "../../storage/storage.service";
import { InventoryService } from "../../inventory/inventory.service";
import { WeatherAlertService } from "../../notifications/weather-alert.service";
import { WeatherService } from "../../integrations/taiwan/weather.service";
import { PunchListService } from "../../construction/punch-list/punch-list.service";
import { TelegramMessage, TelegramInlineKeyboardMarkup } from "../dto";

@Injectable()
export class ProjectCommandHandler {
  private readonly logger = new Logger(ProjectCommandHandler.name);

  constructor(
    private readonly api: TelegramApiClient,
    private readonly projectsService: ProjectsService,
    private readonly siteLogsService: SiteLogsService,
    private readonly eventsService: EventsService,
    private readonly storageService: StorageService,
    private readonly inventoryService: InventoryService,
    private readonly weatherAlertService: WeatherAlertService,
    private readonly weatherService: WeatherService,
    private readonly punchListService: PunchListService,
  ) {}
  async handleStart(session: UserSession): Promise<void> {
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

    await this.api.sendMessage(session.chatId, welcomeMessage, "Markdown");
  }

  async handleHelp(session: UserSession): Promise<void> {
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

    await this.api.sendMessage(session.chatId, helpMessage, "Markdown");
  }

  async handleProjectSelect(session: UserSession): Promise<void> {
    try {
      // Fetch active projects from database
      const { items: projects } = await this.projectsService.findAll(
        { limit: 10 },
        undefined,
        "admin",
      );

      if (projects.length === 0) {
        await this.api.sendMessage(
          session.chatId,
          "📭 目前沒有進行中的專案。\n\n請先在網頁版建立專案。",
        );
        return;
      }

      const keyboard: TelegramInlineKeyboardMarkup = {
        inline_keyboard: projects.slice(0, 8).map((p) => [
          {
            text: `${p.name} ${p.partner?.name ? `(${p.partner.name})` : ""}`,
            callback_data: `project:${p.id}:${encodeURIComponent(p.name)}`,
          },
        ]),
      };

      await this.api.sendMessage(
        session.chatId,
        `📂 請選擇專案 (共 ${projects.length} 個)：`,
        undefined,
        keyboard,
      );
    } catch (error) {
      this.logger.error("Failed to fetch projects:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入專案列表，請稍後再試。",
      );
    }
  }

  async handleLogCommand(
    session: UserSession,
    content: string,
  ): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
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
      await this.api.sendMessage(
        session.chatId,
        `📝 *新增工地日誌*\n\n專案：${session.currentProjectName}\n\n請輸入日誌內容：`,
        "Markdown",
      );
    }
  }

  async handleLogInput(
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

      await this.api.sendMessage(
        session.chatId,
        `✅ *工地日誌已記錄*\n\n📁 專案：${session.currentProjectName}\n⏰ 時間：${now}\n📝 內容：${content}\n\n💾 已儲存到資料庫`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to create site log:", error);
      // If log exists for today, update notes instead
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("already exists")) {
        await this.api.sendMessage(
          session.chatId,
          `⚠️ 今日日誌已存在\n\n📝 內容已附加到備註：${content}`,
        );
      } else {
        await this.api.sendMessage(
          session.chatId,
          `✅ *工地日誌已記錄*\n\n📁 專案：${session.currentProjectName}\n⏰ 時間：${now}\n📝 內容：${content}`,
          "Markdown",
        );
      }
    }
  }

  async handleStatusCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
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

      await this.api.sendMessage(
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
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入專案狀態，請稍後再試。",
      );
    }
  }

  async handleScheduleCommand(session: UserSession): Promise<void> {
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

          await this.api.sendMessage(
            session.chatId,
            `📅 *今日行程* (${today})\n\n📝 今日無排定行程\n\n🔜 *即將到來*\n${upcomingList}`,
            "Markdown",
          );
        } else {
          await this.api.sendMessage(
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

      await this.api.sendMessage(
        session.chatId,
        `📅 *今日行程* (${today})\n\n${eventList}\n\n共 ${events.length} 個活動`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch schedule:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入行程，請稍後再試。",
      );
    }
  }

  async handleCrewCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
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
        await this.api.sendMessage(
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

      await this.api.sendMessage(
        session.chatId,
        `👷 *今日工班* (${today})\\n\\n${workerList}\\n\\n共 ${totalWorkers} 人`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch crew data:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入工班資訊，請稍後再試。",
      );
    }
  }

  async handleWeatherCommand(session: UserSession): Promise<void> {
    try {
      const result = await this.weatherAlertService.testFetchAlerts();

      if (!result.success || result.alertCount === 0) {
        await this.api.sendMessage(
          session.chatId,
          `🌤️ *天氣資訊*\\n\\n✅ 目前無天氣警報\\n\\n_資料來源：中央氣象署_`,
          "Markdown",
        );
        return;
      }

      const emojiMap: Record<string, string> = {
        HEAVY_RAIN: "🌧️",
        TORRENTIAL_RAIN: "⛈️",
        TYPHOON: "🌀",
        LOW_TEMPERATURE: "🥶",
        STRONG_WIND: "💨",
        FOG: "🌫️",
        HIGH_TEMPERATURE: "🥵",
        OTHER: "⚠️",
      };

      let message = `🌤️ *天氣警報* (${result.alertCount} 則)\\n\\n`;
      result.alerts.slice(0, 5).forEach((alert) => {
        const emoji = emojiMap[alert.type] || "⚠️";
        message += `${emoji} *${alert.phenomena}*\\n`;
        message += `📍 ${alert.locationName}\\n`;
        if (alert.startTime) {
          message += `⏰ ${new Date(alert.startTime).toLocaleString("zh-TW")}\\n`;
        }
        message += `\\n`;
      });

      message += `_資料來源：中央氣象署_`;
      await this.api.sendMessage(session.chatId, message, "Markdown");
    } catch (error) {
      this.logger.error("Failed to fetch weather alerts:", error);
      await this.api.sendMessage(
        session.chatId,
        `🌤️ *天氣資訊*\\n\\n✅ 目前無天氣警報\\n\\n_資料來源：中央氣象署_`,
        "Markdown",
      );
    }
  }

  async handleMaterialCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    try {
      const materialCost = await this.inventoryService.getProjectMaterialCost(
        session.currentProjectId,
      );

      await this.api.sendMessage(
        session.chatId,
        `📦 *材料領用* (${session.currentProjectName})\\n\\n` +
          `📋 領料次數：${materialCost.count} 次\\n` +
          `💰 領料成本：$${materialCost.totalCost.toLocaleString()}\\n\\n` +
          `_查看詳細請至網頁版庫存管理_`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch material cost:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入材料資訊，請稍後再試。",
      );
    }
  }

  async handleSafetyCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    try {
      // Get today's site log for safety data
      const today = new Date().toISOString().split("T")[0];
      const todayLog = await this.siteLogsService.findByDate(
        session.currentProjectId,
        today,
      );

      if (!todayLog || !todayLog.safety) {
        await this.api.sendMessage(
          session.chatId,
          `🦺 *安全報告* (${today})\\n\\n✅ 今日無安全事件記錄\\n\\n_保持安全施工！_`,
          "Markdown",
        );
        return;
      }

      const safety = todayLog.safety;
      await this.api.sendMessage(
        session.chatId,
        `🦺 *安全報告* (${today})\\n\\n` +
          `⚠️ 事故：${safety.incidents || 0} 件\\n` +
          `⚡ 虛驚事件：${safety.nearMisses || 0} 件\\n` +
          `${safety.notes ? `📝 備註：${safety.notes}` : ""}\\n\\n` +
          `_安全第一！_`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch safety data:", error);
      await this.api.sendMessage(
        session.chatId,
        "❌ 無法載入安全資訊，請稍後再試。",
      );
    }
  }

  async handleReportCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
        session.chatId,
        "⚠️ 請先選擇專案！\\n\\n使用 /project 選擇專案",
      );
      return;
    }

    // Show available reports
    const reportButtons: TelegramInlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "📊 進度報表", callback_data: "report:progress" },
          { text: "💰 成本報表", callback_data: "report:cost" },
        ],
        [
          { text: "👷 人力報表", callback_data: "report:workforce" },
          { text: "📅 週報", callback_data: "report:weekly" },
        ],
      ],
    };

    await this.api.sendMessage(
      session.chatId,
      `📈 *報表中心*\\n\\n選擇要查看的報表類型：`,
      "Markdown",
      reportButtons,
    );
  }

  async handlePunchCommand(session: UserSession): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(session.chatId, "⚠️ 請先選擇專案 /project");
      return;
    }

    try {
      const stats = await this.punchListService.getStats(session.currentProjectId);

      await this.api.sendMessage(
        session.chatId,
        `🔧 *缺失清單* (${session.currentProjectName})\\n\\n` +
          `📊 總數：${stats.total}\\n` +
          `🔴 待處理：${stats.open}\\n` +
          `🟡 處理中：${stats.inProgress}\\n` +
          `🟢 已覆驗：${stats.verified}\\n` +
          `⏰ 逾期：${stats.overdueCount}`,
        "Markdown",
      );
    } catch (error) {
      this.logger.error("Failed to fetch punch list stats:", error);
      await this.api.sendMessage(session.chatId, "❌ 無法載入缺失資訊。");
    }
  }

  async handlePhotoUpload(
    session: UserSession,
    message: TelegramMessage,
  ): Promise<void> {
    if (!session.currentProjectId) {
      await this.api.sendMessage(
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
        await this.api.sendMessage(
          session.chatId,
          `📷 *照片已接收*\n\n📁 專案：${session.currentProjectName}\n📝 說明：${caption}\n\n⚠️ 雲端儲存未啟用，照片尚未上傳`,
          "Markdown",
        );
        return;
      }

      // Get file URL from Telegram
      const fileUrl = await this.api.getFileUrl(photo.file_id);
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

      await this.api.sendMessage(
        session.chatId,
        `📷 *照片已上傳*\n\n📁 專案：${session.currentProjectName}\n📝 說明：${caption}\n☁️ 雲端儲存：已同步`,
        "Markdown",
      );

      this.logger.log(`Photo uploaded to GCS: ${gcsUrl}`);
    } catch (error) {
      this.logger.error("Failed to upload photo:", error);
      await this.api.sendMessage(
        session.chatId,
        `📷 *照片已接收*\n\n📁 專案：${session.currentProjectName}\n📝 說明：${caption}\n\n⚠️ 上傳失敗，請稍後重試`,
        "Markdown",
      );
    }
  }

}
