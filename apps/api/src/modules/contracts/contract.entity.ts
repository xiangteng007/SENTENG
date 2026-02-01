import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "../projects/project.entity";
import { Quotation } from "../quotations/quotation.entity";

@Entity("contracts")
export class Contract {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "quotation_id", length: 20, nullable: true })
  quotationId: string;

  @ManyToOne(() => Quotation)
  @JoinColumn({ name: "quotation_id" })
  quotation: Quotation;

  @Column({ name: "contract_no", length: 50, nullable: true })
  contractNo: string;

  @Column({ length: 200 })
  title: string;

  @Column({ name: "contract_type", length: 30, default: "FIXED_PRICE" })
  contractType: string;

  @Column({ length: 3, default: "TWD" })
  currency: string;

  @Column({
    name: "original_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  originalAmount: number;

  @Column({
    name: "change_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  changeAmount: number;

  @Column({
    name: "current_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  currentAmount: number;

  @Column({
    name: "retention_rate",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
  })
  retentionRate: number;

  @Column({
    name: "retention_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  retentionAmount: number;

  @Column({ name: "payment_terms", length: 30, default: "PROGRESS" })
  paymentTerms: string;

  @Column({ name: "sign_date", type: "date", nullable: true })
  signDate: Date;

  @Column({ name: "start_date", type: "date", nullable: true })
  startDate: Date;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate: Date;

  @Column({ name: "warranty_months", default: 12 })
  warrantyMonths: number;

  @Column({ name: "warranty_end", type: "date", nullable: true })
  warrantyEnd: Date;

  @Column({ length: 30, default: "CTR_DRAFT" })
  status: string;

  @Column({ name: "locked_at", nullable: true })
  lockedAt: Date;

  @Column({ name: "locked_by", length: 20, nullable: true })
  lockedBy: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "updated_by", type: "varchar", length: 20, nullable: true })
  updatedBy: string | null;
}
