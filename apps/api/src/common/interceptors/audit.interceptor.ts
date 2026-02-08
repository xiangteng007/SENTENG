import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Reflector } from "@nestjs/core";

// Note: AuditService will be injected dynamically to avoid circular dependency
interface AuditServiceInterface {
  logUpdate(
    entityType: string,
    entityId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
    context?: {
      userId?: string;
      userEmail?: string;
      userName?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<unknown>;
}

/**
 * 需要審計的實體類型
 */
export const AUDITED_ENTITIES = [
  "contracts",
  "payments",
  "invoices",
  "change_orders",
  "work_orders",
  "chemical_lots",
  "bim_models",
];

/**
 * 裝飾器: 標記需要審計的控制器或方法
 */
export const Audited = (entityType: string) =>
  Reflect.metadata("auditedEntity", entityType);

/**
 * AuditInterceptor
 *
 * 自動記錄關鍵實體的變更。
 * 在 POST/PATCH/DELETE 請求成功後記錄審計日誌。
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Optional()
    @Inject("AUDIT_SERVICE")
    private readonly auditService: AuditServiceInterface | null,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const entityType =
      this.reflector.get<string>("auditedEntity", context.getHandler()) ||
      this.reflector.get<string>("auditedEntity", context.getClass());

    // Only audit mutations on marked entities
    if (!entityType || !["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
      return next.handle();
    }

    // Skip if no audit service available
    if (!this.auditService) {
      return next.handle();
    }

    const user = request.user;
    const entityId = request.params?.id;
    const oldBody = request.body;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const action = this.getAction(method);
          const newValues = responseData || request.body;

          await this.auditService!.logUpdate(
            entityType,
            entityId || newValues?.id || "unknown",
            action === "CREATE" ? null : oldBody,
            newValues,
            {
              userId: user?.sub,
              userEmail: user?.email,
              userName: user?.name,
              ipAddress: request.ip,
              userAgent: request.headers?.["user-agent"],
            },
          );
        } catch (error) {
          // Log error but don't fail the request
          console.error("Audit logging failed:", error);
        }
      }),
    );
  }

  private getAction(method: string): string {
    switch (method) {
      case "POST":
        return "CREATE";
      case "PATCH":
      case "PUT":
        return "UPDATE";
      case "DELETE":
        return "DELETE";
      default:
        return "UNKNOWN";
    }
  }
}
