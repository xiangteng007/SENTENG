import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { CmmMaterialMaster } from "./cmm-material-master.entity";

/**
 * CMM 單位換算規則
 * 定義物料在不同單位間的換算係數
 */
@Entity("cmm_unit_conversions")
@Index(["materialId", "fromUnit", "toUnit"], { unique: true })
export class CmmUnitConversion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "material_id" })
  materialId: string;

  @Column({ name: "from_unit", length: 20 })
  fromUnit: string; // 來源單位: kg, m³, m², 包, 支, 才

  @Column({ name: "to_unit", length: 20 })
  toUnit: string; // 目標單位

  @Column({
    name: "conversion_factor",
    type: "decimal",
    precision: 20,
    scale: 10,
  })
  conversionFactor: number; // 換算係數: to = from * factor

  @Column({ type: "text", nullable: true })
  formula: string; // 換算公式說明 (供人閱讀)

  @Column({ name: "is_bidirectional", default: true })
  isBidirectional: boolean; // 是否可雙向換算

  @Column({ type: "text", nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => CmmMaterialMaster, (material) => material.unitConversions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "material_id" })
  material: CmmMaterialMaster;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
