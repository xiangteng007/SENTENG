import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { BusinessUnit } from "../../../platform/tenants/entities/business-unit.entity";

/**
 * DroneAsset (無人機資產)
 */
@Entity("drone_assets")
export class DroneAsset {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: "business_unit_id", length: 20, nullable: true })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit)
  @JoinColumn({ name: "business_unit_id" })
  businessUnit: BusinessUnit;

  /**
   * 資產類型
   * - DRONE: 無人機
   * - BATTERY: 電池
   * - SPRAYER: 噴灑器
   * - CAMERA: 相機
   */
  @Column({ name: "asset_type", length: 30 })
  assetType: string;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ name: "serial_number", length: 50, unique: true })
  serialNumber: string;

  @Column({ name: "registration_no", length: 50, nullable: true })
  registrationNo: string;

  @Column({ name: "purchase_date", type: "date", nullable: true })
  purchaseDate: Date;

  @Column({
    name: "purchase_cost",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  purchaseCost: number;

  /**
   * 狀態
   * - AVAILABLE: 可用
   * - IN_USE: 使用中
   * - MAINTENANCE: 維護中
   * - RETIRED: 已報廢
   */
  @Column({ length: 20, default: "AVAILABLE" })
  status: string;

  @Column({
    name: "total_flight_hours",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalFlightHours: number;

  @Column({ name: "total_flight_count", default: 0 })
  totalFlightCount: number;

  @Column({ name: "last_maintenance_at", nullable: true })
  lastMaintenanceAt: Date;

  @Column({ name: "next_maintenance_at", nullable: true })
  nextMaintenanceAt: Date;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => MaintenanceRecord, (m) => m.asset)
  maintenanceRecords: MaintenanceRecord[];
}

/**
 * MaintenanceRecord (維護紀錄)
 */
@Entity("maintenance_records")
export class MaintenanceRecord {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "asset_id", length: 20 })
  assetId: string;

  @ManyToOne(() => DroneAsset, (a) => a.maintenanceRecords)
  @JoinColumn({ name: "asset_id" })
  asset: DroneAsset;

  /**
   * 維護類型
   * - ROUTINE: 例行維護
   * - REPAIR: 維修
   * - CALIBRATION: 校正
   * - UPGRADE: 升級
   */
  @Column({ name: "maintenance_type", length: 30 })
  maintenanceType: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "performed_by", length: 20, nullable: true })
  performedBy: string;

  @Column({ name: "performed_at", nullable: true })
  performedAt: Date;

  /**
   * 使用的零件
   * [{ partName, partNo, quantity, cost }]
   */
  @Column({ name: "parts_used", type: "jsonb", nullable: true })
  partsUsed: any;

  @Column({
    name: "labor_hours",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  laborHours: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  cost: number;

  @Column({ name: "next_due_at", nullable: true })
  nextDueAt: Date;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
