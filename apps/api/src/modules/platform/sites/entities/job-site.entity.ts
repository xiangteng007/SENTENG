import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "../../../projects/project.entity";

/**
 * JobSite (作業現場)
 *
 * 代表一個實際的工作地點，包含地理位置、現場條件、聯絡人等資訊。
 * 用於無人機派工、工地日誌、安全檢查等場景。
 */
@Entity("job_sites")
export class JobSite {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: "project_id", length: 20, nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ length: 200 })
  name: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: number;

  /**
   * 風險等級
   * - LOW: 低風險
   * - MEDIUM: 中風險
   * - HIGH: 高風險
   */
  @Column({ name: "risk_level", length: 20, default: "LOW" })
  riskLevel: string;

  @Column({ name: "access_info", type: "text", nullable: true })
  accessInfo: string;

  @Column({ name: "water_source", default: false })
  waterSource: boolean;

  @Column({ name: "power_source", default: false })
  powerSource: boolean;

  @Column({ name: "contact_name", length: 50, nullable: true })
  contactName: string;

  @Column({ name: "contact_phone", length: 30, nullable: true })
  contactPhone: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;
}
