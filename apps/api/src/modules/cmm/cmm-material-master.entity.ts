import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CmmUnitConversion } from './cmm-unit-conversion.entity';

/**
 * 物料類別
 */
export enum MaterialCategory {
  REBAR = 'REBAR', // 鋼筋
  CONCRETE = 'CONCRETE', // 混凝土
  FORMWORK = 'FORMWORK', // 模板
  MORTAR = 'MORTAR', // 砂漿
  STEEL = 'STEEL', // 鋼骨
  CEMENT = 'CEMENT', // 水泥
  SAND = 'SAND', // 砂
  GRAVEL = 'GRAVEL', // 碎石
  OTHER = 'OTHER', // 其他
}

/**
 * 物料狀態
 */
export enum MaterialStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEPRECATED = 'DEPRECATED',
}

/**
 * CMM 物料主檔
 * 營建物料的核心參考資料，包含標準規格、基礎單位、換算參數
 */
@Entity('cmm_material_masters')
@Index(['category'])
@Index(['status'])
@Index(['code'], { unique: true })
export class CmmMaterialMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  code: string; // MAT-REBAR-001

  @Column({ length: 100 })
  name: string; // 竹節鋼筋 #3

  @Column({ name: 'english_name', length: 100, nullable: true })
  englishName: string;

  @Column({
    type: 'enum',
    enum: MaterialCategory,
    default: MaterialCategory.OTHER,
  })
  category: MaterialCategory;

  @Column({ name: 'sub_category', length: 50, nullable: true })
  subCategory: string; // e.g., 竹節鋼筋、光面鋼筋

  @Column({ name: 'base_unit', length: 20 })
  baseUnit: string; // 基礎計量單位: kg, m³, m², 包

  @Column({ type: 'text', nullable: true })
  specification: string; // 規格描述: D10 (SD420W), 3000psi

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  density: number; // 密度 (kg/m³) - 用於重量體積換算

  @Column({
    name: 'unit_weight',
    type: 'decimal',
    precision: 15,
    scale: 6,
    nullable: true,
  })
  unitWeight: number; // 單位重量 (kg/m or kg/m²)

  @Column({
    name: 'standard_length',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  standardLength: number; // 標準長度 (m)

  @Column({
    name: 'standard_weight_per_length',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  standardWeightPerLength: number; // 每公尺重量 (kg/m) - 鋼筋用

  // 建築類型相關的標準用量係數
  @Column({
    name: 'usage_factor_rc',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  usageFactorRc: number; // RC 結構每坪用量

  @Column({
    name: 'usage_factor_src',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  usageFactorSrc: number; // SRC 結構每坪用量

  @Column({
    name: 'usage_factor_sc',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  usageFactorSc: number; // SC 結構每坪用量

  // 價格參考
  @Column({
    name: 'reference_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  referencePrice: number;

  @Column({ name: 'price_unit', length: 20, nullable: true })
  priceUnit: string;

  @Column({ name: 'price_updated_at', type: 'timestamp', nullable: true })
  priceUpdatedAt: Date;

  // 分類標籤
  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({
    type: 'enum',
    enum: MaterialStatus,
    default: MaterialStatus.ACTIVE,
  })
  status: MaterialStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @OneToMany(() => CmmUnitConversion, conv => conv.material, {
    cascade: true,
  })
  unitConversions: CmmUnitConversion[];

  // Audit
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 50, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', length: 50, nullable: true })
  updatedBy: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
