import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Project } from "../../../projects/project.entity";
import { BimModel } from "../../models/entities/bim-model.entity";
import { ChangeOrder } from "../../../change-orders/change-order.entity";
import { User } from "../../../users/user.entity";

/**
 * BcfIssue (BCF 議題/RFI)
 *
 * 用於 BIM 協作中的議題追蹤，支援 BCF 標準。
 * 可關聯到特定構件 (element_guid) 並觸發變更單。
 */
@Entity("bcf_issues")
@Index(["projectId", "status"])
@Index(["elementGuid"])
export class BcfIssue {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "model_id", length: 20, nullable: true })
  modelId: string;

  @ManyToOne(() => BimModel)
  @JoinColumn({ name: "model_id" })
  model: BimModel;

  @Column({ name: "element_guid", length: 50, nullable: true })
  elementGuid: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  /**
   * 議題類型
   * - ERROR: 錯誤
   * - WARNING: 警告
   * - INFO: 資訊
   * - RFI: Request for Information
   * - CLASH: 衝突
   */
  @Column({ name: "issue_type", length: 30, default: "INFO" })
  issueType: string;

  /**
   * 優先級
   * - LOW, NORMAL, HIGH, CRITICAL
   */
  @Column({ length: 20, default: "NORMAL" })
  priority: string;

  /**
   * 狀態
   * - OPEN, IN_PROGRESS, RESOLVED, CLOSED, WONTFIX
   */
  @Column({ length: 30, default: "OPEN" })
  status: string;

  @Column({ name: "assigned_to", length: 20, nullable: true })
  assignedTo: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "assigned_to" })
  assignee: User;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ name: "change_order_id", length: 20, nullable: true })
  changeOrderId: string;

  @ManyToOne(() => ChangeOrder)
  @JoinColumn({ name: "change_order_id" })
  changeOrder: ChangeOrder;

  /**
   * BCF Viewpoint 資料 (相機位置、方向等)
   */
  @Column({ type: "jsonb", nullable: true })
  viewpoint: any;

  /**
   * 相關截圖 URLs
   */
  @Column({ type: "text", array: true, nullable: true })
  screenshots: string[];

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "resolved_at", nullable: true })
  resolvedAt: Date;

  @Column({ name: "resolved_by", length: 20, nullable: true })
  resolvedBy: string;

  // Relations
  @OneToMany(() => IssueComment, (c) => c.issue)
  comments: IssueComment[];
}

/**
 * IssueComment (議題評論)
 */
@Entity("issue_comments")
export class IssueComment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "issue_id", type: "uuid" })
  issueId: string;

  @ManyToOne(() => BcfIssue, (i) => i.comments)
  @JoinColumn({ name: "issue_id" })
  issue: BcfIssue;

  @Column({ type: "text" })
  content: string;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
