import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isAdminRole } from '../../common/constants/roles';

/**
 * OWNERSHIP_KEY - 用於裝飾器標記需要擁有權檢查的 handler
 */
export const OWNERSHIP_KEY = 'ownership';

/**
 * OwnershipGuard - 統一資源擁有權檢查
 *
 * 取代各 Service 中重複的 checkOwnership() 方法
 * 使用方式: @UseGuards(OwnershipGuard) + @CheckOwnership('entity')
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const ownershipConfig = this.reflector.get<{
      entityKey: string;
      ownerField: string;
    }>(OWNERSHIP_KEY, context.getHandler());

    // 如果沒有設定 ownership 檢查，直接通過
    if (!ownershipConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 沒有 user 資訊，跳過檢查（可能是公開 API）
    if (!user) {
      return true;
    }

    // Admin 角色直接通過
    if (isAdminRole(user.role)) {
      return true;
    }

    // 從 request 取得 entity
    const entity = request[ownershipConfig.entityKey];
    if (!entity) {
      // Entity 還沒載入，讓 Controller 處理
      return true;
    }

    // 檢查擁有權
    const ownerValue = entity[ownershipConfig.ownerField];
    if (ownerValue !== user.id) {
      throw new ForbiddenException(
        `You do not have access to this ${ownershipConfig.entityKey}`,
      );
    }

    return true;
  }
}

/**
 * 工具函數：檢查資源擁有權
 * 給 Service 層使用（當 Guard 不適用時）
 */
export function checkResourceOwnership<T extends { createdBy?: string }>(
  entity: T,
  userId?: string,
  userRole?: string,
  entityName = 'resource',
): void {
  if (!userId || !userRole) return;
  if (isAdminRole(userRole)) return;
  if (entity.createdBy !== userId) {
    throw new ForbiddenException(`You do not have access to this ${entityName}`);
  }
}
