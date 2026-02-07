/**
 * Partner Entity
 *
 * 統一合作夥伴資料模型
 * 取代原有的 Customer + Vendor + Contact 三套系統
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";

import { PartnerType, SyncStatus, PartnerCategory } from "./partner-enums";
import { PartnerContact } from "./partner-contact.entity";

// Re-export enums for backward compatibility
export { PartnerType, SyncStatus, PartnerCategory };

@Entity("partners")
@Index(["type"])
@Index(["name"])
@Index(["syncStatus"])
export class Partner {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 20,
    default: PartnerType.CLIENT,
  })
  type: PartnerType;

  @Column({ length: 200 })
  name: string;

  // 統一編號（公司用）
  @Column({ name: "tax_id", length: 20, nullable: true })
  taxId: string;

  // 分類（廠商用）
  @Column({ length: 50, nullable: true })
  category: string;

  // 聯絡資訊
  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ name: "line_id", length: 50, nullable: true })
  lineId: string;

  // 評分 (1-5)
  @Column({ type: "int", default: 0 })
  rating: number;

  @Column({ type: "text", nullable: true })
  notes: string;

  // Google 同步
  @Column({ name: "google_contact_id", length: 100, nullable: true })
  googleContactId: string;

  @Column({
    name: "sync_status",
    type: "varchar",
    length: 20,
    default: SyncStatus.PENDING,
  })
  syncStatus: SyncStatus;

  @Column({ name: "last_synced_at", type: "timestamp", nullable: true })
  lastSyncedAt: Date;

  // 聯絡人關聯
  @OneToMany(() => PartnerContact, (contact) => contact.partner, { cascade: true })
  contacts: PartnerContact[];

  // 審計欄位
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;
}
