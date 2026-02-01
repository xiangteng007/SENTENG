import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Project } from "../projects/project.entity";

export enum WeatherCondition {
  SUNNY = "SUNNY",
  CLOUDY = "CLOUDY",
  RAINY = "RAINY",
  STORMY = "STORMY",
  WINDY = "WINDY",
}

@Entity("site_logs")
@Index(["projectId", "logDate"])
@Index(["logDate"])
export class SiteLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "log_date", type: "date" })
  logDate: Date;

  @Column({ name: "weather_am", length: 20, nullable: true })
  weatherAm: string;

  @Column({ name: "weather_pm", length: 20, nullable: true })
  weatherPm: string;

  @Column({ name: "temp_high", type: "int", nullable: true })
  tempHigh: number;

  @Column({ name: "temp_low", type: "int", nullable: true })
  tempLow: number;

  // Workforce
  @Column({ name: "workers_own", type: "int", default: 0 })
  workersOwn: number;

  @Column({ name: "workers_subcon", type: "int", default: 0 })
  workersSubcon: number;

  @Column({ type: "jsonb", nullable: true })
  workforce: {
    trade: string;
    count: number;
    vendor?: string;
  }[];

  // Equipment
  @Column({ type: "jsonb", nullable: true })
  equipment: {
    name: string;
    quantity: number;
    hours?: number;
  }[];

  // Work performed
  @Column({ name: "work_performed", type: "text", nullable: true })
  workPerformed: string;

  @Column({ type: "jsonb", nullable: true })
  activities: {
    location: string;
    description: string;
    progress: number;
  }[];

  // Materials
  @Column({ type: "jsonb", nullable: true })
  materials: {
    name: string;
    quantity: number;
    unit: string;
    received?: boolean;
  }[];

  // Issues & Notes
  @Column({ type: "jsonb", nullable: true })
  issues: {
    type: string;
    description: string;
    resolved: boolean;
  }[];

  @Column({ type: "jsonb", nullable: true })
  visitors: {
    name: string;
    company: string;
    purpose: string;
    timeIn: string;
    timeOut?: string;
  }[];

  @Column({ type: "jsonb", nullable: true })
  safety: {
    incidents: number;
    nearMisses: number;
    notes?: string;
  };

  @Column({ type: "text", nullable: true })
  notes: string;

  // Photos
  @Column({ type: "jsonb", nullable: true })
  photos: {
    url: string;
    caption: string;
    location?: string;
  }[];

  // Approval
  @Column({ name: "submitted_by", type: "varchar", length: 20, nullable: true })
  submittedBy: string | null;

  @Column({ name: "submitted_at", type: "timestamp", nullable: true })
  submittedAt: Date;

  @Column({ name: "approved_by", type: "varchar", length: 20, nullable: true })
  approvedBy: string | null;

  @Column({ name: "approved_at", type: "timestamp", nullable: true })
  approvedAt: Date | null;

  @Column({ name: "is_approved", default: false })
  isApproved: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
