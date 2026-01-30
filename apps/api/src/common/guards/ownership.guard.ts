import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Decorator to mark resource ownership requirements
export const OWNERSHIP_KEY = 'ownership';
export const RESOURCE_PARAM_KEY = 'resourceParam';

export interface OwnershipConfig {
  resourceType: string; // e.g., 'project', 'client', 'contract'
  ownerField?: string; // Field in resource that contains owner ID (default: 'createdBy')
  allowedRoles?: string[]; // Roles that bypass ownership check (default: ['super_admin'])
}

/**
 * Decorator to apply ownership check on a route
 * @example @CheckOwnership({ resourceType: 'project' })
 */
export const CheckOwnership = (config: OwnershipConfig) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(OWNERSHIP_KEY, config, descriptor.value);
    return descriptor;
  };
};

/**
 * IDOR Protection Guard
 * Checks if the current user has ownership/access rights to the requested resource
 *
 * This is a placeholder that needs to be integrated with specific services
 * for actual ownership verification based on business logic.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<OwnershipConfig>(OWNERSHIP_KEY, context.getHandler());

    // If no ownership config, skip check
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // Check if user has a bypass role
    const allowedRoles = config.allowedRoles || ['super_admin'];
    if (user?.role && allowedRoles.includes(user.role)) {
      return true;
    }

    // If no resource ID in params, allow (it's likely a list/create operation)
    if (!resourceId) {
      return true;
    }

    // For actual implementation, you would:
    // 1. Inject the appropriate service for the resource type
    // 2. Fetch the resource
    // 3. Check if user.sub === resource[ownerField]
    //
    // Example pseudo-code:
    // const resource = await this.getResource(config.resourceType, resourceId);
    // const ownerField = config.ownerField || 'createdBy';
    // if (resource[ownerField] !== user.sub) {
    //     throw new ForbiddenException('You do not have access to this resource');
    // }

    // For now, we allow but log a warning for resources that should be checked
    console.warn(
      `[OwnershipGuard] Resource ${config.resourceType}:${resourceId} access by user ${user?.sub} - ownership not verified (needs service integration)`
    );

    return true;
  }
}

/**
 * Service interface for ownership verification
 * Implement this interface in your resource services
 */
export interface OwnershipVerifiable {
  verifyOwnership(resourceId: string, userId: string): Promise<boolean>;
}
