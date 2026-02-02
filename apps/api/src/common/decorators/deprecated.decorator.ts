/**
 * deprecated.decorator.ts | API 棄用標記裝飾器
 *
 * 用途：標記即將棄用的 API 端點，自動加入 Deprecation Header
 *
 * 使用方式：
 * @Deprecated('2026-06-01', '請改用 /api/v2/projects')
 * @Get('/projects')
 * findAll() { ... }
 *
 * 更新日期：2026-02-02
 */

import { SetMetadata, applyDecorators, UseInterceptors } from "@nestjs/common";
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export const DEPRECATED_KEY = "deprecated";

export interface DeprecatedMetadata {
  sunsetDate: string;
  message: string;
}

/**
 * API 棄用裝飾器
 *
 * @param sunsetDate 停用日期 (ISO 8601 格式)
 * @param message 棄用訊息，建議包含遷移指引
 */
export function Deprecated(sunsetDate: string, message: string) {
  return applyDecorators(
    SetMetadata(DEPRECATED_KEY, { sunsetDate, message } as DeprecatedMetadata),
    UseInterceptors(DeprecatedInterceptor),
  );
}

@Injectable()
export class DeprecatedInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<DeprecatedMetadata>(
      DEPRECATED_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    // RFC 8594 Sunset Header
    response.setHeader("Sunset", metadata.sunsetDate);

    // Deprecation Header (RFC 8594)
    response.setHeader("Deprecation", "true");

    // Link Header pointing to documentation
    response.setHeader(
      "Link",
      `</api/docs>; rel="deprecation"; type="text/html"`,
    );

    // Custom warning header
    response.setHeader(
      "X-API-Deprecated",
      `This endpoint is deprecated and will be removed on ${metadata.sunsetDate}. ${metadata.message}`,
    );

    return next.handle().pipe(
      tap(() => {
        // Log deprecation usage for monitoring
        console.warn(
          `[DEPRECATED] ${request.method} ${request.url} - Sunset: ${metadata.sunsetDate}`,
        );
      }),
    );
  }
}
