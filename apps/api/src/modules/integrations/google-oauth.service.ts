/**
 * google-oauth.service.ts
 *
 * Google OAuth 授權管理服務（正式實作）
 * 處理 token 取得、存取、更新、撤銷
 * 使用 google-auth-library 進行實際 API 呼叫
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { GoogleOAuthAccount } from './entities/google-oauth-account.entity';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts';
const USERINFO_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'; // For site photos

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private oauth2Client: OAuth2Client;

  constructor(
    @InjectRepository(GoogleOAuthAccount)
    private readonly oauthRepo: Repository<GoogleOAuthAccount>,
    private readonly configService: ConfigService
  ) {
    // 初始化 OAuth2 Client
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3000/api/v1/integrations/google/callback';

    this.logger.log(`Initializing OAuth2Client with redirect_uri: ${redirectUri}`);
    this.oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  /**
   * 取得授權 URL
   */
  getAuthUrl(userId: string): string {
    const scopes = [CALENDAR_SCOPE, CONTACTS_SCOPE, USERINFO_EMAIL_SCOPE, DRIVE_SCOPE];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId,
    });

    return authUrl;
  }
  /**
   * 處理 OAuth callback，交換 token
   */
  async handleCallback(code: string, userId: string): Promise<GoogleOAuthAccount> {
    this.logger.log(`OAuth callback received for user ${userId}`);

    // Log the redirect_uri being used for debugging
    const redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3000/api/v1/integrations/google/callback';
    this.logger.log(`Using redirect_uri for token exchange: ${redirectUri}`);

    try {
      // 使用 authorization code 交換 tokens
      // 創建新的 OAuth2Client 確保使用正確的 redirect_uri
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const tokenClient = new OAuth2Client(clientId, clientSecret, redirectUri);

      this.logger.log(`Token exchange using client with redirect_uri: ${redirectUri}`);
      const { tokens } = await tokenClient.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // 取得用戶 email
      const userInfo = await this.getUserInfo(tokens);
      const googleEmail = userInfo.email || `unknown_${userId}@gmail.com`;

      // 檢查是否已有授權
      let account = await this.oauthRepo.findOne({ where: { userId } });

      if (account) {
        // 更新現有授權
        account.accessToken = tokens.access_token || '';
        account.refreshToken = tokens.refresh_token || account.refreshToken; // 保留舊的 refresh token 如果沒有新的
        account.tokenExpiresAt = tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : new Date(Date.now() + 3600 * 1000);
        account.googleAccountEmail = googleEmail;
        account.scopes = [CALENDAR_SCOPE, CONTACTS_SCOPE, DRIVE_SCOPE];
        account.isActive = true;
      } else {
        // 建立新授權
        account = this.oauthRepo.create({
          userId,
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || '',
          tokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
          googleAccountEmail: googleEmail,
          scopes: [CALENDAR_SCOPE, CONTACTS_SCOPE, DRIVE_SCOPE],
          calendarId: 'primary',
          contactsLabel: 'Senteng ERP',
          autoSyncEvents: true,
          autoSyncContacts: true,
          isActive: true,
        });
      }

      this.logger.log(`Successfully connected Google account: ${googleEmail} for user ${userId}`);
      return this.oauthRepo.save(account);
    } catch (error: any) {
      // Enhanced error logging for debugging
      this.logger.error(`Failed to exchange token: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`Google API error details: ${JSON.stringify(error.response.data)}`);
      }
      if (error.code) {
        this.logger.error(`Error code: ${error.code}`);
      }
      throw new UnauthorizedException(`Google 授權失敗: ${error.message}`);
    }
  }

  /**
   * 取得用戶資訊（email）
   */
  private async getUserInfo(tokens: Credentials): Promise<{ email?: string }> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      this.logger.warn(`Failed to get user info: ${error.message}`);
      return {};
    }
  }

  /**
   * 取得用戶的 Google 授權
   */
  async getAccountByUserId(userId: string): Promise<GoogleOAuthAccount | null> {
    return this.oauthRepo.findOne({ where: { userId, isActive: true } });
  }

  /**
   * 取得有效的 access token（自動 refresh）
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const account = await this.getAccountByUserId(userId);
    if (!account) {
      throw new UnauthorizedException('Google 帳號未連結');
    }

    // 檢查 token 是否過期（提前 5 分鐘判斷）
    const now = new Date();
    const expiresAt = account.tokenExpiresAt;
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (expiresAt && expiresAt.getTime() - bufferMs < now.getTime()) {
      // Token 即將或已過期，需要 refresh
      return this.refreshAccessToken(account);
    }

    return account.accessToken;
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(account: GoogleOAuthAccount): Promise<string> {
    if (!account.refreshToken) {
      throw new UnauthorizedException('沒有 refresh token，請重新授權');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: account.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // 更新 account
      account.accessToken = credentials.access_token || '';
      account.tokenExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await this.oauthRepo.save(account);

      this.logger.log(`Token refreshed for user ${account.userId}`);
      return account.accessToken;
    } catch (error: any) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      // 標記帳號為非活躍
      account.isActive = false;
      account.lastSyncError = `Token refresh failed: ${error.message}`;
      await this.oauthRepo.save(account);
      throw new UnauthorizedException('Token 更新失敗，請重新授權');
    }
  }

  /**
   * 取得設定好的 OAuth2Client（用於 API 呼叫）
   */
  async getOAuth2Client(userId: string): Promise<OAuth2Client> {
    const accessToken = await this.getValidAccessToken(userId);
    const account = await this.getAccountByUserId(userId);

    if (!account) {
      throw new UnauthorizedException('Google 帳號未連結');
    }

    const client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET')
    );

    client.setCredentials({
      access_token: accessToken,
      refresh_token: account.refreshToken,
    });

    return client;
  }

  /**
   * 更新同步設定
   */
  async updateConfig(
    userId: string,
    config: {
      calendarId?: string;
      contactsLabel?: string;
      autoSyncEvents?: boolean;
      autoSyncContacts?: boolean;
    }
  ): Promise<GoogleOAuthAccount> {
    const account = await this.getAccountByUserId(userId);
    if (!account) {
      throw new UnauthorizedException('Google 帳號未連結');
    }

    if (config.calendarId !== undefined) {
      account.calendarId = config.calendarId;
    }
    if (config.contactsLabel !== undefined) {
      account.contactsLabel = config.contactsLabel;
    }
    if (config.autoSyncEvents !== undefined) {
      account.autoSyncEvents = config.autoSyncEvents;
    }
    if (config.autoSyncContacts !== undefined) {
      account.autoSyncContacts = config.autoSyncContacts;
    }

    return this.oauthRepo.save(account);
  }

  /**
   * 撤銷授權
   */
  async disconnect(userId: string): Promise<void> {
    const account = await this.getAccountByUserId(userId);
    if (!account) {
      return;
    }

    try {
      // 撤銷 Google token
      if (account.accessToken) {
        await this.oauth2Client.revokeToken(account.accessToken);
        this.logger.log(`Token revoked for user ${userId}`);
      }
    } catch (error: any) {
      // 即使撤銷失敗也繼續標記為非活躍
      this.logger.warn(`Token revocation failed: ${error.message}`);
    }

    // 標記為非活躍
    account.isActive = false;
    await this.oauthRepo.save(account);
    this.logger.log(`Disconnected Google account for user ${userId}`);
  }

  /**
   * 更新最後同步時間
   */
  async updateLastSync(userId: string, error?: string): Promise<void> {
    const account = await this.getAccountByUserId(userId);
    if (account) {
      account.lastSyncedAt = new Date();
      account.lastSyncError = error || '';
      await this.oauthRepo.save(account);
    }
  }
}
