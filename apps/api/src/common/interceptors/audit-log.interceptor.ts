import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Security Audit Logger Interceptor
 * V10 Enhancement: Structured logging for Google Cloud Logging
 *
 * Logs are automatically persisted to Cloud Logging when running on Cloud Run.
 * Use these log queries in Cloud Logging:
 * - jsonPayload.logType="SECURITY_AUDIT"
 * - jsonPayload.severity="WARNING"
 * - jsonPayload.action="USER_LOGIN" AND jsonPayload.status="FAILED"
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger("SecurityAudit");

  // Track failed login attempts for brute force detection
  private readonly failedLoginAttempts = new Map<
    string,
    { count: number; lastAttempt: number }
  >();
  private readonly BRUTE_FORCE_THRESHOLD = 5;
  private readonly BRUTE_FORCE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  // Sensitive operations that should always be logged
  private readonly sensitivePatterns = [
    {
      method: "POST",
      pattern: /\/auth\/login/i,
      action: "USER_LOGIN",
      severity: "INFO",
    },
    {
      method: "POST",
      pattern: /\/auth\/logout/i,
      action: "USER_LOGOUT",
      severity: "INFO",
    },
    {
      method: "POST",
      pattern: /\/(clients|projects|contracts|quotations|payments)/i,
      action: "RESOURCE_CREATE",
      severity: "INFO",
    },
    {
      method: "PATCH",
      pattern: /\/(clients|projects|contracts|quotations|payments)/i,
      action: "RESOURCE_UPDATE",
      severity: "INFO",
    },
    {
      method: "DELETE",
      pattern: /\/.+/i,
      action: "RESOURCE_DELETE",
      severity: "WARNING",
    },
    {
      method: "POST",
      pattern: /\/approve/i,
      action: "APPROVAL_ACTION",
      severity: "INFO",
    },
    {
      method: "POST",
      pattern: /\/reject/i,
      action: "REJECTION_ACTION",
      severity: "INFO",
    },
    {
      method: "POST",
      pattern: /\/blacklist/i,
      action: "BLACKLIST_ACTION",
      severity: "WARNING",
    },
    {
      method: "POST",
      pattern: /\/finance\//i,
      action: "FINANCIAL_OPERATION",
      severity: "WARNING",
    },
    {
      method: "POST",
      pattern: /\/users/i,
      action: "USER_MANAGEMENT",
      severity: "WARNING",
    },
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip, headers } = request;
    const startTime = Date.now();

    // Determine action type
    const patternMatch = this.findPattern(method, url);

    // Skip non-sensitive operations for performance
    if (!patternMatch) {
      return next.handle();
    }

    const clientIp =
      ip || headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";

    // Create structured audit entry for Cloud Logging
    const auditEntry = {
      // GCP Cloud Logging fields
      logType: "SECURITY_AUDIT",
      severity: patternMatch.severity,

      // Audit details
      timestamp: new Date().toISOString(),
      action: patternMatch.action,
      method,
      url: this.sanitizeUrl(url),

      // User context
      userId: user?.sub || user?.id || "anonymous",
      userEmail: user?.email || "unknown",
      userRole: user?.role || "unknown",

      // Request context
      clientIp,
      userAgent: headers["user-agent"]?.substring(0, 100) || "unknown",

      // Payload metadata (not sensitive content)
      bodyKeys: body ? Object.keys(body) : [],
      hasAuthHeader: !!headers["authorization"],
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;

          // Clear failed login attempts on success
          if (patternMatch.action === "USER_LOGIN") {
            this.failedLoginAttempts.delete(clientIp);
          }

          this.logger.log(
            JSON.stringify({
              ...auditEntry,
              status: "SUCCESS",
              durationMs: duration,
              responseId: response?.id || null,
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // Detect brute force attempts
          let bruteForceAlert = false;
          if (patternMatch.action === "USER_LOGIN") {
            bruteForceAlert = this.trackFailedLogin(clientIp);
          }

          const errorLog = {
            ...auditEntry,
            severity: bruteForceAlert ? "CRITICAL" : "WARNING",
            status: "FAILED",
            durationMs: duration,
            error: error.message,
            statusCode: error.status || 500,
            bruteForceAlert,
          };

          if (bruteForceAlert) {
            this.logger.error(JSON.stringify(errorLog));
          } else {
            this.logger.warn(JSON.stringify(errorLog));
          }
        },
      }),
    );
  }

  private findPattern(method: string, url: string) {
    for (const pattern of this.sensitivePatterns) {
      if (pattern.method === method && pattern.pattern.test(url)) {
        return pattern;
      }
    }
    return null;
  }

  private sanitizeUrl(url: string): string {
    // Remove query parameters that might contain sensitive data
    return url.split("?")[0];
  }

  /**
   * Track failed login attempts for brute force detection
   * Returns true if brute force threshold exceeded
   */
  private trackFailedLogin(clientIp: string): boolean {
    const now = Date.now();
    const record = this.failedLoginAttempts.get(clientIp);

    if (record && now - record.lastAttempt < this.BRUTE_FORCE_WINDOW_MS) {
      record.count++;
      record.lastAttempt = now;

      if (record.count >= this.BRUTE_FORCE_THRESHOLD) {
        return true; // Brute force detected
      }
    } else {
      this.failedLoginAttempts.set(clientIp, { count: 1, lastAttempt: now });
    }

    return false;
  }
}
