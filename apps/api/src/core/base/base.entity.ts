import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

/**
 * BaseEntity - 所有 Entity 的基礎類別
 *
 * 提供統一的欄位：
 * - id: 業務自訂 ID (如 CLT-202601-0001)
 * - createdAt, updatedAt, deletedAt: 時間戳記
 * - createdBy, updatedBy: 操作者追蹤
 */
export abstract class BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;
}
