import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * 天氣 API 服務
 *
 * 提供工程施工天氣影響預測功能
 *
 * 資料來源: 中央氣象署開放資料平台
 * API 文件: https://opendata.cwa.gov.tw/devManual
 *
 * 支援功能：
 * - 36小時天氣預報
 * - 降雨機率查詢
 * - 施工安全建議
 * - 工期影響評估
 */

export interface WeatherForecast {
  locationName: string;
  startTime: string;
  endTime: string;
  weather: string;
  weatherCode: string;
  rainProbability: number;
  minTemperature: number;
  maxTemperature: number;
  comfort: string;
  windSpeed?: string;
}

export interface ConstructionWeatherAdvice {
  date: string;
  canWork: boolean;
  riskLevel: "low" | "medium" | "high";
  reason: string;
  recommendations: string[];
  affectedTasks: string[];
}

export interface WeatherImpactAssessment {
  location: string;
  period: string;
  workableDays: number;
  riskyDays: number;
  nonWorkableDays: number;
  recommendations: string[];
  forecasts: WeatherForecast[];
  advice: ConstructionWeatherAdvice[];
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly apiHost =
    "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("CWA_API_KEY") || "";
  }

  /**
   * 檢查 API 是否已設定
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * 取得 36 小時天氣預報
   */
  async getForecast36Hours(locationName: string): Promise<WeatherForecast[]> {
    if (!this.isConfigured()) {
      this.logger.warn("CWA API key not configured, returning mock data");
      return this.getMockForecast(locationName);
    }

    try {
      // F-C0032-001: 一般縣市36小時天氣預報
      const url = `${this.apiHost}/F-C0032-001?Authorization=${this.apiKey}&locationName=${encodeURIComponent(locationName)}&format=JSON`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success !== "true") {
        this.logger.error(`CWA API error: ${data.message}`);
        return this.getMockForecast(locationName);
      }

      return this.parseForecasts(data, locationName);
    } catch (error) {
      this.logger.error(`Weather API error: ${error}`);
      return this.getMockForecast(locationName);
    }
  }

  /**
   * 解析天氣預報資料
   */
  private parseForecasts(
    data: Record<string, unknown>,
    locationName: string,
  ): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];

    try {
      const records = data["records"] as Record<string, unknown> | undefined;
      const locations = (records?.["location"] as unknown[]) || [];
      const location = locations.find(
        (loc: unknown) =>
          (loc as Record<string, string>).locationName === locationName,
      ) as Record<string, unknown> | undefined;

      if (!location) {
        return this.getMockForecast(locationName);
      }

      const weatherElements = (location["weatherElement"] as unknown[]) || [];

      // 取得各氣象要素
      const wxElement = weatherElements.find(
        (el: unknown) => (el as Record<string, string>).elementName === "Wx",
      ) as Record<string, unknown> | undefined;
      const popElement = weatherElements.find(
        (el: unknown) => (el as Record<string, string>).elementName === "PoP",
      ) as Record<string, unknown> | undefined;
      const minTElement = weatherElements.find(
        (el: unknown) => (el as Record<string, string>).elementName === "MinT",
      ) as Record<string, unknown> | undefined;
      const maxTElement = weatherElements.find(
        (el: unknown) => (el as Record<string, string>).elementName === "MaxT",
      ) as Record<string, unknown> | undefined;
      const ciElement = weatherElements.find(
        (el: unknown) => (el as Record<string, string>).elementName === "CI",
      ) as Record<string, unknown> | undefined;

      const wxTimes = (wxElement?.["time"] as unknown[]) || [];

      for (let i = 0; i < wxTimes.length; i++) {
        const time = wxTimes[i] as Record<string, unknown>;
        const wxParam = (time["parameter"] as Record<string, string>) || {};

        const popTimes = (popElement?.["time"] as unknown[]) || [];
        const popParam =
          ((popTimes[i] as Record<string, unknown>)?.["parameter"] as Record<
            string,
            string
          >) || {};

        const minTTimes = (minTElement?.["time"] as unknown[]) || [];
        const minTParam =
          ((minTTimes[i] as Record<string, unknown>)?.["parameter"] as Record<
            string,
            string
          >) || {};

        const maxTTimes = (maxTElement?.["time"] as unknown[]) || [];
        const maxTParam =
          ((maxTTimes[i] as Record<string, unknown>)?.["parameter"] as Record<
            string,
            string
          >) || {};

        const ciTimes = (ciElement?.["time"] as unknown[]) || [];
        const ciParam =
          ((ciTimes[i] as Record<string, unknown>)?.["parameter"] as Record<
            string,
            string
          >) || {};

        forecasts.push({
          locationName,
          startTime: (time["startTime"] as string) || "",
          endTime: (time["endTime"] as string) || "",
          weather: wxParam["parameterName"] || "",
          weatherCode: wxParam["parameterValue"] || "",
          rainProbability: parseInt(popParam["parameterName"] || "0", 10),
          minTemperature: parseInt(minTParam["parameterName"] || "0", 10),
          maxTemperature: parseInt(maxTParam["parameterName"] || "0", 10),
          comfort: ciParam["parameterName"] || "",
        });
      }
    } catch (e) {
      this.logger.error(`Parse error: ${e}`);
    }

    return forecasts;
  }

  /**
   * 產生施工建議
   */
  analyzeConstructionImpact(
    forecasts: WeatherForecast[],
  ): ConstructionWeatherAdvice[] {
    return forecasts.map((f) => {
      const rainRisk = f.rainProbability >= 70;
      const heatRisk = f.maxTemperature >= 35;
      const coldRisk = f.minTemperature <= 5;
      const stormRisk = f.weather.includes("雷") || f.weather.includes("大雨");

      let canWork = true;
      let riskLevel: "low" | "medium" | "high" = "low";
      const reasons: string[] = [];
      const recommendations: string[] = [];
      const affectedTasks: string[] = [];

      if (stormRisk) {
        canWork = false;
        riskLevel = "high";
        reasons.push(`雷雨天氣 (${f.weather})`);
        recommendations.push("所有戶外作業應暫停");
        recommendations.push("確保工地物料覆蓋防水");
        affectedTasks.push("所有戶外工程", "吊掛作業", "鷹架工程");
      } else if (rainRisk) {
        riskLevel = "high";
        reasons.push(`高降雨機率 (${f.rainProbability}%)`);
        recommendations.push("避免混凝土澆置");
        recommendations.push("停止油漆粉刷作業");
        affectedTasks.push("混凝土工程", "油漆工程", "防水工程");
      } else if (f.rainProbability >= 50) {
        riskLevel = "medium";
        reasons.push(`中度降雨機率 (${f.rainProbability}%)`);
        recommendations.push("備妥防雨措施");
      }

      if (heatRisk) {
        riskLevel = riskLevel === "low" ? "medium" : riskLevel;
        reasons.push(`高溫 (${f.maxTemperature}°C)`);
        recommendations.push("增加休息時間，避免中午作業");
        recommendations.push("準備充足飲用水與遮陽設施");
        affectedTasks.push("戶外工程");
      }

      if (coldRisk) {
        riskLevel = riskLevel === "low" ? "medium" : riskLevel;
        reasons.push(`低溫 (${f.minTemperature}°C)`);
        recommendations.push("混凝土養護需加強保溫");
        recommendations.push("油漆施作需注意固化時間");
        affectedTasks.push("混凝土工程", "油漆工程");
      }

      if (reasons.length === 0) {
        reasons.push("天氣適合施工");
        recommendations.push("正常作業");
      }

      return {
        date: f.startTime.split("T")[0],
        canWork,
        riskLevel,
        reason: reasons.join("; "),
        recommendations: [...new Set(recommendations)],
        affectedTasks: [...new Set(affectedTasks)],
      };
    });
  }

  /**
   * 完整工期影響評估
   */
  async assessWeatherImpact(
    locationName: string,
  ): Promise<WeatherImpactAssessment> {
    const forecasts = await this.getForecast36Hours(locationName);
    const advice = this.analyzeConstructionImpact(forecasts);

    const workableDays = advice.filter(
      (a) => a.canWork && a.riskLevel === "low",
    ).length;
    const riskyDays = advice.filter((a) => a.riskLevel === "medium").length;
    const nonWorkableDays = advice.filter((a) => !a.canWork).length;

    const recommendations: string[] = [];
    if (nonWorkableDays > 0) {
      recommendations.push(
        `未來有 ${nonWorkableDays} 天不宜施工，建議調整工期`,
      );
    }
    if (riskyDays > 0) {
      recommendations.push(`${riskyDays} 天需注意氣候風險`);
    }

    return {
      location: locationName,
      period:
        forecasts.length > 0
          ? `${forecasts[0].startTime} ~ ${forecasts[forecasts.length - 1].endTime}`
          : "",
      workableDays,
      riskyDays,
      nonWorkableDays,
      recommendations,
      forecasts,
      advice,
    };
  }

  /**
   * Mock 資料 (API 未設定時使用)
   */
  private getMockForecast(locationName: string): WeatherForecast[] {
    const now = new Date();
    return [
      {
        locationName,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 12 * 3600000).toISOString(),
        weather: "多雲",
        weatherCode: "04",
        rainProbability: 20,
        minTemperature: 18,
        maxTemperature: 26,
        comfort: "舒適",
      },
      {
        locationName,
        startTime: new Date(now.getTime() + 12 * 3600000).toISOString(),
        endTime: new Date(now.getTime() + 24 * 3600000).toISOString(),
        weather: "陰時多雲",
        weatherCode: "05",
        rainProbability: 40,
        minTemperature: 17,
        maxTemperature: 23,
        comfort: "舒適",
      },
      {
        locationName,
        startTime: new Date(now.getTime() + 24 * 3600000).toISOString(),
        endTime: new Date(now.getTime() + 36 * 3600000).toISOString(),
        weather: "短暫陣雨",
        weatherCode: "08",
        rainProbability: 70,
        minTemperature: 16,
        maxTemperature: 21,
        comfort: "舒適至悶熱",
      },
    ];
  }
}
