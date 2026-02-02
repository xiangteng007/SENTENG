import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Tree,
  TreeChildren,
  TreeParent,
} from "typeorm";
import { Project } from "../../../projects/project.entity";

/**
 * WbsItem (工作分解結構)
 *
 * 使用 Closure Table 策略支援階層結構。
 */
@Entity("wbs_items")
@Tree("closure-table")
export class WbsItem {
  @PrimaryColumn({ length: 30 })
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "wbs_code", length: 30, nullable: true })
  wbsCode: string;

  @Column({ length: 200 })
  name: string;

  @Column({ default: 1 })
  level: number;

  @Column({ name: "planned_start", type: "date", nullable: true })
  plannedStart: Date;

  @Column({ name: "planned_end", type: "date", nullable: true })
  plannedEnd: Date;

  @Column({ name: "actual_start", type: "date", nullable: true })
  actualStart: Date;

  @Column({ name: "actual_end", type: "date", nullable: true })
  actualEnd: Date;

  @Column({
    name: "percent_complete",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
  })
  percentComplete: number;

  @Column({
    name: "budget_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  budgetAmount: number;

  @Column({
    name: "actual_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  actualAmount: number;

  /**
   * 狀態
   * - NOT_STARTED: 未開始
   * - IN_PROGRESS: 進行中
   * - COMPLETED: 已完成
   * - ON_HOLD: 暫停
   * - CANCELLED: 已取消
   */
  @Column({ length: 20, default: "NOT_STARTED" })
  status: string;

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;

  @Column({ name: "sequence_order", default: 0, comment: "工序順序 (室裝: 水電→泥作→木作→油漆)" })
  sequenceOrder: number;

  @Column({ name: "is_critical_path", default: false })
  isCriticalPath: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Tree relations
  @TreeChildren()
  children: WbsItem[];

  @TreeParent()
  parent: WbsItem;
}

/**
 * Schedule (進度排程)
 *
 * 簡化版進度管理，關聯到 WBS。
 */
@Entity("schedules")
export class Schedule {
  @PrimaryColumn({ length: 30 })
  id: string;

  @Column({ name: "wbs_item_id", length: 30 })
  wbsItemId: string;

  @ManyToOne(() => WbsItem)
  @JoinColumn({ name: "wbs_item_id" })
  wbsItem: WbsItem;

  @Column({ name: "planned_start", type: "date" })
  plannedStart: Date;

  @Column({ name: "planned_end", type: "date" })
  plannedEnd: Date;

  @Column({ name: "planned_duration", nullable: true })
  plannedDuration: number; // days

  @Column({ type: "text", array: true, nullable: true })
  predecessors: string[]; // wbs_item_ids

  @Column({ type: "text", array: true, nullable: true })
  successors: string[];

  @Column({ name: "is_milestone", default: false })
  isMilestone: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
