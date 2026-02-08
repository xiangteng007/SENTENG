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
 * DesignChangeRequest (設計變更)
 * DCR-001: 區分一般變更設計與工程變更�?CO)
 *
 * 變更設計 = 設計�?規格變更
 * 工程變更�?= 合約金額變更
 */
@Entity("design_change_requests")
@Index(["projectId", "requestDate"])
@Index(["status"])
export class DesignChangeRequest {
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

  @Column({ name: "dcr_number", length: 30 })
  dcrNumber: string; // DCR-2026-0001

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  /**
   * 變更類型
   * DESIGN: 設計變更 (圖說/規格)
   * MATERIAL: 材料變更
   * METHOD: 工法變更
   * SCOPE: 範圍增減
   */
  @Column({ name: "change_type", length: 30, default: "DESIGN" })
  changeType: string;

  /**
   * 變更原因
   */
  @Column({ name: "change_reason", length: 50, nullable: true })
  changeReason: string; // OWNER_REQUEST | SITE_CONDITION | CODE_COMPLIANCE | COST_OPTIMIZATION | ERROR_CORRECTION

  @Column({ name: "request_date", type: "date" })
  requestDate: Date;

  @Column({ name: "requested_by", length: 100, nullable: true })
  requestedBy: string;

  /**
   * 狀�?
   */
  @Column({ length: 30, default: "DRAFT" })
  status: string; // DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | IMPLEMENTED

  /**
   * 是否產生工程變更�?(CO)
   */
  @Column({ name: "requires_change_order", default: false })
  requiresChangeOrder: boolean;

  @Column({ name: "change_order_id", length: 36, nullable: true })
  changeOrderId: string;

  /**
   * 影響評估
   */
  @Column({ name: "cost_impact", type: "decimal", precision: 15, scale: 2, default: 0 })
  costImpact: number; // 正數=追加, 負數=減帳

  @Column({ name: "schedule_impact_days", default: 0 })
  scheduleImpactDays: number; // 正數=延長, 負數=縮短

  @Column({ name: "affected_areas", type: "text", nullable: true })
  affectedAreas: string; // 受影響區�?

  @Column({ name: "affected_drawings", type: "jsonb", nullable: true })
  affectedDrawings: Record<string, unknown>; // [{ drawingNo, revision, description }]

  /**
   * 審核流程
   */
  @Column({ name: "reviewed_by", length: 100, nullable: true })
  reviewedBy: string;

  @Column({ name: "reviewed_at", type: "timestamp", nullable: true })
  reviewedAt: Date;

  @Column({ name: "approved_by", length: 100, nullable: true })
  approvedBy: string;

  @Column({ name: "approved_at", type: "timestamp", nullable: true })
  approvedAt: Date;

  @Column({ name: "review_notes", type: "text", nullable: true })
  reviewNotes: string;

  /**
   * 圖說版本管理
   */
  @Column({ name: "before_revision", length: 20, nullable: true })
  beforeRevision: string; // 變更前版�?

  @Column({ name: "after_revision", length: 20, nullable: true })
  afterRevision: string; // 變更後版�?

  /**
   * 附件
   */
  @Column({ type: "jsonb", nullable: true })
  attachments: Record<string, unknown>; // [{ url, filename, type, uploadedAt }]

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
