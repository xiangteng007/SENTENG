import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Role, Permission, UserRole } from "./entities";

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  // ========== Roles ==========

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepo.find({
      where: { isActive: true },
      relations: ["permissions"],
      order: { level: "DESC" },
    });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ["permissions"],
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  // ========== Permissions ==========

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { module: "ASC", action: "ASC" },
    });
  }

  async findPermissionsByModule(module: string): Promise<Permission[]> {
    return this.permissionRepo.find({
      where: { module },
      order: { action: "ASC" },
    });
  }

  // ========== User Roles ==========

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepo.find({
      where: { userId, isActive: true },
    });
  }

  async getUserPermissions(
    userId: string,
    businessUnitId?: string,
  ): Promise<string[]> {
    // Get all active roles for user
    const userRoles = await this.userRoleRepo.find({
      where: { userId, isActive: true },
    });

    if (userRoles.length === 0) return [];

    // Filter by business unit if provided
    const applicableRoles = userRoles.filter(
      (ur) => ur.businessUnitId === "*" || ur.businessUnitId === businessUnitId,
    );

    const roleIds = applicableRoles.map((ur) => ur.roleId);
    if (roleIds.length === 0) return [];

    // Get roles with permissions
    const roles = await this.roleRepo.find({
      where: { id: In(roleIds), isActive: true },
      relations: ["permissions"],
    });

    // Collect unique permissions
    const permissionSet = new Set<string>();
    roles.forEach((role) => {
      role.permissions?.forEach((p) => permissionSet.add(p.id));
    });

    return Array.from(permissionSet);
  }

  async hasPermission(
    userId: string,
    permissionId: string,
    businessUnitId?: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, businessUnitId);
    return permissions.includes(permissionId);
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    businessUnitId: string = "*",
    grantedBy?: string,
  ): Promise<UserRole> {
    // Verify role exists
    await this.findRoleById(roleId);

    const existing = await this.userRoleRepo.findOne({
      where: { userId, roleId, businessUnitId },
    });

    if (existing) {
      existing.isActive = true;
      if (grantedBy) existing.grantedBy = grantedBy;
      return this.userRoleRepo.save(existing);
    }

    const userRole = this.userRoleRepo.create({
      userId,
      roleId,
      businessUnitId,
      grantedBy,
      isActive: true,
    });
    return this.userRoleRepo.save(userRole);
  }

  async revokeRoleFromUser(
    userId: string,
    roleId: string,
    businessUnitId: string = "*",
  ): Promise<void> {
    await this.userRoleRepo.update(
      { userId, roleId, businessUnitId },
      { isActive: false },
    );
  }

  // ========== Authorization Check ==========

  async checkAccess(
    userId: string,
    requiredPermission: string,
    businessUnitId?: string,
  ): Promise<void> {
    const hasAccess = await this.hasPermission(
      userId,
      requiredPermission,
      businessUnitId,
    );
    if (!hasAccess) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }
  }
}
