import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 快取服務
 *
 * 提供 Redis/Memory 快取抽象層，優化 API 回應時間
 *
 * 支援功能：
 * - 鍵值快取 (get/set/del)
 * - TTL 過期設定
 * - 快取失效策略
 * - 批次操作
 *
 * @note POC 版本使用 Memory 快取
 *       正式環境應安裝: npm install ioredis
 */

export interface CacheConfig {
  type: 'memory' | 'redis';
  redisUrl?: string;
  defaultTtl: number;
  maxMemoryItems: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly config: CacheConfig;
  private readonly memoryCache = new Map<string, { value: unknown; expiresAt: number }>();
  private stats = { hits: 0, misses: 0 };

  constructor(private readonly configService: ConfigService) {
    this.config = {
      type: (this.configService.get<string>('CACHE_TYPE') as 'memory' | 'redis') || 'memory',
      redisUrl: this.configService.get<string>('REDIS_URL'),
      defaultTtl: this.configService.get<number>('CACHE_TTL') || 300, // 5 minutes
      maxMemoryItems: this.configService.get<number>('CACHE_MAX_ITEMS') || 1000,
    };

    this.logger.log(`Cache service initialized: ${this.config.type}`);
  }

  /**
   * 取得快取值
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * 設定快取值
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    // 檢查是否需要淘汰舊項目
    if (this.memoryCache.size >= this.config.maxMemoryItems) {
      this.evictOldest();
    }

    const ttl = ttlSeconds ?? this.config.defaultTtl;
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /**
   * 刪除快取
   */
  async del(key: string): Promise<boolean> {
    return this.memoryCache.delete(key);
  }

  /**
   * 刪除符合模式的快取 (prefix matching)
   */
  async delByPattern(pattern: string): Promise<number> {
    let deleted = 0;
    const prefix = pattern.replace('*', '');

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        deleted++;
      }
    }

    this.logger.debug(`Deleted ${deleted} keys matching ${pattern}`);
    return deleted;
  }

  /**
   * 檢查快取是否存在
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 取得或設定 (Cache-Aside Pattern)
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * 批次取得
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /**
   * 批次設定
   */
  async mset(entries: { key: string; value: unknown; ttl?: number }[]): Promise<void> {
    await Promise.all(entries.map(entry => this.set(entry.key, entry.value, entry.ttl)));
  }

  /**
   * 清除所有快取
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.stats = { hits: 0, misses: 0 };
    this.logger.log('Cache cleared');
  }

  /**
   * 取得快取統計
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.memoryCache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * 淘汰最舊的項目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }
}

/**
 * 快取鍵生成器
 */
export class CacheKeys {
  static client(id: string): string {
    return `client:${id}`;
  }

  static project(id: string): string {
    return `project:${id}`;
  }

  static quotation(id: string): string {
    return `quotation:${id}`;
  }

  static invoice(id: string): string {
    return `invoice:${id}`;
  }

  static vendor(id: string): string {
    return `vendor:${id}`;
  }

  static listClients(page: number, limit: number): string {
    return `clients:list:${page}:${limit}`;
  }

  static listProjects(page: number, limit: number): string {
    return `projects:list:${page}:${limit}`;
  }

  static regulations(keyword: string): string {
    return `regulations:${keyword}`;
  }

  static cnsStandard(number: string): string {
    return `cns:${number}`;
  }

  static weather(location: string): string {
    return `weather:${location}`;
  }
}
