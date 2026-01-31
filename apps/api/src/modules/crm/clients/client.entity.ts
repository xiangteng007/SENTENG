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
import { ClientContact } from '../../integrations/entities/client-contact.entity';

@Entity('clients')
export class Client {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, default: 'COMPANY' })
  type: string;

  @Column({ name: 'tax_id', length: 15, nullable: true })
  taxId: string;

  @Column({ name: 'contact_name', length: 50, nullable: true })
  contactName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'default_currency', length: 3, default: 'TWD' })
  defaultCurrency: string;

  @Column({ name: 'credit_days', default: 30 })
  creditDays: number;

  @Column({ name: 'credit_rating', length: 1, default: 'B' })
  creditRating: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // 新增前端需要的欄位
  @Column({ name: 'line_id', length: 50, nullable: true })
  lineId: string;

  @Column({ length: 50, nullable: true })
  source: string;

  @Column({ length: 50, nullable: true })
  budget: string;

  @Column({ name: 'drive_folder', length: 500, nullable: true })
  driveFolder: string;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: any[];

  @Column({ name: 'contact_logs', type: 'jsonb', nullable: true })
  contactLogs: any[];

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  // 聯絡人關聯 (1:N)
  @OneToMany(() => ClientContact, contact => contact.client)
  contacts: ClientContact[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 20, nullable: true })
  updatedBy: string | null;
}
