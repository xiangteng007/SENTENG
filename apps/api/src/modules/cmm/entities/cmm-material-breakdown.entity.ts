import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { CmmCalculationRun } from "./cmm-calculation-run.entity";

/**
 * CMM Material Breakdown - 材料分解結果 (唯讀)
 */
@Entity("cmm_material_breakdown")
export class CmmMaterialBreakdown {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "run_id", type: "uuid" })
  runId: string;

  @Column({ name: "source_work_item_code", length: 50, nullable: true })
  sourceWorkItemCode?: string;

  @Column({ name: "category_l1", length: 20, nullable: true })
  categoryL1?: string;

  @Column({ name: "category_l2", length: 50, nullable: true })
  categoryL2?: string;

  @Column({ name: "category_l3", length: 50, nullable: true })
  categoryL3?: string;

  @Column({ name: "material_code", length: 50, nullable: true })
  materialCode?: string;

  @Column({ name: "material_name", length: 100 })
  materialName: string;

  @Column({ length: 100, nullable: true })
  spec?: string;

  @Column({ name: "base_quantity", type: "decimal", precision: 15, scale: 4 })
  baseQuantity: number;

  @Column({
    name: "waste_factor",
    type: "decimal",
    precision: 5,
    scale: 4,
    default: 0,
  })
  wasteFactor: number;

  @Column({ name: "final_quantity", type: "decimal", precision: 15, scale: 4 })
  finalQuantity: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: "packaging_unit", length: 20, nullable: true })
  packagingUnit?: string;

  @Column({ name: "packaging_quantity", type: "int", nullable: true })
  packagingQuantity?: number;

  @Column({
    name: "unit_price",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  unitPrice?: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  subtotal?: number;

  @Column({ name: "trace_info", type: "jsonb", nullable: true })
  traceInfo?: {
    ruleApplied?: string;
    conversionFormula?: string;
    [key: string]: unknown;
  };

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CmmCalculationRun, (run) => run.materialBreakdown, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "run_id" })
  calculationRun: CmmCalculationRun;
}
