import { Injectable, Logger } from "@nestjs/common";
import { TelegramApiClient, UserSession } from "../telegram-api.client";
import { LineNotifyService } from "../../notifications/line-notify.service";
import { CalendarSyncService } from "../../integrations/google/calendar-sync.service";
import { GoogleDriveService } from "../../integrations/google/google-drive.service";
import { AccountingExportService } from "../../integrations/banking/accounting-export.service";
import { EmailService } from "../../notifications/email.service";
import { PushNotificationService } from "../../notifications/push-notification.service";
import { GoogleSheetsService } from "../../integrations/google/google-sheets.service";
import { BankingIntegrationService } from "../../integrations/banking/banking-integration.service";
import { ContactsSyncService } from "../../integrations/google/contacts-sync.service";
import { LineApiService } from "../../integrations/taiwan/line-api.service";
import { NhiApiService } from "../../integrations/taiwan/nhi-api.service";
import { TaiwanGovDataService } from "../../integrations/taiwan/taiwan-gov-data.service";

@Injectable()
export class IntegrationCommandHandler {
  private readonly logger = new Logger(IntegrationCommandHandler.name);

  constructor(
    private readonly api: TelegramApiClient,
    private readonly lineNotifyService: LineNotifyService,
    private readonly calendarSyncService: CalendarSyncService,
    private readonly googleDriveService: GoogleDriveService,
    private readonly accountingExportService: AccountingExportService,
    private readonly emailService: EmailService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly bankingIntegrationService: BankingIntegrationService,
    private readonly contactsSyncService: ContactsSyncService,
    private readonly lineApiService: LineApiService,
    private readonly nhiApiService: NhiApiService,
    private readonly taiwanGovDataService: TaiwanGovDataService,
  ) {}
  async handleLineNotifyCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `📱 *LINE 通知服務*\n\n` +
        `📋 支援功能：\n` +
        `• 專案進度通知\n` +
        `• 里程碑提醒\n` +
        `• 延遲警報\n` +
        `• 完工通知\n\n` +
        `ℹ️ 請透過網頁版設定 LINE 推播`,
      "Markdown",
    );
  }

  async handleCalendarCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `📅 *Google Calendar 同步*\n\n` +
        `📋 支援功能：\n` +
        `• ERP 事件 → Calendar\n` +
        `• 批量同步\n` +
        `• 失敗重試\n\n` +
        `ℹ️ 使用網頁版管理日曆同步`,
      "Markdown",
    );
  }

  async handleDriveCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `☁️ *Google Drive 整合*\n\n` +
        `📋 支援功能：\n` +
        `• 專案資料夾管理\n` +
        `• 工地照片上傳\n` +
        `• 檔案縮圖預覽\n\n` +
        `ℹ️ 使用網頁版管理雲端檔案`,
      "Markdown",
    );
  }

  async handleExportCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `📤 *會計匯出*\n\n` +
        `📋 支援格式：\n` +
        `• 鼎新 ERP 傳票格式\n` +
        `• CSV/XML 通用格式\n` +
        `• 專案成本明細\n` +
        `• 發票明細\n\n` +
        `ℹ️ 使用網頁版匯出會計資料`,
      "Markdown",
    );
  }

  async handleEmailCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `📧 *Email 通知服務*\n\n` +
        `📋 支援功能：\n` +
        `• 專案建立通知\n` +
        `• 付款提醒\n` +
        `• 歡迎郵件\n` +
        `• 模板化郵件\n\n` +
        `ℹ️ 使用網頁版設定 Email 通知`,
      "Markdown",
    );
  }

  async handlePushCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `🔔 *Web Push 通知*\n\n` +
        `📋 支援功能：\n` +
        `• 天氣警報推送\n` +
        `• 專案進度提醒\n` +
        `• 廣播通知\n\n` +
        `ℹ️ 使用網頁版啟用瀏覽器推送`,
      "Markdown",
    );
  }

  async handleSheetsCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `📊 *Google Sheets 匯出*\n\n` +
        `📋 支援功能：\n` +
        `• 估價單匯出為試算表\n` +
        `• 自動格式化\n` +
        `• 分類統計\n\n` +
        `ℹ️ 使用網頁版匯出估價單`,
      "Markdown",
    );
  }

  async handleBankingCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `🏦 *銀行整合服務*\n\n` +
        `📋 支援功能：\n` +
        `• 虛擬帳號產生\n` +
        `• 批次轉帳 (ACH)\n` +
        `• 帳戶餘額查詢\n` +
        `• 超商代收條碼\n\n` +
        `ℹ️ 使用網頁版管理銀行整合`,
      "Markdown",
    );
  }

  async handleContactsCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `📇 *Google Contacts 同步*\n\n` +
        `📋 支援功能：\n` +
        `• 客戶聯絡人同步\n` +
        `• 廠商聯絡人同步\n` +
        `• 更新同步/新增同步\n\n` +
        `ℹ️ 使用網頁版管理通訊錄同步`,
      "Markdown",
    );
  }

  async handleLineApiCommand(session: UserSession): Promise<void> {
    const isConfigured = this.lineApiService.isMessagingConfigured();
    await this.api.sendMessage(
      session.chatId,
      `📲 *LINE Messaging API*\n\n` +
        `📋 支援功能：\n` +
        `• 推播訊息\n` +
        `• 報價通知\n` +
        `• 簽核提醒\n` +
        `• 工期預警\n\n` +
        `🔌 狀態：${isConfigured ? "✅ 已設定" : "⚠️ 尚未設定"}\n\n` +
        `ℹ️ 使用網頁版設定 LINE API`,
      "Markdown",
    );
  }

  async handleNhiCommand(session: UserSession): Promise<void> {
    const rates = this.nhiApiService.getRates();
    await this.api.sendMessage(
      session.chatId,
      `🏥 *勞健保計算服務*\n\n` +
        `📋 支援功能：\n` +
        `• 勞保/健保費用計算\n` +
        `• 投保級距查詢\n` +
        `• 批次保費計算\n\n` +
        `📊 2024 費率：\n` +
        `• 勞保：${(rates.laborInsurance * 100).toFixed(0)}%\n` +
        `• 健保：${(rates.healthInsurance * 100).toFixed(2)}%\n` +
        `• 勞退：${(rates.laborPension * 100).toFixed(0)}%\n\n` +
        `ℹ️ 使用網頁版計算保費`,
      "Markdown",
    );
  }

  async handleGovDataCommand(session: UserSession): Promise<void> {
    await this.api.sendMessage(
      session.chatId,
      `🏛️ *政府公開資料查詢*\n\n` +
        `📋 支援功能：\n` +
        `• 公共工程標案查詢\n` +
        `• 建照執照查詢\n` +
        `• 公司登記查詢 (GCIS)\n` +
        `• 統一編號驗證\n\n` +
        `📡 資料來源：\n` +
        `• 公共工程委員會\n` +
        `• 內政部營建署\n` +
        `• 經濟部商業司\n\n` +
        `ℹ️ 使用網頁版查詢公開資料`,
      "Markdown",
    );
  }

}
