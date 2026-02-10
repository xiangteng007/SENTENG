import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Project } from "../../projects/project.entity";
import { Partner } from "../../partners/partner.entity";

export enum ProcurementStatus {
  DRAFT = "DRAFT",
  RFQ_SENT = "RFQ_SENT",
  BIDDING = "BIDDING",
  EVALUATING = "EVALUATING",
  AWARDED = "AWARDED",
  CONTRACTED = "CONTRACTED",
  CANCELLED = "CANCELLED",
}

export enum ProcurementType {
  MATERIAL = "MATERIAL",
  SUBCONTRACT = "SUBCONTRACT",
  EQUIPMENT = "EQUIPMENT",
  SERVICE = "SERVICE",
}

@Entity("procurements")
@Index(["projectId"])
@Index(["status"])
export class Procurement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ length: 30, default: ProcurementType.MATERIAL })
  type: string;

  @Column({ length: 30, default: ProcurementStatus.DRAFT })
  status: string;

  @Column({
    name: "budget_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  budgetAmount: number;

  @Column({ name: "deadline", type: "date", nullable: true })
  deadline: Date;

  @Column({ name: "rfq_deadline", type: "date", nullable: true })
  rfqDeadline: Date;

  @Column({ type: "text", array: true, nullable: true })
  specifications: string[];

  @Column({ type: "jsonb", nullable: true })
  attachments: { name: string; url: string; uploadedAt: string }[];

  @Column({ name: "awarded_vendor_id", type: "uuid", nullable: true })
  /** @deprecated Use awardedPartnerId instead */
  awardedVendorId: string;

  @ManyToOne(() => Partner, { nullable: true })
  @JoinColumn({ name: "awarded_vendor_id" })
  awardedPartner: Partner;

  @Column({
    name: "awarded_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  awardedAmount: number;

  @Column({ name: "award_reason", type: "text", nullable: true })
  awardReason: string | null;

  @OneToMany(() => ProcurementBid, (bid) => bid.procurement, { cascade: true })
  bids: ProcurementBid[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

@Entity("procurement_bids")
@Index(["procurementId"])
@Index(["vendorId"])
export class ProcurementBid {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "procurement_id", type: "uuid" })
  procurementId: string;

  @ManyToOne(() => Procurement, (p) => p.bids, { onDelete: "CASCADE" })
  @JoinColumn({ name: "procurement_id" })
  procurement: Procurement;

  @Column({ name: "vendor_id", type: "uuid" })
  /** @deprecated Use partnerId instead */
  vendorId: string;

  @ManyToOne(() => Partner)
  @JoinColumn({ name: "vendor_id" })
  partner: Partner;

  @Column({ name: "bid_amount", type: "decimal", precision: 15, scale: 2 })
  bidAmount: number;

  @Column({ name: "lead_time_days", nullable: true })
  leadTimeDays: number;

  @Column({ name: "validity_days", default: 30 })
  validityDays: number;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "jsonb", nullable: true })
  attachments: { name: string; url: string }[];

  @Column({ name: "is_selected", default: false })
  isSelected: boolean;

  @Column({
    name: "evaluation_score",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  evaluationScore: number;

  @Column({ name: "evaluation_notes", type: "text", nullable: true })
  evaluationNotes: string | null;

  @CreateDateColumn({ name: "submitted_at" })
  submittedAt: Date;
}
