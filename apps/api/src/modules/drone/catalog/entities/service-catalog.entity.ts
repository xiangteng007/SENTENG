import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BusinessUnit } from "../../../platform/tenants/entities/business-unit.entity";

/**
 * ServiceCatalog (服務目錄)
 *
 * 定義可提供的服務項目與計價規則。
 */
@Entity("service_catalog")
export class ServiceCatalog {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: "business_unit_id", length: 20, nullable: true })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit)
  @JoinColumn({ name: "business_unit_id" })
  businessUnit: BusinessUnit;

  @Column({ length: 100 })
  name: string;

  /**
   * 服務類別
   * - WALL_CLEANING: 外牆清洗
   * - AGRI_SPRAY: 農藥噴灑
   * - INSPECTION: 巡檢
   * - MAPPING: 測繪
   * - OTHER: 其他
   */
  @Column({ length: 30 })
  category: string;

  @Column({ type: "text", nullable: true })
  description: string;

  /**
   * 計價基準單位
   * - M2: 平方公尺
   * - HECTARE: 公頃
   * - HOUR: 小時
   * - FLIGHT: 架次
   */
  @Column({ name: "base_unit", length: 20 })
  baseUnit: string;

  @Column({ name: "base_price", type: "decimal", precision: 12, scale: 2 })
  basePrice: number;

  /**
   * 計價規則 (JSON)
   * 例如: { "minCharge": 5000, "heightMultiplier": 1.2, "distanceRate": 50 }
   */
  @Column({ name: "pricing_rules", type: "jsonb", nullable: true })
  pricingRules: any;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "effective_from", type: "date", nullable: true })
  effectiveFrom: Date;

  @Column({ name: "effective_to", type: "date", nullable: true })
  effectiveTo: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
