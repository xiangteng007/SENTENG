import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * 結構類型
 */
export enum StructureType {
  RC = "RC", // 鋼筋混凝土
  SRC = "SRC", // 鋼骨鋼筋混凝土
  SC = "SC", // 鋼構造
  RB = "RB", // 磚構造
  W = "W", // 木構造
}

/**
 * 建築用途
 */
export enum BuildingUsage {
  RESIDENTIAL = "RESIDENTIAL", // 住宅
  OFFICE = "OFFICE", // 辦公
  COMMERCIAL = "COMMERCIAL", // 商業
  INDUSTRIAL = "INDUSTRIAL", // 工業廠房
  PUBLIC = "PUBLIC", // 公共建築
  MIXED = "MIXED", // 混合使用
}

/**
 * CMM 建築類型參數
 * 預設的建築類型及其物料用量係數
 */
@Entity("cmm_building_profiles")
@Index(["structureType", "buildingUsage"])
@Index(["code"], { unique: true })
export class CmmBuildingProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 50, unique: true })
  code: string; // RC_7F_OFFICE, SRC_15F_RESIDENTIAL

  @Column({ length: 100 })
  name: string; // 7層RC辦公大樓

  @Column({
    name: "structure_type",
    type: "enum",
    enum: StructureType,
    default: StructureType.RC,
  })
  structureType: StructureType;

  @Column({
    name: "building_usage",
    type: "enum",
    enum: BuildingUsage,
    default: BuildingUsage.OFFICE,
  })
  buildingUsage: BuildingUsage;

  @Column({ name: "min_floors", type: "int", default: 1 })
  minFloors: number;

  @Column({ name: "max_floors", type: "int", nullable: true })
  maxFloors: number;

  // 鋼筋係數 (kg/m² 或 kg/坪)
  @Column({
    name: "rebar_factor",
    type: "decimal",
    precision: 10,
    scale: 4,
  })
  rebarFactor: number;

  @Column({ name: "rebar_unit", length: 20, default: "kg/m²" })
  rebarUnit: string;

  // 混凝土係數 (m³/m² 或 m³/坪)
  @Column({
    name: "concrete_factor",
    type: "decimal",
    precision: 10,
    scale: 4,
  })
  concreteFactor: number;

  @Column({ name: "concrete_unit", length: 20, default: "m³/m²" })
  concreteUnit: string;

  // 模板係數 (m²/m² 或 倍數)
  @Column({
    name: "formwork_factor",
    type: "decimal",
    precision: 10,
    scale: 4,
  })
  formworkFactor: number;

  @Column({ name: "formwork_unit", length: 20, default: "m²/m²" })
  formworkUnit: string;

  // 鋼骨係數 (kg/m²) - 僅 SRC/SC 適用
  @Column({
    name: "steel_factor",
    type: "decimal",
    precision: 10,
    scale: 4,
    nullable: true,
  })
  steelFactor: number;

  @Column({ name: "steel_unit", length: 20, nullable: true })
  steelUnit: string;

  // 砂漿係數
  @Column({
    name: "mortar_factor",
    type: "decimal",
    precision: 10,
    scale: 4,
    nullable: true,
  })
  mortarFactor: number;

  @Column({ name: "mortar_unit", length: 20, nullable: true })
  mortarUnit: string;

  // 其他物料的彈性欄位
  @Column({ name: "other_factors", type: "jsonb", nullable: true })
  otherFactors: Record<string, { value: number; unit: string }>;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "is_system_default", default: false })
  isSystemDefault: boolean;

  // Audit
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
