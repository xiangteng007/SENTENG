import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * 快取服務
 *
 * 提供統一的快取介面，支援：
 * - 記憶體快取 (開發環境)
 * - Redis 快取 (生產環境，待實作)
 *
 * 使用方式：
 * ```typescript
 * @Injectable()
 * export class VendorsService {
 *   constructor(private readonly cache: CacheService) {}
 *
 *   async findAll() {
 *     return this.cache.getOrSet('vendors:all', () => this.repo.find(), 600);
 *   }
 * }
 * ```
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly memoryCache = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = process.env.NODE_ENV === "production";
  }

  /**
   * 取得快取值，若不存在則執行 factory 並快取結果
   * @param key 快取鍵
   * @param factory 產生值的函數
   * @param ttlSeconds 存活時間（秒）
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * 取得快取值
   */
  async get<T>(key: string): Promise<T | null> {
    // Memory cache implementation
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        this.logger.debug(`Cache HIT: ${key}`);
        return entry.value as T;
      }
      this.memoryCache.delete(key);
    }
    this.logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * 設定快取值
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });
    this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * 刪除快取值
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.logger.debug(`Cache DELETE: ${key}`);
  }

  /**
   * 刪除符合模式的所有快取
   * @param pattern 鍵名前綴，如 'vendors:*'
   */
  async deleteByPattern(pattern: string): Promise<void> {
    const prefix = pattern.replace("*", "");
    let count = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    this.logger.debug(`Cache DELETE by pattern: ${pattern} (${count} keys)`);
  }

  /**
   * 清除所有快取
   */
  async clear(): Promise<void> {
    const count = this.memoryCache.size;
    this.memoryCache.clear();
    this.logger.log(`Cache CLEAR: ${count} keys removed`);
  }

  /**
   * 取得快取統計
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    };
  }
}
