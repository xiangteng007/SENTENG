/**
 * Sentry Exception Filter
 *
 * 自動捕獲所有未處理的例外並發送到 Sentry
 * 與現有的 AllExceptionsFilter 協同工作
 */
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import * as Sentry from "@sentry/nestjs";

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 只在 Sentry 已初始化時發送
    if (process.env.SENTRY_DSN) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();

      // 設置用戶上下文
      if (request?.user) {
        Sentry.setUser({
          id: request.user.id,
          email: request.user.email,
          username: request.user.name,
        });
      }

      // 設置請求上下文
      Sentry.setContext("request", {
        method: request?.method,
        url: request?.url,
        params: request?.params,
        query: request?.query,
      });

      // 判斷是否應該發送到 Sentry (排除 4xx 客戶端錯誤)
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      // 只發送 5xx 伺服器錯誤
      if (status >= 500) {
        Sentry.captureException(exception);
      }
    }

    // 繼續正常的例外處理流程
    super.catch(exception, host);
  }
}
