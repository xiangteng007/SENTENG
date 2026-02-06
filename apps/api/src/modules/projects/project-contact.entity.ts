/**
 * project-contact.entity.ts
 *
 * 專案聯絡人關聯表
 * 支援從 Customer/Vendor 指派聯絡人到專案（參照模式）
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
} from "typeorm";
import { Project } from "./project.entity";

/**
 * 聯絡人來源類型
 */
export enum ProjectContactSourceType {
  UNIFIED = "UNIFIED",     // 統一聯絡人表 (contacts)
  CUSTOMER = "CUSTOMER",   // 客戶聯絡人 (customer_contacts)
  VENDOR = "VENDOR",       // 廠商聯絡人 (vendor_contacts)
}

/**
 * 聯絡人在專案中的角色
 */
export enum ProjectContactRole {
  OWNER = "OWNER",               // 業主
  DESIGNER = "DESIGNER",         // 設計師
  SUPERVISOR = "SUPERVISOR",     // 監造
  PROJECT_MANAGER = "PROJECT_MANAGER", // 專案經理
  SITE_MANAGER = "SITE_MANAGER", // 工地主任
  ACCOUNTANT = "ACCOUNTANT",     // 會計
  PROCUREMENT = "PROCUREMENT",   // 採購
  CONTRACTOR = "CONTRACTOR",     // 承包商
  SUBCONTRACTOR = "SUBCONTRACTOR", // 小包
  OTHER = "OTHER",
}

@Entity("project_contacts")
@Index(["projectId"])
@Index(["contactId", "sourceType"])
@Index(["projectId", "contactId", "sourceType"], { unique: true })
export class ProjectContact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.projectContacts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  // 參照聯絡人 ID（可以是 Contact, CustomerContact, 或 VendorContact 的 ID）
  @Column({ name: "contact_id", length: 36 })
  contactId: string;

  // 聯絡人來源
  @Column({
    name: "source_type",
    type: "varchar",
    length: 20,
    default: ProjectContactSourceType.UNIFIED,
  })
  sourceType: ProjectContactSourceType;

  // 在專案中的角色
  @Column({
    name: "role_in_project",
    type: "varchar",
    length: 30,
    default: ProjectContactRole.OTHER,
  })
  roleInProject: ProjectContactRole;

  // 是否為主要聯絡人
  @Column({ name: "is_primary", default: false })
  isPrimary: boolean;

  // 備註
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
