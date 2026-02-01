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
import { Vendor } from "./vendor.entity";

@Entity("vendor_contacts")
@Index(["vendorId"])
export class VendorContact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "vendor_id", length: 20 })
  vendorId: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.contacts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vendor_id" })
  vendor: Vendor;

  // Contact name - supports both 'name' and 'fullName' access patterns
  @Column({ name: "full_name", length: 100 })
  fullName: string;

  // Alias getter for backward compatibility
  get name(): string {
    return this.fullName;
  }

  @Column({ length: 50, nullable: true })
  title: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 50, nullable: true })
  mobile: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ name: "line_id", length: 50, nullable: true })
  lineId: string;

  @Column({ name: "is_primary", default: false })
  isPrimary: boolean;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "tags", type: "simple-array", nullable: true })
  tags: string[];

  @Column({ name: "note", type: "text", nullable: true })
  note: string;

  // Alias for backward compatibility
  get notes(): string {
    return this.note;
  }

  // Google Contacts sync fields
  @Column({ name: "google_resource_name", length: 255, nullable: true })
  googleResourceName: string;

  // Alias for backward compatibility
  get googleContactId(): string {
    return this.googleResourceName;
  }

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
