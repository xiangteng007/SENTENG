import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';

@Entity('quotations')
export class Quotation {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'project_id', length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'version_no', default: 1 })
  versionNo: number;

  @Column({ name: 'parent_id', length: 20, nullable: true })
  parentId: string;

  @Column({ name: 'is_current', default: true })
  isCurrent: boolean;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column({ length: 3, default: 'TWD' })
  currency: string;

  @Column({
    name: 'exchange_rate',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 1,
  })
  exchangeRate: number;

  @Column({ name: 'is_tax_included', default: true })
  isTaxIncluded: boolean;

  @Column({
    name: 'tax_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 5,
  })
  taxRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: Date;

  @Column({ length: 30, default: 'QUO_DRAFT' })
  status: string;

  @Column({ name: 'locked_at', nullable: true })
  lockedAt: Date;

  @Column({ name: 'locked_by', length: 20, nullable: true })
  lockedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 20, nullable: true })
  updatedBy: string | null;

  @OneToMany(() => QuotationItem, item => item.quotation, { cascade: true })
  items: QuotationItem[];
}

@Entity('quotation_items')
export class QuotationItem {
  @PrimaryColumn({ length: 30 })
  id: string;

  @Column({ name: 'quotation_id', length: 20 })
  quotationId: string;

  @ManyToOne(() => Quotation, quotation => quotation.items)
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column({ name: 'item_order', default: 0 })
  itemOrder: number;

  @Column({ length: 50, nullable: true })
  category: string;

  @Column({ name: 'item_name', length: 200 })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  spec: string;

  @Column({ length: 20, default: '式' })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  remark: string;
}
