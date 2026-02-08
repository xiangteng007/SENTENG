import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * AuditLog (稽核日誌)
 *
 * 記錄關鍵資料的變更歷史，包含 who/when/what。
 * 適用於 Contracts、Payments、ChangeOrders、WorkOrders、Chemical 等關鍵表。
 */
@Entity("audit_logs")
@Index(["entityType", "entityId"])
@Index(["userId", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 操作類型
   * - CREATE: 新建
   * - UPDATE: 更新
   * - DELETE: 刪除
   * - STATUS_CHANGE: 狀態變更
   */
  @Column({ length: 30 })
  action: string;

  @Column({ name: "entity_type", length: 50 })
  entityType: string; // contracts, payments, work_orders, etc.

  @Column({ name: "entity_id", length: 50 })
  entityId: string;

  @Column({ name: "user_id", length: 20, nullable: true })
  userId: string;

  @Column({ name: "user_email", length: 100, nullable: true })
  userEmail: string;

  @Column({ name: "user_name", length: 100, nullable: true })
  userName: string;

  /**
   * 變更前的值 (JSON snapshot)
   */
  @Column({ name: "old_values", type: "jsonb", nullable: true })
  oldValues: Record<string, unknown>;

  /**
   * 變更後的值 (JSON snapshot)
   */
  @Column({ name: "new_values", type: "jsonb", nullable: true })
  newValues: Record<string, unknown>;

  /**
   * 變更欄位列表
   */
  @Column({ name: "changed_fields", type: "text", array: true, nullable: true })
  changedFields: string[];

  @Column({ name: "ip_address", length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
