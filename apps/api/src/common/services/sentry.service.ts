import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Sentry APM 整合服務
 *
 * 提供應用程式效能監控與錯誤追蹤
 */

export interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
}

export interface TransactionContext {
  name: string;
  op: string;
  description?: string;
  data?: Record<string, unknown>;
}

export interface ErrorContext {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private readonly config: SentryConfig;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      dsn: this.configService.get<string>('SENTRY_DSN') || '',
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      release: this.configService.get<string>('APP_VERSION') || '1.0.0',
      tracesSampleRate: parseFloat(
        this.configService.get<string>('SENTRY_TRACES_SAMPLE_RATE') || '0.1'
      ),
      profilesSampleRate: parseFloat(
        this.configService.get<string>('SENTRY_PROFILES_SAMPLE_RATE') || '0.1'
      ),
    };
  }

  async onModuleInit(): Promise<void> {
    if (!this.config.dsn) {
      this.logger.warn('SENTRY_DSN not configured. Error tracking disabled.');
      return;
    }

    try {
      // Dynamic import to avoid issues when Sentry is not installed
      const Sentry = await import('@sentry/node');

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate,
        profilesSampleRate: this.config.profilesSampleRate,
        integrations: [],
      });

      this.initialized = true;
      this.logger.log(`Sentry initialized: ${this.config.environment} (${this.config.release})`);
    } catch (error) {
      this.logger.warn('Sentry SDK not installed. Run: npm install @sentry/node');
    }
  }

  /**
   * 捕獲錯誤
   */
  async captureException(error: Error, context?: ErrorContext): Promise<string | null> {
    if (!this.initialized) {
      this.logger.error(`[Local] ${error.message}`, error.stack);
      return null;
    }

    try {
      const Sentry = await import('@sentry/node');

      Sentry.withScope(scope => {
        if (context?.user) {
          scope.setUser(context.user);
        }
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        if (context?.level) {
          scope.setLevel(context.level);
        }
      });

      const eventId = Sentry.captureException(error);
      return eventId;
    } catch {
      return null;
    }
  }

  /**
   * 捕獲訊息
   */
  async captureMessage(
    message: string,
    level: ErrorContext['level'] = 'info'
  ): Promise<string | null> {
    if (!this.initialized) {
      this.logger.log(`[Local] ${message}`);
      return null;
    }

    try {
      const Sentry = await import('@sentry/node');
      return Sentry.captureMessage(message, level);
    } catch {
      return null;
    }
  }

  /**
   * 開始效能追蹤 Transaction
   */
  async startTransaction(context: TransactionContext): Promise<unknown> {
    if (!this.initialized) {
      return { finish: () => {} };
    }

    try {
      const Sentry = await import('@sentry/node');
      return Sentry.startSpan(
        {
          name: context.name,
          op: context.op,
        },
        () => {}
      );
    } catch {
      return { finish: () => {} };
    }
  }

  /**
   * 設定使用者資訊
   */
  async setUser(user: { id: string; email?: string; username?: string }): Promise<void> {
    if (!this.initialized) return;

    try {
      const Sentry = await import('@sentry/node');
      Sentry.setUser(user);
    } catch {
      // ignore
    }
  }

  /**
   * 清除使用者資訊
   */
  async clearUser(): Promise<void> {
    if (!this.initialized) return;

    try {
      const Sentry = await import('@sentry/node');
      Sentry.setUser(null);
    } catch {
      // ignore
    }
  }

  /**
   * 新增麵包屑 (Breadcrumb)
   */
  async addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    data?: Record<string, unknown>;
  }): Promise<void> {
    if (!this.initialized) return;

    try {
      const Sentry = await import('@sentry/node');
      Sentry.addBreadcrumb({
        ...breadcrumb,
        timestamp: Date.now() / 1000,
      });
    } catch {
      // ignore
    }
  }

  /**
   * 取得目前狀態
   */
  getStatus(): { initialized: boolean; config: Partial<SentryConfig> } {
    return {
      initialized: this.initialized,
      config: {
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate,
      },
    };
  }
}
