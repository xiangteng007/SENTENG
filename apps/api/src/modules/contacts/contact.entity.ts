/**
 * contact.entity.ts
 *
 * Unified contact entity supporting polymorphic relationships
 * with Customer, Vendor, and Project entities.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * Contact owner types for polymorphic relationship
 */
export enum ContactOwnerType {
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR",
  PROJECT = "PROJECT",
}

/**
 * Contact roles within organizations
 */
export enum ContactRole {
  OWNER = "OWNER", // 屋主
  DESIGNER = "DESIGNER", // 設計師
  SUPERVISOR = "SUPERVISOR", // 監造
  PROCUREMENT = "PROCUREMENT", // 採購
  ACCOUNTANT = "ACCOUNTANT", // 會計
  SALES = "SALES", // 業務
  TECHNICAL = "TECHNICAL", // 技術
  MANAGER = "MANAGER", // 經理
  OTHER = "OTHER",
}

/**
 * Google Contacts sync status
 */
export enum ContactSyncStatus {
  PENDING = "PENDING",
  SYNCED = "SYNCED",
  FAILED = "FAILED",
  DISABLED = "DISABLED",
}

@Entity("contacts")
@Index(["ownerType", "ownerId"])
@Index(["googleContactId"])
@Index(["syncStatus"])
export class Contact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Polymorphic owner relationship
  @Column({ name: "owner_type", type: "varchar", length: 20 })
  ownerType: ContactOwnerType;

  @Column({ name: "owner_id", length: 36 })
  ownerId: string;

  // Basic contact info
  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  title: string; // 職稱

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({
    type: "varchar",
    length: 30,
    default: ContactRole.OTHER,
  })
  role: ContactRole;

  // Communication channels
  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 30, nullable: true })
  mobile: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: "line_id", length: 50, nullable: true })
  lineId: string;

  // Status flags
  @Column({ name: "is_primary", default: false })
  isPrimary: boolean;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  // Notes and tags
  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "simple-array", nullable: true })
  tags: string[];

  // Google Contacts integration
  @Column({ name: "google_contact_id", length: 255, nullable: true })
  googleContactId: string;

  @Column({ name: "google_resource_name", length: 255, nullable: true })
  googleResourceName: string;

  @Column({
    name: "sync_status",
    type: "varchar",
    length: 20,
    default: ContactSyncStatus.PENDING,
  })
  syncStatus: ContactSyncStatus;

  @Column({ name: "last_synced_at", type: "timestamp", nullable: true })
  lastSyncedAt: Date;

  @Column({ name: "last_sync_error", type: "text", nullable: true })
  lastSyncError: string;

  // Audit fields
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
