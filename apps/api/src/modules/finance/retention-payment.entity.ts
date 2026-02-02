import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Project } from "../projects/project.entity";
import { Contract } from "../contracts/contract.entity";
import { Payment } from "../payments/payment.entity";

/**
 * RetentionPayment (保留款)
 * 管理工程款保留與釋放
 * 
 * 台灣營建業常見比例:
 * - 工程保留款: 5-10%
 * - 保固保留款: 3-5%
 */
@Entity("retention_payments")
@Index(["projectId", "status"])
@Index(["releaseCondition"])
export class RetentionPayment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 36 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "contract_id", length: 36, nullable: true })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: "contract_id" })
  contract: Contract;

  @Column({ name: "payment_id", length: 36, nullable: true })
  paymentId: string;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: "payment_id" })
  payment: Payment;

  @Column({ name: "retention_type", length: 30, default: "PROGRESS" })
  retentionType: string; // PROGRESS | WARRANTY | FINAL

  @Column({
    name: "retention_rate",
    type: "decimal",
    precision: 5,
    scale: 4,
    default: 0.05,
  })
  retentionRate: number; // 保留比例 (預設 5%)

  @Column({
    name: "retention_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  retentionAmount: number; // 保留金額

  @Column({
    name: "released_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  releasedAmount: number; // 已釋放金額

  @Column({ name: "release_condition", length: 50, default: "ACCEPTANCE" })
  releaseCondition: string; // ACCEPTANCE | WARRANTY_END | MILESTONE | FINAL_PAYMENT

  @Column({ name: "release_milestone", length: 100, nullable: true })
  releaseMilestone: string; // 釋放條件說明

  @Column({ length: 30, default: "HELD" })
  status: string; // HELD | PARTIAL_RELEASED | RELEASED | FORFEITED

  @Column({ name: "held_date", type: "date" })
  heldDate: Date; // 保留日期

  @Column({ name: "expected_release_date", type: "date", nullable: true })
  expectedReleaseDate: Date; // 預計釋放日期

  @Column({ name: "actual_release_date", type: "date", nullable: true })
  actualReleaseDate: Date; // 實際釋放日期

  @Column({ name: "warranty_end_date", type: "date", nullable: true })
  warrantyEndDate: Date; // 保固到期日

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ name: "approved_by", length: 36, nullable: true })
  approvedBy: string;

  @Column({ name: "approved_at", type: "timestamp", nullable: true })
  approvedAt: Date;

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
