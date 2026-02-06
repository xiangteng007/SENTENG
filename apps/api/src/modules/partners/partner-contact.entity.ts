/**
 * PartnerContact Entity
 *
 * Partner 的聯絡人（一對多）
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Partner, SyncStatus } from "./partner.entity";

@Entity("partner_contacts")
@Index(["partnerId"])
@Index(["isPrimary"])
export class PartnerContact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "partner_id", type: "uuid" })
  partnerId: string;

  @ManyToOne(() => Partner, (partner) => partner.contacts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  title: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 30, nullable: true })
  mobile: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: "line_id", length: 50, nullable: true })
  lineId: string;

  @Column({ name: "is_primary", default: false })
  isPrimary: boolean;

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

  // 審計欄位
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;
}
