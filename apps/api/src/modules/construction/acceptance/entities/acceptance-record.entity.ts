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
 * AcceptanceRecord (驗收紀錄)
 * 管理工程階段性驗收與竣工驗收
 */
@Entity("acceptance_records")
@Index(["projectId", "acceptanceDate"])
export class AcceptanceRecord {
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

  @Column({ name: "acceptance_type", length: 30, default: "MILESTONE" })
  acceptanceType: string; // MILESTONE | PARTIAL | FINAL | WARRANTY_END

  @Column({ length: 100 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "acceptance_date", type: "date" })
  acceptanceDate: Date;

  @Column({ name: "scheduled_date", type: "date", nullable: true })
  scheduledDate: Date;

  @Column({ length: 30, default: "PENDING" })
  status: string; // PENDING | IN_PROGRESS | PASSED | FAILED | CONDITIONAL

  @Column({
    name: "completion_percentage",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
  })
  completionPercentage: number;

  @Column({ name: "inspector_name", length: 100, nullable: true })
  inspectorName: string;

  @Column({ name: "inspector_company", length: 100, nullable: true })
  inspectorCompany: string;

  @Column({ type: "text", nullable: true })
  findings: string;

  @Column({ type: "text", nullable: true })
  conditions: string;

  @Column({ name: "punch_item_count", default: 0 })
  punchItemCount: number;

  @Column({ name: "punch_item_resolved", default: 0 })
  punchItemResolved: number;

  /**
   * 附件與照片
   * [{ url, caption, type }]
   */
  @Column({ type: "jsonb", nullable: true })
  attachments: any;

  /**
   * 簽核紀錄
   * [{ signedBy, signedAt, role, signature }]
   */
  @Column({ type: "jsonb", nullable: true })
  signatures: any;

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
