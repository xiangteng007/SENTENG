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
import { Project } from "./project.entity";
import { ProjectPhase } from "./project-phase.entity";

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

@Entity("project_tasks")
@Index(["projectId"])
@Index(["assigneeId"])
@Index(["dueDate"])
export class ProjectTask {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project, (p) => p.tasks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "phase_id", type: "uuid", nullable: true })
  phaseId: string;

  @ManyToOne(() => ProjectPhase, { nullable: true })
  @JoinColumn({ name: "phase_id" })
  phase: ProjectPhase;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "assignee_id", length: 20, nullable: true })
  assigneeId: string;

  @Column({ name: "vendor_id", length: 20, nullable: true })
  vendorId: string;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ length: 20, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ length: 20, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
