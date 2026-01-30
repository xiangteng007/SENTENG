import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * PermissionGuard
 *
 * 基於資料庫 RBAC 的細粒度權限控制。
 * 從 role_permissions 表檢查使用者角色是否擁有所需權限。
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no specific permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.sub && !user?.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.sub || user.userId;
    const userRole = user.role;

    // Admin roles have all permissions
    const adminRoles = ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'super_admin', '老闆'];
    if (
      adminRoles.includes(userRole) ||
      adminRoles.map(r => r.toLowerCase()).includes(userRole?.toLowerCase())
    ) {
      return true;
    }

    // Get user's permissions from database
    const userPermissions = await this.getUserPermissions(userRole);

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(required => {
      // Direct match
      if (userPermissions.includes(required)) return true;

      // Check wildcard (e.g., customers:* matches customers:create)
      const [module] = required.split(':');
      if (userPermissions.includes(`${module}:*`)) return true;

      return false;
    });

    if (!hasPermission) {
      console.log(
        `[PermissionGuard] Access denied - User: ${userId}, Role: ${userRole}, Required: ${requiredPermissions.join(', ')}, Has: ${userPermissions.slice(0, 5).join(', ')}...`
      );
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermissions.join(' or ')}`
      );
    }

    return true;
  }

  private async getUserPermissions(roleId: string): Promise<string[]> {
    try {
      const result = await this.dataSource.query(
        `SELECT permission_id FROM role_permissions WHERE role_id = $1`,
        [roleId]
      );
      return result.map((r: { permission_id: string }) => r.permission_id);
    } catch (error) {
      console.error('[PermissionGuard] Error fetching permissions:', error);
      return [];
    }
  }
}
