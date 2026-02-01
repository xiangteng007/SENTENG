import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "../projects/project.entity";

/**
 * Event Entity
 *
 * 行事曆事件，支援專案關聯、全天事件、重複事件等
 */
@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "start_time", type: "timestamp" })
  startTime: Date;

  @Column({ name: "end_time", type: "timestamp", nullable: true })
  endTime: Date;

  @Column({ name: "all_day", default: false })
  allDay: boolean;

  @Column({ length: 30, default: "general" })
  category: string; // general, meeting, deadline, reminder, milestone

  @Column({ length: 20, default: "#3b82f6" })
  color: string; // Hex color code

  @Column({ length: 100, nullable: true })
  location: string;

  // Project association
  @Column({ name: "project_id", length: 20, nullable: true })
  projectId: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: "project_id" })
  project: Project;

  // Recurrence settings (simplified)
  @Column({ name: "recurrence_rule", length: 100, nullable: true })
  recurrenceRule: string; // RRULE format (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)

  @Column({ name: "recurrence_end", type: "date", nullable: true })
  recurrenceEnd: Date;

  // Google Calendar Sync
  @Column({ name: "google_event_id", length: 200, nullable: true })
  googleEventId: string;

  @Column({ name: "google_calendar_id", length: 200, nullable: true })
  googleCalendarId: string;

  @Column({ name: "sync_status", length: 20, default: "PENDING" })
  syncStatus: string; // PENDING, SYNCED, FAILED, DISABLED

  @Column({ name: "last_synced_at", type: "timestamp", nullable: true })
  lastSyncedAt: Date;

  @Column({ name: "last_sync_error", type: "text", nullable: true })
  lastSyncError: string;

  // Legacy external sync (for backwards compatibility)
  @Column({ name: "external_id", length: 200, nullable: true })
  externalId: string;

  @Column({ name: "external_source", length: 30, nullable: true })
  externalSource: string;

  // Reminder
  @Column({ name: "reminder_minutes", default: 30 })
  reminderMinutes: number;

  // Status
  @Column({ length: 20, default: "scheduled" })
  status: string; // scheduled, completed, cancelled

  // Audit
  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "updated_by", type: "varchar", length: 20, nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
