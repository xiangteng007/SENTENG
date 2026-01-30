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
import { CustomerContact } from './customer-contact.entity';

/**
 * Pipeline stages for customer lifecycle
 */
export enum PipelineStage {
  LEAD = 'LEAD', // 線索
  NEGOTIATION = 'NEGOTIATION', // 洽談中
  QUOTED = 'QUOTED', // 已報價
  SIGNED = 'SIGNED', // 已簽約
  ACTIVE = 'ACTIVE', // 進行中
  COMPLETED = 'COMPLETED', // 已完工
  WARRANTY = 'WARRANTY', // 保固期
}

export enum CustomerType {
  COMPANY = 'COMPANY',
  INDIVIDUAL = 'INDIVIDUAL',
  OWNER = 'OWNER', // 業主（營造工程）
  CONTRACTOR = 'CONTRACTOR', // 承包商/協力廠商
  INTERIOR = 'INTERIOR', // 室內設計客戶
}

@Entity('customers')
@Index(['pipelineStage'])
@Index(['createdAt'])
@Index(['status'])
export class Customer {
  @PrimaryColumn({ length: 20 })
  id: string; // CLT-YYYYMM-XXXX

  @Column({ length: 20, default: CustomerType.INDIVIDUAL })
  type: CustomerType;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'tax_id', length: 15, nullable: true })
  taxId: string;

  // 主要聯絡人姓名 (from legacy clients table)
  @Column({ name: 'contact_name', length: 50, nullable: true })
  contactName: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: 'line_id', length: 50, nullable: true })
  lineId: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  // Pipeline & CRM
  @Column({
    name: 'pipeline_stage',
    length: 30,
    default: PipelineStage.LEAD,
  })
  pipelineStage: PipelineStage;

  @Column({ length: 50, nullable: true })
  source: string; // 來源：朋友介紹、網路搜尋...

  @Column({ length: 50, nullable: true })
  budget: string; // 預算範圍

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  // Credit & Payment
  @Column({ name: 'default_currency', length: 3, default: 'TWD' })
  defaultCurrency: string;

  @Column({ name: 'credit_days', default: 30 })
  creditDays: number;

  @Column({ name: 'credit_rating', length: 1, default: 'B' })
  creditRating: string; // A/B/C

  // Documents & Integration
  @Column({ name: 'drive_folder', length: 500, nullable: true })
  driveFolder: string;

  // Flexible JSON fields
  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, any>[];

  @Column({ name: 'contact_logs', type: 'jsonb', nullable: true })
  contactLogs: {
    id: number;
    type: string;
    date: string;
    note: string;
  }[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  // Relations
  @OneToMany(() => CustomerContact, contact => contact.customer, {
    cascade: true,
  })
  contacts: CustomerContact[];

  // Audit fields
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
