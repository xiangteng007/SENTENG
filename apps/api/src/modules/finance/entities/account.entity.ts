import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  bank: string;

  @Column({ length: 50, nullable: true })
  number: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder: number;

  @OneToMany("Transaction", "account")
  transactions: Record<string, unknown>[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
