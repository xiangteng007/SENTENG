import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { VendorContact } from './vendor-contact.entity';
import { VendorTrade } from './vendor-trade.entity';

export enum VendorType {
  SUPPLIER = 'SUPPLIER', // 供應商
  SUBCONTRACTOR = 'SUBCONTRACTOR', // 分包商/工班
  CONSULTANT = 'CONSULTANT', // 顧問
}

export enum VendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

export enum PaymentTerms {
  COD = 'COD', // 貨到付款
  NET15 = 'NET15',
  NET30 = 'NET30',
  NET60 = 'NET60',
  ADVANCE = 'ADVANCE', // 預付
}

@Entity('vendors')
@Index(['vendorType'])
@Index(['status'])
@Index(['createdAt'])
export class Vendor {
  @PrimaryColumn({ length: 20 })
  id: string; // VND-YYYYMM-XXXX

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'short_name', length: 30, nullable: true })
  shortName: string;

  @Column({ name: 'vendor_type', length: 30, default: VendorType.SUPPLIER })
  vendorType: VendorType;

  @Column({ name: 'tax_id', length: 20, nullable: true })
  taxId: string;

  @Column({ name: 'contact_person', length: 50, nullable: true })
  contactPerson: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: 'line_id', length: 50, nullable: true })
  lineId: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  // Banking info
  @Column({ name: 'bank_name', length: 50, nullable: true })
  bankName: string;

  @Column({ name: 'bank_code', length: 10, nullable: true })
  bankCode: string;

  @Column({ name: 'bank_account', length: 50, nullable: true })
  bankAccount: string;

  @Column({ name: 'account_holder', length: 50, nullable: true })
  accountHolder: string;

  // Payment & Credit
  @Column({ name: 'payment_terms', length: 30, default: PaymentTerms.NET30 })
  paymentTerms: PaymentTerms;

  @Column({ name: 'tax_type', length: 20, default: 'TAX_INCLUDED' })
  taxType: string; // TAX_INCLUDED / TAX_EXCLUDED / TAX_EXEMPT

  // Rating & Performance - Detailed Scores
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number; // 0.00 - 5.00 (overall weighted average)

  @Column({ name: 'quality_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  qualityScore: number; // 品質評分 0-5

  @Column({ name: 'delivery_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  deliveryScore: number; // 交期評分 0-5

  @Column({ name: 'price_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  priceScore: number; // 價格評分 0-5

  @Column({ name: 'service_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  serviceScore: number; // 服務評分 0-5

  @Column({ name: 'total_projects', default: 0 })
  totalProjects: number;

  @Column({ name: 'total_orders', default: 0 })
  totalOrders: number; // 總採購單數

  @Column({ name: 'on_time_deliveries', default: 0 })
  onTimeDeliveries: number; // 準時交貨次數

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number; // 評鑑次數

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  // Classification
  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ length: 20, default: VendorStatus.ACTIVE })
  status: VendorStatus;

  @Column({ name: 'blacklist_reason', type: 'text', nullable: true })
  blacklistReason: string | null;

  // Documents
  @Column({ name: 'drive_folder', length: 500, nullable: true })
  driveFolder: string;

  // Flexible fields
  @Column({ type: 'jsonb', nullable: true })
  certifications: { name: string; expiryDate: string; fileUrl?: string }[];

  @Column({ type: 'jsonb', nullable: true })
  reviews: {
    projectId: string;
    rating: number;
    comment: string;
    date: string;
  }[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @OneToMany(() => VendorContact, contact => contact.vendor, {
    cascade: true,
  })
  contacts: VendorContact[];

  @OneToMany(() => VendorTrade, trade => trade.vendor, { cascade: true })
  trades: VendorTrade[];

  // Audit
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 20, nullable: true })
  updatedBy: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
