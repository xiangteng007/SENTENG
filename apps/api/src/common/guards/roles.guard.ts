import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Map Chinese role names to English equivalents
const ROLE_MAPPING: Record<string, string> = {
  最高管理員: 'super_admin',
  管理員: 'admin',
  專案經理: 'project_manager',
  業務: 'sales',
  工務: 'engineer',
  財務: 'finance',
  一般使用者: 'user',
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access (still needs to pass JwtAuthGuard)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user?.role) {
      console.log(`[RolesGuard] User object:`, JSON.stringify(user, null, 2));
      throw new ForbiddenException('User role not found');
    }

    // DEBUG: Log the user payload
    console.log(
      `[RolesGuard] User payload: email=${user.email}, role="${user.role}", requiredRoles=${requiredRoles.join(', ')}`
    );

    const originalRole = user.role;
    // Normalize role: map Chinese to English
    const normalizedRole = ROLE_MAPPING[originalRole] || originalRole;

    // Also create reverse mapping for comparison
    const REVERSE_ROLE_MAPPING: Record<string, string> = Object.entries(ROLE_MAPPING).reduce(
      (acc, [chinese, english]) => ({ ...acc, [english]: chinese }),
      {}
    );

    // Check if user has any of the required roles
    // Support both original role name and normalized role name
    const hasRole = requiredRoles.some(requiredRole => {
      // Direct match with original role
      if (originalRole === requiredRole) return true;
      // Direct match with normalized role
      if (normalizedRole === requiredRole) return true;
      // Check if required role maps to user's normalized role
      const normalizedRequired = ROLE_MAPPING[requiredRole] || requiredRole;
      if (normalizedRole === normalizedRequired) return true;
      return false;
    });

    if (!hasRole) {
      console.log(
        `[RolesGuard] Access denied - User role: ${originalRole} (normalized: ${normalizedRole}), Required: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
