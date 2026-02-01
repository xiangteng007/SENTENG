import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "../../../projects/project.entity";
import { WbsItem } from "../../wbs/entities/wbs.entity";

/**
 * QaqcIssue (品質議題)
 */
@Entity("qaqc_issues")
export class QaqcIssue {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "wbs_item_id", length: 30, nullable: true })
  wbsItemId: string;

  @ManyToOne(() => WbsItem)
  @JoinColumn({ name: "wbs_item_id" })
  wbsItem: WbsItem;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  /**
   * 類型
   * - NCR: 不符合報告
   * - DEFECT: 缺陷
   * - OBSERVATION: 觀察
   * - IMPROVEMENT: 改善建議
   */
  @Column({ name: "issue_type", length: 30, default: "OBSERVATION" })
  issueType: string;

  @Column({ length: 20, default: "NORMAL" })
  priority: string;

  @Column({ length: 30, default: "OPEN" })
  status: string;

  @Column({ name: "assigned_to", length: 20, nullable: true })
  assignedTo: string;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ type: "jsonb", nullable: true })
  photos: any;

  @Column({ name: "corrective_action", type: "text", nullable: true })
  correctiveAction: string;

  @Column({ name: "verified_by", length: 20, nullable: true })
  verifiedBy: string;

  @Column({ name: "verified_at", nullable: true })
  verifiedAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

/**
 * SafetyInspection (安全檢查)
 */
@Entity("safety_inspections")
export class SafetyInspection {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "inspection_date", type: "date" })
  inspectionDate: Date;

  @Column({ name: "inspection_type", length: 50 })
  inspectionType: string; // DAILY, WEEKLY, TOOLBOX, AUDIT

  @Column({ name: "inspector_id", length: 20, nullable: true })
  inspectorId: string;

  /**
   * 檢查項目
   * [{ category, item, compliant, notes }]
   */
  @Column({ type: "jsonb", nullable: true })
  items: any;

  @Column({
    name: "overall_score",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  overallScore: number;

  @Column({ type: "text", nullable: true })
  findings: string;

  @Column({ type: "text", nullable: true })
  recommendations: string;

  @Column({ type: "jsonb", nullable: true })
  photos: any;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

/**
 * SafetyIncident (安全事件)
 */
@Entity("safety_incidents")
export class SafetyIncident {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "incident_date", type: "date" })
  incidentDate: Date;

  @Column({ name: "incident_time", type: "time", nullable: true })
  incidentTime: string;

  /**
   * 類型
   * - NEAR_MISS: 僥倖事件
   * - FIRST_AID: 急救傷害
   * - MEDICAL: 就醫傷害
   * - LOST_TIME: 失能傷害
   * - FATALITY: 死亡
   */
  @Column({ name: "incident_type", length: 30 })
  incidentType: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ length: 200, nullable: true })
  location: string;

  @Column({ name: "persons_involved", type: "jsonb", nullable: true })
  personsInvolved: any;

  @Column({ name: "root_cause", type: "text", nullable: true })
  rootCause: string;

  @Column({ name: "corrective_actions", type: "text", nullable: true })
  correctiveActions: string;

  @Column({ type: "jsonb", nullable: true })
  photos: any;

  @Column({ length: 30, default: "REPORTED" })
  status: string;

  @Column({ name: "reported_by", length: 20, nullable: true })
  reportedBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
