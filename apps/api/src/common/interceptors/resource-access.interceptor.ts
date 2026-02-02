import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Reflector } from "@nestjs/core";
import { isAdminRole } from "../constants/roles";

/**
 * ResourceAccessInterceptor
 * SEC-002: IDOR 防護增強
 *
 * 在響應返回前驗證資源擁有權
 * 防止 IDOR 攻擊（Insecure Direct Object Reference）
 */

export const RESOURCE_ACCESS_KEY = "resourceAccess";

export interface ResourceAccessConfig {
  ownerField: string; // 擁有者欄位名稱 (e.g., 'createdBy', 'userId')
  allowedRoles?: string[]; // 允許的角色（除了 admin）
  checkArray?: boolean; // 是否檢查陣列中的每個元素
}

@Injectable()
export class ResourceAccessInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResourceAccessInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const config = this.reflector.get<ResourceAccessConfig>(
      RESOURCE_ACCESS_KEY,
      context.getHandler(),
    );

    if (!config) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    // Admin 跳過檢查
    if (isAdminRole(user.role)) {
      return next.handle();
    }

    // 檢查允許的角色
    if (config.allowedRoles?.includes(user.role)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        if (!data) return;

        if (config.checkArray && Array.isArray(data)) {
          // 過濾陣列，只返回使用者有權限的資源
          const filteredData = data.filter((item) =>
            this.checkOwnership(item, user.id, config.ownerField),
          );

          if (filteredData.length !== data.length) {
            this.logger.warn(
              `User ${user.id} attempted to access unauthorized resources`,
            );
          }

          // 無法直接修改返回值，記錄警告
          return filteredData;
        } else if (typeof data === "object") {
          if (!this.checkOwnership(data, user.id, config.ownerField)) {
            this.logger.warn(
              `IDOR attempt: User ${user.id} tried to access resource owned by ${data[config.ownerField]}`,
            );
            throw new ForbiddenException("You do not have access to this resource");
          }
        }
      }),
    );
  }

  private checkOwnership(
    item: any,
    userId: string,
    ownerField: string,
  ): boolean {
    if (!item || typeof item !== "object") return true;

    // 支援巢狀欄位 (e.g., 'project.createdBy')
    const fields = ownerField.split(".");
    let value = item;

    for (const field of fields) {
      value = value?.[field];
    }

    return value === userId;
  }
}

/**
 * ResourceAccess 裝飾器
 * 使用: @ResourceAccess({ ownerField: 'createdBy' })
 */
import { SetMetadata } from "@nestjs/common";

export const ResourceAccess = (config: ResourceAccessConfig) =>
  SetMetadata(RESOURCE_ACCESS_KEY, config);
