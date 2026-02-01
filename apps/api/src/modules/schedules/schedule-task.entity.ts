import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

/**
 * 甘特圖任務實體
 *
 * 用於工程進度視覺化與追蹤
 */
@Entity("schedule_tasks")
@Index(["projectId", "startDate"])
export class ScheduleTask {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  projectId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "date" })
  startDate: Date;

  @Column({ type: "date" })
  endDate: Date;

  @Column({ type: "int", default: 0 })
  progress: number; // 0-100 完成百分比

  @Column({ length: 50, default: "task" })
  type: "task" | "milestone" | "project" | "phase";

  @Column({ length: 50, default: "pending" })
  status: "pending" | "in_progress" | "completed" | "delayed" | "cancelled";

  @Column({ type: "uuid", nullable: true })
  parentId: string; // 父任務 (WBS 結構)

  @Column({ type: "simple-array", nullable: true })
  dependencies: string[]; // 前置任務 IDs

  @Column({ length: 100, nullable: true })
  assignee: string;

  @Column({ type: "uuid", nullable: true })
  assigneeId: string;

  @Column({ length: 7, default: "#3B82F6" })
  color: string; // Hex color

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  actualCost: number;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 任務依賴關係
 */
@Entity("schedule_dependencies")
export class ScheduleDependency {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  taskId: string; // 後置任務

  @Column({ type: "uuid" })
  dependsOnTaskId: string; // 前置任務

  @Column({ length: 20, default: "finish_to_start" })
  type:
    | "finish_to_start"
    | "start_to_start"
    | "finish_to_finish"
    | "start_to_finish";

  @Column({ type: "int", default: 0 })
  lagDays: number; // 延遲天數

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * 里程碑
 */
@Entity("schedule_milestones")
export class ScheduleMilestone {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  projectId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "date" })
  targetDate: Date;

  @Column({ type: "date", nullable: true })
  actualDate: Date;

  @Column({ length: 50, default: "pending" })
  status: "pending" | "completed" | "missed";

  @Column({ type: "boolean", default: false })
  isContractual: boolean; // 合約里程碑

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  paymentAmount: number; // 里程碑付款金額

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
