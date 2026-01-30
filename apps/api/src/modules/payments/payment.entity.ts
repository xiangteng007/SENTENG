import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from '../contracts/contract.entity';
import { Project } from '../projects/project.entity';

@Entity('payment_applications')
export class PaymentApplication {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'contract_id', length: 20 })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'project_id', length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'period_no', default: 1 })
  periodNo: number;

  @Column({ name: 'application_date', type: 'date' })
  applicationDate: Date;

  @Column({
    name: 'progress_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  progressPercent: number;

  @Column({
    name: 'cumulative_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  cumulativePercent: number;

  @Column({
    name: 'request_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  requestAmount: number;

  @Column({
    name: 'retention_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  retentionAmount: number;

  @Column({
    name: 'net_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  netAmount: number;

  @Column({
    name: 'received_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  receivedAmount: number;

  @Column({ length: 30, default: 'PAY_DRAFT' })
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
}

@Entity('payment_receipts')
export class PaymentReceipt {
  @PrimaryColumn({ length: 30 })
  id: string;

  @Column({ name: 'application_id', length: 20 })
  applicationId: string;

  @ManyToOne(() => PaymentApplication)
  @JoinColumn({ name: 'application_id' })
  application: PaymentApplication;

  @Column({ name: 'receipt_date', type: 'date' })
  receiptDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'payment_method', length: 30, default: 'BANK_TRANSFER' })
  paymentMethod: string;

  @Column({ name: 'reference_no', length: 50, nullable: true })
  referenceNo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
