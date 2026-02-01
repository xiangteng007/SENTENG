import { SetMetadata } from "@nestjs/common";

/**
 * 快取裝飾器
 *
 * 用於自動快取方法回傳值
 *
 * @example
 * ```typescript
 * @Cacheable('client', 300)
 * async findClient(id: string): Promise<Client> {
 *   return this.clientRepo.findOne({ where: { id } });
 * }
 * ```
 */
export const CACHE_KEY = "cache:key";
export const CACHE_TTL = "cache:ttl";

export interface CacheOptions {
  key?: string;
  ttl?: number;
  keyGenerator?: (...args: unknown[]) => string;
}

/**
 * 標記方法為可快取
 */
export const Cacheable = (
  prefix: string,
  ttlSeconds = 300,
  keyGenerator?: (...args: unknown[]) => string,
) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_KEY, prefix)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL, ttlSeconds)(target, propertyKey, descriptor);

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      // 產生快取鍵
      const cacheKey = keyGenerator
        ? `${prefix}:${keyGenerator(...args)}`
        : `${prefix}:${JSON.stringify(args)}`;

      // 嘗試從快取服務取得 (需要 inject CacheService)
      const cacheService = (this as Record<string, unknown>).cacheService;

      if (
        cacheService &&
        typeof (cacheService as Record<string, unknown>).get === "function"
      ) {
        const cached = await (
          cacheService as { get: (k: string) => Promise<unknown> }
        ).get(cacheKey);
        if (cached !== null) {
          return cached;
        }
      }

      // 執行原始方法
      const result = await originalMethod.apply(this, args);

      // 存入快取
      if (
        cacheService &&
        typeof (cacheService as Record<string, unknown>).set === "function"
      ) {
        await (
          cacheService as {
            set: (k: string, v: unknown, t: number) => Promise<void>;
          }
        ).set(cacheKey, result, ttlSeconds);
      }

      return result;
    };

    return descriptor;
  };
};

/**
 * 標記方法會使快取失效
 */
export const CacheEvict = (pattern: string) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      // 清除快取
      const cacheService = (this as Record<string, unknown>).cacheService;
      if (
        cacheService &&
        typeof (cacheService as Record<string, unknown>).delByPattern ===
          "function"
      ) {
        await (
          cacheService as { delByPattern: (p: string) => Promise<number> }
        ).delByPattern(pattern);
      }

      return result;
    };

    return descriptor;
  };
};
