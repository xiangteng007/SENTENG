import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('vendor_contacts')
@Index(['vendorId'])
export class VendorContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vendor_id', length: 20 })
  vendorId: string;

  @ManyToOne(() => Vendor, vendor => vendor.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, nullable: true })
  title: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: 'line_id', length: 50, nullable: true })
  lineId: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Google Contacts sync
  @Column({ name: 'google_contact_id', length: 100, nullable: true })
  googleContactId: string;

  @Column({ name: 'sync_status', length: 20, default: 'PENDING' })
  syncStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
