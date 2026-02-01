/**
 * Weather Alert Service (天氣警報服務)
 *
 * 整合中央氣象署開放資料 API，自動抓取天氣警報並推播通知
 * API 文件: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import axios from "axios";
import { WeatherAlert, WeatherAlertType } from "./weather-alert.entity";
import { LineNotifyService } from "./line-notify.service";
import { EmailService } from "./email.service";

// CWA API Response Types
interface CwaHazardInfo {
  phenomena: string;
  significance: string;
  details?: string;
  startTime: string;
  endTime: string;
}

interface CwaHazardLocation {
  locationName: string;
  geocode: string;
  hazards?: CwaHazardInfo[];
}

interface CwaHazard {
  info: CwaHazardInfo;
  location: CwaHazardLocation[];
}

interface CwaApiResponse {
  success: string;
  records: {
    datasetInfo: {
      datasetDescription: string;
      issueTime: string;
      update: string;
    };
    hazards: CwaHazard[];
  };
}

export interface WeatherAlertConfig {
  enabled: boolean;
  apiKey: string;
  monitoredLocations: string[]; // 要監控的縣市
  notifyLine: boolean;
  notifyEmail: boolean;
  emailRecipients: string[];
}

@Injectable()
export class WeatherAlertService {
  private readonly logger = new Logger(WeatherAlertService.name);
  private readonly apiBaseUrl =
    "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
  private readonly config: WeatherAlertConfig;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(WeatherAlert)
    private readonly alertRepository: Repository<WeatherAlert>,
    private readonly lineNotifyService: LineNotifyService,
    private readonly emailService: EmailService,
  ) {
    this.config = {
      enabled: this.configService.get<boolean>("WEATHER_ALERT_ENABLED", false),
      apiKey: this.configService.get<string>("CWA_API_KEY", ""),
      monitoredLocations: this.configService
        .get<string>("WEATHER_ALERT_LOCATIONS", "台北市,新北市,桃園市")
        .split(",")
        .map((s) => s.trim()),
      notifyLine: this.configService.get<boolean>(
        "WEATHER_ALERT_LINE_NOTIFY",
        true,
      ),
      notifyEmail: this.configService.get<boolean>(
        "WEATHER_ALERT_EMAIL_NOTIFY",
        false,
      ),
      emailRecipients: this.configService
        .get<string>("WEATHER_ALERT_EMAIL_RECIPIENTS", "")
        .split(",")
        .filter((s) => s.trim()),
    };

    this.logger.log(
      `Weather Alert Service initialized. Enabled: ${this.config.enabled}, Locations: ${this.config.monitoredLocations.join(", ")}`,
    );
  }

  /**
   * 定時抓取天氣警報 (每 10 分鐘)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async fetchAndProcessAlerts(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.logger.log("Fetching weather alerts from CWA...");

    try {
      const alerts = await this.fetchWeatherAlerts();
      const relevantAlerts = this.filterRelevantAlerts(alerts);

      this.logger.log(
        `Found ${alerts.length} total alerts, ${relevantAlerts.length} relevant to monitored locations`,
      );

      for (const alert of relevantAlerts) {
        await this.processAlert(alert);
      }
    } catch (error) {
      this.logger.error("Failed to fetch weather alerts", error);
    }
  }

  /**
   * 從氣象署 API 抓取天氣特報
   */
  async fetchWeatherAlerts(): Promise<WeatherAlert[]> {
    if (!this.config.apiKey) {
      this.logger.warn("CWA API Key not configured");
      return [];
    }

    try {
      // W-C0033-001: 氣象特報 (大雨、豪雨、低溫、強風、濃霧)
      const response = await axios.get<CwaApiResponse>(
        `${this.apiBaseUrl}/W-C0033-001`,
        {
          params: {
            Authorization: this.config.apiKey,
            format: "JSON",
          },
          timeout: 30000,
        },
      );

      if (response.data.success !== "true") {
        this.logger.warn("CWA API returned unsuccessful response");
        return [];
      }

      return this.parseApiResponse(response.data);
    } catch (error) {
      this.logger.error("Error fetching from CWA API", error);
      throw error;
    }
  }

  /**
   * 解析 API 回應為 WeatherAlert 實體
   */
  private parseApiResponse(data: CwaApiResponse): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const issueTime = new Date(data.records.datasetInfo.issueTime);

    for (const hazard of data.records.hazards || []) {
      const info = hazard.info;

      for (const location of hazard.location || []) {
        const alert = new WeatherAlert();
        alert.alertId = `${info.phenomena}-${location.geocode}-${info.startTime}`;
        alert.type = this.mapPhenomenaToType(info.phenomena);
        alert.phenomena = info.phenomena;
        alert.significance = info.significance;
        alert.locationName = location.locationName;
        alert.geocode = location.geocode;
        alert.details = info.details || "";
        alert.startTime = info.startTime ? new Date(info.startTime) : undefined;
        alert.endTime = info.endTime ? new Date(info.endTime) : undefined;
        alert.issueTime = issueTime;
        alert.notificationSent = false;

        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * 將氣象署現象名稱對應到列舉類型
   */
  private mapPhenomenaToType(phenomena: string): WeatherAlertType {
    const mapping: Record<string, WeatherAlertType> = {
      大雨: WeatherAlertType.HEAVY_RAIN,
      豪雨: WeatherAlertType.TORRENTIAL_RAIN,
      超大豪雨: WeatherAlertType.TORRENTIAL_RAIN,
      颱風: WeatherAlertType.TYPHOON,
      低溫: WeatherAlertType.LOW_TEMPERATURE,
      強風: WeatherAlertType.STRONG_WIND,
      濃霧: WeatherAlertType.FOG,
      高溫: WeatherAlertType.HIGH_TEMPERATURE,
    };

    return mapping[phenomena] || WeatherAlertType.OTHER;
  }

  /**
   * 過濾出與監控縣市相關的警報
   */
  private filterRelevantAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
    return alerts.filter((alert) =>
      this.config.monitoredLocations.some(
        (loc) =>
          alert.locationName.includes(loc) || loc.includes(alert.locationName),
      ),
    );
  }

  /**
   * 處理單一警報：檢查是否已發送，若未發送則發送通知
   */
  private async processAlert(alert: WeatherAlert): Promise<void> {
    // 檢查是否已存在
    const existing = await this.alertRepository.findOne({
      where: { alertId: alert.alertId },
    });

    if (existing) {
      this.logger.debug(`Alert ${alert.alertId} already processed, skipping`);
      return;
    }

    // 儲存警報記錄
    const savedAlert = await this.alertRepository.save(alert);

    // 發送通知
    await this.sendNotifications(savedAlert);
  }

  /**
   * 發送通知到各管道
   */
  private async sendNotifications(alert: WeatherAlert): Promise<void> {
    const sentChannels: string[] = [];
    let sendError: string | undefined = undefined;

    const message = this.formatAlertMessage(alert);

    // LINE 通知
    if (this.config.notifyLine) {
      try {
        const success = await this.lineNotifyService.broadcast(message);
        if (success) {
          sentChannels.push("LINE");
          this.logger.log(`Sent LINE notification for alert: ${alert.alertId}`);
        }
      } catch (error: any) {
        this.logger.error("Failed to send LINE notification", error);
        sendError = `LINE: ${error?.message || error}`;
      }
    }

    // Email 通知
    if (this.config.notifyEmail && this.config.emailRecipients.length > 0) {
      try {
        for (const recipient of this.config.emailRecipients) {
          await this.emailService.send({
            to: recipient,
            subject: `⚠️ 氣象警報：${alert.phenomena}特報 - ${alert.locationName}`,
            html: this.formatAlertEmailHtml(alert),
          });
        }
        sentChannels.push("EMAIL");
        this.logger.log(`Sent Email notification for alert: ${alert.alertId}`);
      } catch (error: any) {
        this.logger.error("Failed to send Email notification", error);
        sendError = sendError
          ? `${sendError}; EMAIL: ${error?.message || error}`
          : `EMAIL: ${error?.message || error}`;
      }
    }

    // 更新警報記錄
    await this.alertRepository.update(alert.id, {
      notificationSent: sentChannels.length > 0,
      sentAt: new Date(),
      sentChannels,
      sendError,
    });
  }

  /**
   * 格式化警報訊息 (LINE)
   */
  private formatAlertMessage(alert: WeatherAlert): string {
    const emoji = this.getAlertEmoji(alert.type);
    const endTimeStr = alert.endTime
      ? `至 ${alert.endTime.toLocaleString("zh-TW")}`
      : "";

    return `${emoji} 氣象${alert.significance || "特報"}

📍 地區：${alert.locationName}
⚡ 類型：${alert.phenomena}
🕐 時間：${alert.startTime?.toLocaleString("zh-TW") || "立即生效"} ${endTimeStr}

📝 ${alert.details || "請注意氣象變化，做好防範措施。"}

資料來源：中央氣象署`;
  }

  /**
   * 格式化警報 Email HTML
   */
  private formatAlertEmailHtml(alert: WeatherAlert): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">⚠️ 氣象${alert.significance || "特報"}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>地區</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${alert.locationName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>類型</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${alert.phenomena}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>開始時間</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${alert.startTime?.toLocaleString("zh-TW") || "立即生效"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>結束時間</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${alert.endTime?.toLocaleString("zh-TW") || "待定"}</td>
          </tr>
        </table>
        <p style="margin-top: 16px; padding: 12px; background: #fff3e0; border-radius: 4px;">
          ${alert.details || "請注意氣象變化，做好防範措施。"}
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          資料來源：中央氣象署
        </p>
      </div>
    `;
  }

  /**
   * 取得警報類型對應的 Emoji
   */
  private getAlertEmoji(type: WeatherAlertType): string {
    const emojiMap: Record<WeatherAlertType, string> = {
      [WeatherAlertType.HEAVY_RAIN]: "🌧️",
      [WeatherAlertType.TORRENTIAL_RAIN]: "⛈️",
      [WeatherAlertType.TYPHOON]: "🌀",
      [WeatherAlertType.LOW_TEMPERATURE]: "🥶",
      [WeatherAlertType.STRONG_WIND]: "💨",
      [WeatherAlertType.FOG]: "🌫️",
      [WeatherAlertType.HIGH_TEMPERATURE]: "🔥",
      [WeatherAlertType.OTHER]: "⚠️",
    };
    return emojiMap[type] || "⚠️";
  }

  /**
   * 手動觸發測試 (用於 API endpoint)
   */
  async testFetchAlerts(): Promise<{
    success: boolean;
    alertCount: number;
    alerts: WeatherAlert[];
    error?: string;
  }> {
    try {
      const alerts = await this.fetchWeatherAlerts();
      const relevantAlerts = this.filterRelevantAlerts(alerts);

      return {
        success: true,
        alertCount: relevantAlerts.length,
        alerts: relevantAlerts,
      };
    } catch (error: any) {
      return {
        success: false,
        alertCount: 0,
        alerts: [],
        error: error?.message || String(error),
      };
    }
  }
}
