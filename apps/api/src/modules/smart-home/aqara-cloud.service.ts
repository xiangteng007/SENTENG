import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Aqara Cloud API 服務
 *
 * 提供智慧家居設備即時狀態監控與控制功能
 *
 * API 文件: https://developer.aqara.com/documents/v2/api-guide.html
 *
 * 支援功能：
 * - 設備列表查詢
 * - 設備狀態監控
 * - 設備控制指令
 * - 場景執行
 *
 * 身份驗證: OAuth 2.0 (需要用戶授權)
 */

export interface AqaraCloudConfig {
  appId: string;
  appKey: string;
  keyId: string;
  apiHost: string;
}

export interface AqaraDevice {
  did: string;
  parentDid?: string;
  positionId: string;
  model: string;
  modelType: number;
  state: number;
  firmwareVersion: string;
  deviceName: string;
  createTime: number;
  updateTime: number;
  isOnline: boolean;
}

export interface AqaraDeviceStatus {
  did: string;
  resourceId: string;
  value: string;
  timeStamp: number;
}

export interface AqaraScene {
  sceneId: string;
  name: string;
  isExecutable: boolean;
}

export interface AqaraApiResponse<T> {
  code: number;
  message: string;
  result?: T;
  requestId: string;
}

@Injectable()
export class AqaraCloudService {
  private readonly logger = new Logger(AqaraCloudService.name);
  private readonly config: AqaraCloudConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      appId: this.configService.get<string>("AQARA_APP_ID") || "",
      appKey: this.configService.get<string>("AQARA_APP_KEY") || "",
      keyId: this.configService.get<string>("AQARA_KEY_ID") || "",
      apiHost:
        this.configService.get<string>("AQARA_API_HOST") ||
        "https://open-cn.aqara.com/v3.0/open/api",
    };
  }

  /**
   * 檢查 API 設定是否存在
   */
  isConfigured(): boolean {
    return !!(this.config.appId && this.config.appKey && this.config.keyId);
  }

  /**
   * 產生請求簽名 (HMAC-SHA256)
   */
  private generateSign(
    nonce: string,
    timestamp: string,
    accessToken?: string,
  ): string {
    const crypto = require("crypto");
    const signStr = accessToken
      ? `Accesstoken=${accessToken}&Appid=${this.config.appId}&Keyid=${this.config.keyId}&Nonce=${nonce}&Time=${timestamp}`
      : `Appid=${this.config.appId}&Keyid=${this.config.keyId}&Nonce=${nonce}&Time=${timestamp}`;

    return crypto
      .createHmac("sha256", this.config.appKey.toLowerCase())
      .update(signStr.toLowerCase())
      .digest("hex")
      .toLowerCase();
  }

  /**
   * 發送 API 請求
   */
  private async request<T>(
    intent: string,
    data: Record<string, unknown> = {},
    requiresToken = true,
  ): Promise<AqaraApiResponse<T>> {
    if (!this.isConfigured()) {
      return {
        code: -1,
        message: "Aqara Cloud API not configured",
        requestId: "local",
      };
    }

    if (requiresToken && !this.accessToken) {
      return {
        code: -2,
        message: "Access token required. Call authorize() first.",
        requestId: "local",
      };
    }

    const nonce = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString();
    const sign = this.generateSign(
      nonce,
      timestamp,
      requiresToken ? this.accessToken || undefined : undefined,
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Appid: this.config.appId,
      Keyid: this.config.keyId,
      Nonce: nonce,
      Time: timestamp,
      Sign: sign,
    };

    if (requiresToken && this.accessToken) {
      headers.Accesstoken = this.accessToken;
    }

    try {
      const response = await fetch(this.config.apiHost, {
        method: "POST",
        headers,
        body: JSON.stringify({ intent, data }),
      });

      const result = (await response.json()) as AqaraApiResponse<T>;
      this.logger.debug(`Aqara API ${intent}: ${result.code}`);
      return result;
    } catch (error) {
      this.logger.error(`Aqara API error: ${error}`);
      return {
        code: -100,
        message: String(error),
        requestId: "error",
      };
    }
  }

  /**
   * 使用授權碼取得 Access Token
   */
  async authorize(authCode: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } | null> {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>(
      "config.auth.getToken",
      {
        authCode,
        accountType: 0,
      },
      false,
    );

    if (response.code === 0 && response.result) {
      this.accessToken = response.result.accessToken;
      this.tokenExpiresAt = Date.now() + response.result.expiresIn * 1000;
      return response.result;
    }

    this.logger.error(`Authorization failed: ${response.message}`);
    return null;
  }

  /**
   * 設定 Access Token (從資料庫恢復時使用)
   */
  setAccessToken(token: string, expiresAt: number): void {
    this.accessToken = token;
    this.tokenExpiresAt = expiresAt;
  }

  /**
   * 取得設備列表
   */
  async getDevices(positionId?: string): Promise<AqaraDevice[]> {
    const data: Record<string, unknown> = {};
    if (positionId) {
      data.positionId = positionId;
    }

    const response = await this.request<{ data: AqaraDevice[] }>(
      "query.device.info",
      data,
    );

    if (response.code === 0 && response.result) {
      return response.result.data || [];
    }

    this.logger.warn(`Failed to get devices: ${response.message}`);
    return [];
  }

  /**
   * 取得設備狀態
   */
  async getDeviceStatus(deviceId: string): Promise<AqaraDeviceStatus[]> {
    const response = await this.request<{ data: AqaraDeviceStatus[] }>(
      "query.resource.value",
      {
        resources: [{ did: deviceId }],
      },
    );

    if (response.code === 0 && response.result) {
      return response.result.data || [];
    }

    this.logger.warn(`Failed to get device status: ${response.message}`);
    return [];
  }

  /**
   * 控制設備
   */
  async controlDevice(
    deviceId: string,
    resourceId: string,
    value: string,
  ): Promise<boolean> {
    const response = await this.request<unknown>("write.resource.device", {
      data: [
        {
          did: deviceId,
          attrs: [{ res_id: resourceId, value }],
        },
      ],
    });

    if (response.code === 0) {
      this.logger.log(`Device ${deviceId} controlled: ${resourceId}=${value}`);
      return true;
    }

    this.logger.error(`Control failed: ${response.message}`);
    return false;
  }

  /**
   * 取得場景列表
   */
  async getScenes(positionId?: string): Promise<AqaraScene[]> {
    const data: Record<string, unknown> = {};
    if (positionId) {
      data.positionId = positionId;
    }

    const response = await this.request<{ data: AqaraScene[] }>(
      "query.scene.info",
      data,
    );

    if (response.code === 0 && response.result) {
      return response.result.data || [];
    }

    return [];
  }

  /**
   * 執行場景
   */
  async runScene(sceneId: string): Promise<boolean> {
    const response = await this.request<unknown>("config.scene.run", {
      sceneId,
    });

    if (response.code === 0) {
      this.logger.log(`Scene ${sceneId} executed`);
      return true;
    }

    this.logger.error(`Scene execution failed: ${response.message}`);
    return false;
  }

  /**
   * 監控總覽 - 取得所有設備狀態摘要
   */
  async getMonitoringSummary(): Promise<{
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    devicesByType: Record<string, number>;
  }> {
    const devices = await this.getDevices();
    const summary = {
      totalDevices: devices.length,
      onlineDevices: 0,
      offlineDevices: 0,
      devicesByType: {} as Record<string, number>,
    };

    for (const device of devices) {
      if (device.isOnline) {
        summary.onlineDevices++;
      } else {
        summary.offlineDevices++;
      }

      const modelType = device.model.split(".")[0] || "unknown";
      summary.devicesByType[modelType] =
        (summary.devicesByType[modelType] || 0) + 1;
    }

    return summary;
  }
}
