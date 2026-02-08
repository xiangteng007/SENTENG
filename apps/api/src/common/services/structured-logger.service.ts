/**
 * structured-logger.service.ts | 結構化日誌服務
 *
 * 用途：提供 JSON 格式的結構化日誌，與 Cloud Logging 整合
 *
 * 功能：
 * - Google Cloud Logging 格式相容
 * - 自動包含 traceId, timestamp, severity
 * - 支援上下文資訊 (userId, projectId)
 *
 * 更新日期：2026-02-02
 */

import { Injectable, LoggerService, ConsoleLogger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface LogContext {
  traceId?: string;
  userId?: string;
  projectId?: string;
  module?: string;
  action?: string;
  [key: string]: unknown;
}

interface StructuredLog {
  severity: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  timestamp: string;
  "logging.googleapis.com/trace"?: string;
  context?: LogContext;
  stack?: string;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly isProduction: boolean;
  private readonly serviceName: string;
  private readonly projectId: string;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get("NODE_ENV") === "production";
    this.serviceName = this.configService.get("K_SERVICE", "senteng-api");
    this.projectId = this.configService.get(
      "GCP_PROJECT_ID",
      "senteng-erp-pro",
    );
  }

  /**
   * 輸出 INFO 等級日誌
   */
  log(message: string, context?: LogContext | string): void {
    this.writeLog("INFO", message, this.normalizeContext(context));
  }

  /**
   * 輸出 ERROR 等級日誌
   */
  error(message: string, trace?: string, context?: LogContext | string): void {
    this.writeLog("ERROR", message, this.normalizeContext(context), trace);
  }

  /**
   * 輸出 WARNING 等級日誌
   */
  warn(message: string, context?: LogContext | string): void {
    this.writeLog("WARNING", message, this.normalizeContext(context));
  }

  /**
   * 輸出 DEBUG 等級日誌
   */
  debug(message: string, context?: LogContext | string): void {
    if (!this.isProduction) {
      this.writeLog("DEBUG", message, this.normalizeContext(context));
    }
  }

  /**
   * 輸出 INFO 等級日誌 (verbose)
   */
  verbose(message: string, context?: LogContext | string): void {
    if (!this.isProduction) {
      this.writeLog("DEBUG", message, this.normalizeContext(context));
    }
  }

  /**
   * 標準化上下文
   */
  private normalizeContext(context?: LogContext | string): LogContext {
    if (!context) return {};
    if (typeof context === "string") return { module: context };
    return context;
  }

  /**
   * 寫入結構化日誌
   */
  private writeLog(
    severity: StructuredLog["severity"],
    message: string,
    context: LogContext,
    stack?: string,
  ): void {
    const log: StructuredLog = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        service: this.serviceName,
      },
    };

    // Add trace ID for Cloud Logging correlation
    if (context.traceId) {
      log["logging.googleapis.com/trace"] =
        `projects/${this.projectId}/traces/${context.traceId}`;
    }

    // Add stack trace for errors
    if (stack) {
      log.stack = stack;
    }

    // In production, output JSON for Cloud Logging
    if (this.isProduction) {
      console.log(JSON.stringify(log));
    } else {
      // In development, use readable format
      const color = this.getColor(severity);
      const prefix = `[${severity}]`;
      const contextStr = context.module ? `[${context.module}]` : "";
      console.log(`${color}${prefix}${contextStr} ${message}\x1b[0m`);
      if (stack) {
        console.log(stack);
      }
    }
  }

  /**
   * 取得終端顏色代碼
   */
  private getColor(severity: StructuredLog["severity"]): string {
    switch (severity) {
      case "DEBUG":
        return "\x1b[36m"; // Cyan
      case "INFO":
        return "\x1b[32m"; // Green
      case "WARNING":
        return "\x1b[33m"; // Yellow
      case "ERROR":
      case "CRITICAL":
        return "\x1b[31m"; // Red
      default:
        return "\x1b[0m";
    }
  }
}

/**
 * 請求追蹤日誌中間件
 * 自動附加 traceId 到每個請求
 */
import { Request } from "express";

export function createRequestLogger(logger: StructuredLoggerService) {
  return (
    req: Request & Record<string, unknown>,
    res: unknown,
    next: () => void,
  ) => {
    const traceHeader = req.headers["x-cloud-trace-context"];
    const traceId =
      (typeof traceHeader === "string"
        ? traceHeader.split("/")[0]
        : undefined) ||
      `local-${Date.now()}`;

    req.traceId = traceId;
    req.logger = {
      log: (msg: string, ctx?: LogContext) =>
        logger.log(msg, { ...ctx, traceId }),
      error: (msg: string, stack?: string, ctx?: LogContext) =>
        logger.error(msg, stack, { ...ctx, traceId }),
      warn: (msg: string, ctx?: LogContext) =>
        logger.warn(msg, { ...ctx, traceId }),
    };

    next();
  };
}
