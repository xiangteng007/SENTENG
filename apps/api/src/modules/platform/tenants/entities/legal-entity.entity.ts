import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { BusinessUnit } from "./business-unit.entity";

/**
 * LegalEntity (法人實體)
 *
 * 代表一個獨立的法人公司，可包含多個事業部門 (BusinessUnit)。
 * 用於多公司架構下的財務隔離與報表合併。
 */
@Entity("legal_entities")
export class LegalEntity {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "short_name", length: 30, nullable: true })
  shortName: string;

  @Column({ name: "tax_id", length: 20, nullable: true })
  taxId: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => BusinessUnit, (bu) => bu.legalEntity)
  businessUnits: BusinessUnit[];
}
