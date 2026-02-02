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

/**
 * DesignChangeRequest (設計變更申請)
 *
 * �?ChangeOrder (工程變更�? 區分：
 * - DCR: 設計階段變更，影響圖說、規格、材�?
 * - CO: 施工階段變更，影響金額、工�?
 *
 * 流程: 提出 �?設計審查 �?成本評估 �?核准/駁回 �?更新圖說
 */
@Entity("design_change_requests")
@Index(["projectId", "status"])
@Index(["requestDate"])
export class DesignChangeRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "dcr_number", length: 30, unique: true })
  dcrNumber: string; // DCR-YYYYMMDD-XXX

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

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "change_reason", length: 50, default: "CLIENT_REQUEST" })
  changeReason: string; // CLIENT_REQUEST | DESIGN_ERROR | REGULATION | SITE_CONDITION | VALUE_ENGINEERING

  @Column({ name: "change_category", length: 50, default: "ARCHITECTURAL" })
  changeCategory: string; // ARCHITECTURAL | STRUCTURAL | MEP | INTERIOR | LANDSCAPE

  @Column({ name: "affected_areas", type: "text", nullable: true })
  affectedAreas: string; // 受影響區域說�?

  /**
   * 受影響圖說清�?
   * [{ drawingNo, drawingName, currentVersion, newVersion }]
   */
  @Column({ name: "affected_drawings", type: "jsonb", nullable: true })
  affectedDrawings: any;

  @Column({ length: 30, default: "DRAFT" })
  status: string; // DRAFT | SUBMITTED | DESIGN_REVIEW | COST_REVIEW | APPROVED | REJECTED | CLOSED

  @Column({ name: "priority", length: 20, default: "NORMAL" })
  priority: string; // LOW | NORMAL | HIGH | URGENT

  // 成本影響
  @Column({
    name: "estimated_cost_impact",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  estimatedCostImpact: number;

  @Column({
    name: "actual_cost_impact",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  actualCostImpact: number;

  // 工期影響
  @Column({ name: "estimated_schedule_impact", default: 0, comment: "預估工期影響 (�?" })
  estimatedScheduleImpact: number;

  @Column({ name: "actual_schedule_impact", default: 0, comment: "實際工期影響 (�?" })
  actualScheduleImpact: number;

  // 日期
  @Column({ name: "request_date", type: "date" })
  requestDate: Date;

  @Column({ name: "required_by_date", type: "date", nullable: true })
  requiredByDate: Date;

  @Column({ name: "approved_date", type: "date", nullable: true })
  approvedDate: Date;

  @Column({ name: "closed_date", type: "date", nullable: true })
  closedDate: Date;

  // 申請與審�?
  @Column({ name: "requested_by", length: 100 })
  requestedBy: string;

  @Column({ name: "requested_by_company", length: 100, nullable: true })
  requestedByCompany: string;

  @Column({ name: "reviewed_by", length: 100, nullable: true })
  reviewedBy: string;

  @Column({ name: "approved_by", length: 100, nullable: true })
  approvedBy: string;

  @Column({ name: "review_comments", type: "text", nullable: true })
  reviewComments: string;

  /**
   * 關聯工程變更�?
   * 設計變更核准後可能產生的 CO
   */
  @Column({ name: "related_change_order_id", length: 36, nullable: true })
  relatedChangeOrderId: string;

  /**
   * 附件
   * [{ fileId, fileName, fileType, uploadedAt }]
   */
  @Column({ type: "jsonb", nullable: true })
  attachments: any;

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
