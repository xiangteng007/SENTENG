import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Partner } from "../partners/partner.entity";
// Legacy import - deprecated, use Partner instead
import { Client } from "../crm/clients/client.entity";
import { ProjectPhase } from "./project-phase.entity";
import { ProjectVendor } from "./project-vendor.entity";
import { ProjectTask } from "./project-task.entity";
import { ProjectContact } from "./project-contact.entity";
import { ProjectPartner } from "./project-partner.entity";

export enum ProjectType {
  INTERIOR = "INTERIOR", // 室內設計
  ARCHITECTURE = "ARCHITECTURE", // 建築
  CONSTRUCTION = "CONSTRUCTION", // 營造
  RENOVATION = "RENOVATION", // 翻修
}

export enum ProjectStatus {
  PLANNING = "PLANNING", // 規劃中
  DESIGN = "DESIGN", // 設計中
  CONSTRUCTION = "CONSTRUCTION", // 施工中
  COMPLETED = "COMPLETED", // 已完工
  WARRANTY = "WARRANTY", // 保固期
  CLOSED = "CLOSED", // 已結案
}

@Entity("projects")
@Index(["customerId"])
@Index(["status"])
@Index(["createdAt"])
export class Project {
  @PrimaryColumn({ length: 20 })
  id: string; // PRJ-YYYYMM-XXXX

  @Column({ name: "customer_id", length: 20 })
  /** @deprecated Use partnerId instead */
  customerId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: "customer_id" })
  /** @deprecated Use partner instead */
  client: Client;

  // Unified Partner relation (replaces client)
  @Column({ name: "partner_id", type: "uuid", nullable: true })
  partnerId: string;

  @ManyToOne(() => Partner)
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @Column({ length: 200 })
  name: string;

  @Column({ name: "project_type", length: 30, default: ProjectType.INTERIOR })
  projectType: ProjectType;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ length: 30, default: ProjectStatus.PLANNING })
  status: ProjectStatus;

  // Dates
  @Column({ name: "start_date", type: "date", nullable: true })
  startDate: Date;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate: Date;

  @Column({ name: "actual_start", type: "date", nullable: true })
  actualStart: Date;

  @Column({ name: "actual_end", type: "date", nullable: true })
  actualEnd: Date;

  // Financials
  @Column({ length: 3, default: "TWD" })
  currency: string;

  @Column({
    name: "contract_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  contractAmount: number;

  @Column({
    name: "change_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  changeAmount: number;

  @Column({
    name: "current_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  currentAmount: number;

  @Column({
    name: "cost_budget",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  costBudget: number;

  @Column({
    name: "cost_actual",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  costActual: number;

  // Revenue Recognition (完工百分比法)
  @Column({
    name: "completion_percentage",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
    comment: "完工百分比 (0-100)",
  })
  completionPercentage: number;

  @Column({
    name: "recognized_revenue",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "已認列收入",
  })
  recognizedRevenue: number;

  // Team
  @Column({ name: "pm_user_id", length: 20, nullable: true })
  pmUserId: string;

  // Documents
  @Column({ name: "drive_folder", length: 500, nullable: true })
  driveFolder: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  // Relations
  @OneToMany(() => ProjectPhase, (phase) => phase.project, { cascade: true })
  phases: ProjectPhase[];

  @OneToMany(() => ProjectVendor, (pv) => pv.project, { cascade: true })
  projectVendors: ProjectVendor[];

  @OneToMany(() => ProjectTask, (task) => task.project, { cascade: true })
  tasks: ProjectTask[];

  @OneToMany(() => ProjectContact, (pc) => pc.project, { cascade: true })
  projectContacts: ProjectContact[];

  @OneToMany(() => ProjectPartner, (pp) => pp.project, { cascade: true })
  projectPartners: ProjectPartner[];

  // Audit
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "updated_by", type: "varchar", length: 20, nullable: true })
  updatedBy: string | null;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
