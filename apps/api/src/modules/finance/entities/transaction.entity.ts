import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 10 })
  type: string; // '收入' | '支出'

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ type: "date" })
  date: Date;

  @Column({ length: 50, nullable: true })
  category: string;

  @Column({ name: "description", type: "text", nullable: true })
  desc: string;

  @Column({ name: "account_id", type: "uuid", nullable: true })
  accountId: string;

  @ManyToOne("Account", "transactions")
  @JoinColumn({ name: "account_id" })
  account: Record<string, unknown>;

  @Column({ name: "project_id", type: "uuid", nullable: true })
  projectId: string;

  // Source reference for deduplication
  @Column({ name: "reference_type", length: 30, nullable: true })
  referenceType: string; // 'PAYMENT_RECEIPT' | 'COST_ENTRY'

  @Column({ name: "reference_id", nullable: true })
  referenceId: string;

  @Column({ name: "created_by", nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
