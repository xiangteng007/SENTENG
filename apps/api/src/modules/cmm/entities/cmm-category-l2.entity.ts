import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { CmmCategoryL1 } from "./cmm-category-l1.entity";
import { CmmCategoryL3 } from "./cmm-category-l3.entity";

/**
 * CMM Category Level 2 - Trade groups (土方、模板、油漆、木作...)
 */
@Entity("cmm_category_l2")
export class CmmCategoryL2 {
  @PrimaryColumn({ length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "l1_code", length: 20 })
  l1Code: string;

  @Column({ name: "default_unit", length: 20, nullable: true })
  defaultUnit?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CmmCategoryL1, (l1) => l1.categoriesL2)
  @JoinColumn({ name: "l1_code" })
  categoryL1: CmmCategoryL1;

  @OneToMany(() => CmmCategoryL3, (l3) => l3.categoryL2)
  categoriesL3: CmmCategoryL3[];
}
