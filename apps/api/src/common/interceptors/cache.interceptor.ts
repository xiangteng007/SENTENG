import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Simple in-memory cache interceptor for GET requests.
 * Apply to high-frequency read-only endpoints (dashboard stats, lists).
 *
 * Usage:
 *   @UseInterceptors(CacheInterceptor)
 *   @Get('stats')
 *   getStats() { ... }
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly cache = new Map<string, { data: unknown; expiry: number }>();
  private readonly DEFAULT_TTL_MS = 30_000; // 30 seconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== "GET") {
      return next.handle();
    }

    const cacheKey = `${request.url}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((data) => {
        this.cache.set(cacheKey, {
          data,
          expiry: Date.now() + this.DEFAULT_TTL_MS,
        });
        this.logger.debug(`Cache SET: ${cacheKey}`);
      }),
    );
  }

  /** Manually invalidate a cache entry */
  invalidate(url: string): void {
    this.cache.delete(url);
  }

  /** Clear all cached entries */
  clearAll(): void {
    this.cache.clear();
  }
}
