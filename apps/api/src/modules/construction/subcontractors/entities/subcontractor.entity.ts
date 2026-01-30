import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vendor } from '../../../vendors/vendor.entity';
import { Project } from '../../../projects/project.entity';

/**
 * Subcontractor (分包商)
 */
@Entity('subcontractors')
export class Subcontractor {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'vendor_id', length: 20, nullable: true })
  vendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'trade_type', length: 50 })
  tradeType: string; // 水電、土木、鋼構...

  @Column({ name: 'license_no', length: 50, nullable: true })
  licenseNo: string;

  @Column({ name: 'license_expiry', type: 'date', nullable: true })
  licenseExpiry: Date;

  @Column({ name: 'insurance_expiry', type: 'date', nullable: true })
  insuranceExpiry: Date;

  @Column({ name: 'safety_rating', length: 20, nullable: true })
  safetyRating: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * SubContract (分包合約)
 */
@Entity('sub_contracts')
export class SubContract {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'project_id', length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'subcontractor_id', length: 20 })
  subcontractorId: string;

  @ManyToOne(() => Subcontractor)
  @JoinColumn({ name: 'subcontractor_id' })
  subcontractor: Subcontractor;

  @Column({ name: 'contract_no', length: 50, nullable: true })
  contractNo: string;

  @Column({ length: 200 })
  title: string;

  @Column({ name: 'scope_of_work', type: 'text', nullable: true })
  scopeOfWork: string;

  @Column({ name: 'contract_amount', type: 'decimal', precision: 15, scale: 2 })
  contractAmount: number;

  @Column({
    name: 'change_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  changeAmount: number;

  @Column({
    name: 'current_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  currentAmount: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ length: 30, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * SubPayment (分包請款)
 */
@Entity('sub_payments')
export class SubPayment {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'sub_contract_id', length: 20 })
  subContractId: string;

  @ManyToOne(() => SubContract)
  @JoinColumn({ name: 'sub_contract_id' })
  subContract: SubContract;

  @Column({ name: 'period_no', default: 1 })
  periodNo: number;

  @Column({ name: 'application_date', type: 'date' })
  applicationDate: Date;

  @Column({ name: 'request_amount', type: 'decimal', precision: 15, scale: 2 })
  requestAmount: number;

  @Column({
    name: 'approved_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  approvedAmount: number;

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

  @Column({ length: 30, default: 'PENDING' })
  status: string;

  @Column({ name: 'approved_by', length: 20, nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
