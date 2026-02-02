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

/**
 * PunchListItem (驗收缺失項目)
 * 追蹤驗收發現的缺失與改善狀態
 */
@Entity("punch_list_items")
@Index(["projectId", "status"])
@Index(["acceptanceRecordId"])
export class PunchListItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 36 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  // AcceptanceRecord 關聯 (暫時只存 ID，待 module 完整設置後再加入 ManyToOne)
  @Column({ name: "acceptance_record_id", length: 36, nullable: true })
  acceptanceRecordId: string;

  @Column({ name: "item_number", length: 20 })
  itemNumber: string;

  @Column({ length: 200 })
  description: string;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ length: 50, nullable: true })
  category: string; // STRUCTURE | MEP | FINISH | EXTERIOR | SAFETY | OTHER

  @Column({ length: 20, default: "MEDIUM" })
  severity: string; // LOW | MEDIUM | HIGH | CRITICAL

  @Column({ length: 30, default: "OPEN" })
  status: string; // OPEN | IN_PROGRESS | RESOLVED | VERIFIED | WAIVED

  @Column({ name: "responsible_party", length: 100, nullable: true })
  responsibleParty: string;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt: Date;

  @Column({ name: "resolved_by", length: 36, nullable: true })
  resolvedBy: string;

  @Column({ name: "resolution_notes", type: "text", nullable: true })
  resolutionNotes: string;

  @Column({ name: "verified_at", type: "timestamp", nullable: true })
  verifiedAt: Date;

  @Column({ name: "verified_by", length: 36, nullable: true })
  verifiedBy: string;

  /**
   * 缺失照片
   * [{ url, caption, takenAt, location }]
   */
  @Column({ name: "defect_photos", type: "jsonb", nullable: true })
  defectPhotos: any;

  /**
   * 改善後照片
   * [{ url, caption, takenAt }]
   */
  @Column({ name: "resolution_photos", type: "jsonb", nullable: true })
  resolutionPhotos: any;

  @Column({ name: "created_by", length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
