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
import { Customer } from './customer.entity';

export enum ContactRole {
  OWNER = 'OWNER', // 屋主
  DESIGNER = 'DESIGNER', // 設計師
  SUPERVISOR = 'SUPERVISOR', // 監造
  PROCUREMENT = 'PROCUREMENT', // 採購
  ACCOUNTANT = 'ACCOUNTANT', // 會計
  OTHER = 'OTHER',
}

@Entity('customer_contacts')
@Index(['customerId'])
export class CustomerContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', length: 20 })
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 30, default: 'OTHER' })
  role: string;

  @Column({ length: 50, nullable: true })
  title: string; // 職稱

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
