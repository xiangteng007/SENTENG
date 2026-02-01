import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { CmmCategoryL2 } from "./cmm-category-l2.entity";

/**
 * CMM Category Level 3 - Work item templates (工項模板)
 */
@Entity("cmm_category_l3")
export class CmmCategoryL3 {
  @PrimaryColumn({ length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "l2_code", length: 50 })
  l2Code: string;

  @Column({ name: "default_materials", type: "jsonb", nullable: true })
  defaultMaterials?: string[];

  @Column({ name: "default_params", type: "jsonb", nullable: true })
  defaultParams?: Record<string, any>;

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
  @ManyToOne(() => CmmCategoryL2, (l2) => l2.categoriesL3)
  @JoinColumn({ name: "l2_code" })
  categoryL2: CmmCategoryL2;
}
