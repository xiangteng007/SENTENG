import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { CmmCategoryL2 } from "./cmm-category-l2.entity";

/**
 * CMM Category Level 1 - Top-level taxonomy (營建/裝潢)
 */
@Entity("cmm_category_l1")
export class CmmCategoryL1 {
  @PrimaryColumn({ length: 20 })
  code: string;

  @Column({ length: 50 })
  name: string;

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
  @OneToMany(() => CmmCategoryL2, (l2) => l2.categoryL1)
  categoriesL2: CmmCategoryL2[];
}

// Enum for type safety
export enum CategoryLevel1 {
  CONSTRUCTION = "CONSTRUCTION",
  INTERIOR = "INTERIOR",
}

export const CategoryLevel1Labels: Record<CategoryLevel1, string> = {
  [CategoryLevel1.CONSTRUCTION]: "營建",
  [CategoryLevel1.INTERIOR]: "裝潢",
};
