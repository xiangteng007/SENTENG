import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";

/**
 * Permission (權限)
 *
 * 代表一個具體的操作權限，如 projects:create, invoices:approve
 */
@Entity("permissions")
export class Permission {
  @PrimaryColumn({ length: 50 })
  id: string; // e.g., 'projects:create', 'invoices:approve'

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  module: string; // e.g., 'projects', 'invoices', 'drone'

  @Column({ length: 30, nullable: true })
  action: string; // e.g., 'create', 'read', 'update', 'delete', 'approve'

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

/**
 * Role (角色)
 *
 * 代表一個角色，包含多個權限。
 */
@Entity("roles")
export class Role {
  @PrimaryColumn({ length: 30 })
  id: string; // e.g., 'super_admin', 'project_manager'

  @Column({ length: 100 })
  name: string;

  @Column({ name: "name_zh", length: 100, nullable: true })
  nameZh: string; // 中文名稱，如 '最高管理員'

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ default: 1 })
  level: number; // 1-10, higher = more privileges

  @Column({ name: "is_system", default: false })
  isSystem: boolean; // System roles cannot be deleted

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Many-to-Many with Permission
  @ManyToMany(() => Permission)
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions: Permission[];
}

/**
 * UserRole (使用者角色關聯)
 *
 * 支援一個使用者擁有多個角色，且可限定在特定 BusinessUnit
 */
@Entity("user_roles")
export class UserRole {
  @PrimaryColumn({ name: "user_id", length: 20 })
  userId: string;

  @PrimaryColumn({ name: "role_id", length: 30 })
  roleId: string;

  @PrimaryColumn({ name: "business_unit_id", length: 20, default: "*" })
  businessUnitId: string; // '*' = all business units

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "granted_by", length: 20, nullable: true })
  grantedBy: string;

  @CreateDateColumn({ name: "granted_at" })
  grantedAt: Date;

  @Column({ name: "expires_at", nullable: true })
  expiresAt: Date;
}
