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
import { Project } from "../../../projects/project.entity";
import { Contract } from "../../../contracts/contract.entity";

/**
 * WarrantyPeriod (保固期管理)
 * 追蹤工程保固期限、維修紀錄、保固金釋放
 */
@Entity("warranty_periods")
@Index(["projectId", "status"])
@Index(["endDate"])
export class WarrantyPeriod {
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

  // AcceptanceRecord 關聯 (暫時只存 ID，待 module 完整設置後再加入 ManyToOne)
  @Column({ name: "acceptance_record_id", length: 36, nullable: true })
  acceptanceRecordId: string;

  @Column({ length: 100 })
  title: string;

  @Column({ name: "warranty_type", length: 30, default: "GENERAL" })
  warrantyType: string; // GENERAL | STRUCTURAL | MEP | WATERPROOF | EQUIPMENT

  @Column({ name: "start_date", type: "date" })
  startDate: Date;

  @Column({ name: "end_date", type: "date" })
  endDate: Date;

  @Column({ name: "duration_months", default: 12 })
  durationMonths: number;

  @Column({ length: 30, default: "ACTIVE" })
  status: string; // ACTIVE | EXPIRING_SOON | EXPIRED | CLAIM_IN_PROGRESS | COMPLETED

  @Column({
    name: "warranty_bond_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  warrantyBondAmount: number;

  @Column({ name: "warranty_bond_status", length: 30, default: "HELD" })
  warrantyBondStatus: string; // HELD | PARTIAL_RELEASE | RELEASED

  @Column({
    name: "warranty_bond_released",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  warrantyBondReleased: number;

  @Column({ name: "claim_count", default: 0 })
  claimCount: number;

  @Column({ type: "text", nullable: true })
  terms: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  /**
   * 維修紀錄
   * [{ date, description, resolvedAt, cost }]
   */
  @Column({ name: "repair_logs", type: "jsonb", nullable: true })
  repairLogs: any;

  @Column({ name: "contractor_name", length: 100, nullable: true })
  contractorName: string;

  @Column({ name: "contractor_contact", length: 100, nullable: true })
  contractorContact: string;

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
