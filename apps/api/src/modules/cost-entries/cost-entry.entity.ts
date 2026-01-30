import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { Contract } from '../contracts/contract.entity';

@Entity('cost_entries')
export class CostEntry {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'project_id', length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'contract_id', length: 20, nullable: true })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: Date;

  @Column({ length: 30 })
  category: string;

  @Column({ length: 200 })
  description: string;

  @Column({ name: 'vendor_id', length: 20, nullable: true })
  vendorId: string;

  @Column({ name: 'vendor_name', length: 100, nullable: true })
  vendorName: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ name: 'payment_method', length: 30, nullable: true })
  paymentMethod: string;

  @Column({ name: 'invoice_no', length: 50, nullable: true })
  invoiceNo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
