/**
 * ProjectPartner Entity
 *
 * 專案合作夥伴關聯（多對多中間表）
 * 支援角色（承包商/供應商/設計師等）和額外關聯資訊
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { Project } from "./project.entity";

export enum ProjectPartnerRole {
  CONTRACTOR = "CONTRACTOR", // 承包商
  SUBCONTRACTOR = "SUBCONTRACTOR", // 分包商
  SUPPLIER = "SUPPLIER", // 供應商
  DESIGNER = "DESIGNER", // 設計師
  CONSULTANT = "CONSULTANT", // 顧問
  OTHER = "OTHER", // 其他
}

@Entity("project_partners")
@Index(["projectId"])
@Index(["partnerId"])
@Unique(["projectId", "partnerId"])
export class ProjectPartner {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "partner_id", type: "uuid" })
  partnerId: string;

  // 使用 lazy import 避免循環依賴
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  @ManyToOne(() => require("../partners/partner.entity").Partner, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partner_id" })
  partner: import("../partners/partner.entity").Partner;

  @Column({
    length: 30,
    default: ProjectPartnerRole.CONTRACTOR,
  })
  role: ProjectPartnerRole;

  // 合約金額（與此專案相關）
  @Column({
    name: "contract_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  contractAmount: number;

  // 合約開始日期
  @Column({ name: "start_date", type: "date", nullable: true })
  startDate: Date;

  // 合約結束日期
  @Column({ name: "end_date", type: "date", nullable: true })
  endDate: Date;

  @Column({ type: "text", nullable: true })
  notes: string;

  // 審計欄位
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;
}
