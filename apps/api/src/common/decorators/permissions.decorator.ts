import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "requiredPermissions";

/**
 * Decorator to specify required permissions for an endpoint
 * @example @RequirePermissions('customers:create')
 * @example @RequirePermissions('projects:update', 'projects:delete')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
