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
import { JobSite } from "../../../platform/sites/entities/job-site.entity";

/**
 * SiteDiary (工地日誌)
 */
@Entity("site_diaries")
@Index(["projectId", "diaryDate"])
export class SiteDiary {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "job_site_id", length: 20, nullable: true })
  jobSiteId: string;

  @ManyToOne(() => JobSite)
  @JoinColumn({ name: "job_site_id" })
  jobSite: JobSite;

  @Column({ name: "diary_date", type: "date" })
  diaryDate: Date;

  @Column({ length: 50, nullable: true })
  weather: string;

  @Column({
    name: "temperature_high",
    type: "decimal",
    precision: 4,
    scale: 1,
    nullable: true,
  })
  temperatureHigh: number;

  @Column({
    name: "temperature_low",
    type: "decimal",
    precision: 4,
    scale: 1,
    nullable: true,
  })
  temperatureLow: number;

  @Column({ name: "workers_count", nullable: true })
  workersCount: number;

  @Column({ name: "work_summary", type: "text", nullable: true })
  workSummary: string;

  @Column({ type: "text", nullable: true })
  issues: string;

  @Column({ name: "safety_notes", type: "text", nullable: true })
  safetyNotes: string;

  /**
   * 照片
   * [{ url, caption, takenAt }]
   */
  @Column({ type: "jsonb", nullable: true })
  photos: Record<string, unknown>;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
