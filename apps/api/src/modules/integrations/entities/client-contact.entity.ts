/**
 * client-contact.entity.ts
 *
 * 客戶聯絡人實體（可同步至 Google Contacts）
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Partner } from "../../partners/partner.entity";

@Entity("client_contacts")
export class ClientContact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "client_id", length: 20 })
  @Index()
  /** @deprecated Use partnerId instead */
  clientId: string;

  // Unified Partner relation (replaces client)
  @Column({ name: "partner_id", type: "uuid", nullable: true })
  partnerId: string;

  @ManyToOne(() => Partner, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @Column({ name: "full_name", length: 100 })
  fullName: string;

  @Column({ name: "phone", length: 50, nullable: true })
  phone: string;

  @Column({ name: "mobile", length: 50, nullable: true })
  mobile: string;

  @Column({ name: "email", length: 255, nullable: true })
  email: string;

  @Column({ name: "title", length: 100, nullable: true })
  title: string;

  @Column({ name: "department", length: 100, nullable: true })
  department: string;

  @Column({ name: "note", type: "text", nullable: true })
  note: string;

  @Column({ name: "tags", type: "simple-array", nullable: true })
  tags: string[];

  @Column({ name: "is_primary", default: false })
  isPrimary: boolean;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  // Google Contacts 同步欄位
  @Column({ name: "google_resource_name", length: 255, nullable: true })
  googleResourceName: string;

  @Column({ name: "sync_status", length: 20, default: "PENDING" })
  syncStatus: string;

  @Column({ name: "last_synced_at", type: "timestamp", nullable: true })
  lastSyncedAt: Date;

  @Column({ name: "last_sync_error", type: "text", nullable: true })
  lastSyncError: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
