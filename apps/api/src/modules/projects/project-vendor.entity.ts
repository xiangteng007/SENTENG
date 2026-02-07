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
import { Partner } from "../partners/partner.entity";

export enum VendorRole {
  SUBCONTRACTOR = "SUBCONTRACTOR",
  SUPPLIER = "SUPPLIER",
  CONSULTANT = "CONSULTANT",
}

@Entity("project_vendors")
@Index(["projectId"])
@Index(["vendorId"])
export class ProjectVendor {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project, (p) => p.projectVendors, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "vendor_id", length: 20 })
  /** @deprecated Use partnerId instead */
  vendorId: string;

  // Unified Partner relation (replaces vendor)
  @Column({ name: "partner_id", type: "uuid", nullable: true })
  partnerId: string;

  @ManyToOne(() => Partner)
  @JoinColumn({ name: "partner_id" })
  partner: Partner;

  @Column({ length: 30, default: VendorRole.SUBCONTRACTOR })
  role: VendorRole;

  @Column({
    name: "contract_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  contractAmount: number;

  @Column({
    name: "paid_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  @Column({
    name: "performance_rating",
    type: "decimal",
    precision: 3,
    scale: 2,
    nullable: true,
  })
  performanceRating: number;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
