/**
 * all-exceptions.filter.ts｜全域例外過濾器
 *
 * 用途：統一處理所有未捕獲的例外，確保回應格式一致
 * 規格：與 api-error.dto.ts 定義一致
 *
 * 更新日期：2026-01-15
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  ApiErrorResponse,
  getErrorMessage,
  ERROR_CODES,
} from "../dto/api-error.dto";

/**
 * 全域例外過濾器
 *
 * 功能：
 * 1. 統一錯誤回應格式
 * 2. 自動產生 traceId
 * 3. 記錄錯誤日誌
 * 4. 隱藏內部錯誤細節（生產環境）
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 產生追蹤 ID
    const traceId = uuidv4();

    // 取得 HTTP 狀態碼
    const status = this.getStatus(exception);

    // 取得錯誤代碼
    const errorCode = this.getErrorCode(status, exception);

    // 取得錯誤訊息
    const message = this.getMessage(exception, errorCode);

    // 取得驗證錯誤詳情
    const details = this.getValidationDetails(exception);

    // 建立錯誤回應
    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      error: errorCode,
      message,
      details: details.length > 0 ? details : undefined,
      traceId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 記錄錯誤日誌
    this.logError(exception, traceId, request);

    // 回傳錯誤
    response.status(status).json(errorResponse);
  }

  /**
   * 取得 HTTP 狀態碼
   */
  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * 取得錯誤代碼
   */
  private getErrorCode(status: number, exception: unknown): string {
    // 從 HttpException 取得自訂錯誤代碼
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "object" && response !== null) {
        const resp = response as Record<string, unknown>;
        if (typeof resp.error === "string" && ERROR_CODES[resp.error]) {
          return resp.error;
        }
      }
    }

    // 根據狀態碼對應錯誤代碼
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "BAD_REQUEST";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.CONFLICT:
        return "CONFLICT";
      default:
        return "INTERNAL_ERROR";
    }
  }

  /**
   * 取得錯誤訊息
   */
  private getMessage(exception: unknown, errorCode: string): string {
    // 生產環境隱藏內部錯誤訊息
    if (
      this.configService.get("NODE_ENV") === "production" &&
      errorCode === "INTERNAL_ERROR"
    ) {
      return getErrorMessage("INTERNAL_ERROR", "zh");
    }

    // 從 HttpException 取得訊息
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === "string") {
        return response;
      }
      if (typeof response === "object" && response !== null) {
        const resp = response as Record<string, unknown>;
        if (typeof resp.message === "string") {
          return resp.message;
        }
        if (Array.isArray(resp.message)) {
          return resp.message.join(", ");
        }
      }
    }

    // 從 Error 取得訊息
    if (exception instanceof Error) {
      return exception.message;
    }

    // 預設訊息
    return getErrorMessage(errorCode, "zh");
  }

  /**
   * 取得驗證錯誤詳情（class-validator）
   */
  private getValidationDetails(exception: unknown): Array<{
    field: string;
    reason: string;
    message?: string;
  }> {
    if (!(exception instanceof HttpException)) {
      return [];
    }

    const response = exception.getResponse();
    if (typeof response !== "object" || response === null) {
      return [];
    }

    const resp = response as Record<string, unknown>;
    const messages = resp.message;

    if (!Array.isArray(messages)) {
      return [];
    }

    // 解析 class-validator 錯誤格式
    return messages.map((msg: string) => {
      // 嘗試解析 "field should be ..." 格式
      const match = msg.match(/^(\w+)\s+(.+)$/);
      if (match) {
        return {
          field: match[1],
          reason: "VALIDATION_FAILED",
          message: msg,
        };
      }
      return {
        field: "unknown",
        reason: "VALIDATION_FAILED",
        message: msg,
      };
    });
  }

  /**
   * 記錄錯誤日誌
   */
  private logError(
    exception: unknown,
    traceId: string,
    request: Request,
  ): void {
    const status = this.getStatus(exception);
    const method = request.method;
    const url = request.url;
    const userAgent = request.get("user-agent") || "";

    const logMessage = `[${traceId}] ${method} ${url} - ${status}`;

    if (status >= 500) {
      // 5xx 錯誤記錄完整堆疊
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      // 4xx 錯誤記錄警告
      this.logger.warn(`${logMessage} - ${userAgent}`);
    }
  }
}
