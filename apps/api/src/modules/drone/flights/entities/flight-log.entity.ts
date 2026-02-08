import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { WorkOrder } from "../../work-orders/entities/work-order.entity";
import { User } from "../../../users/user.entity";

/**
 * FlightLog (飛行紀�?
 *
 * 記錄每次飛行的詳細資訊�?
 */
@Entity("flight_logs")
export class FlightLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "work_order_id", length: 20 })
  workOrderId: string;

  @ManyToOne(() => WorkOrder)
  @JoinColumn({ name: "work_order_id" })
  workOrder: WorkOrder;

  @Column({ name: "drone_asset_id", length: 20, nullable: true })
  droneAssetId: string;

  @Column({ name: "operator_id", length: 20 })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "operator_id" })
  operator: User;

  @Column({ name: "takeoff_time", nullable: true })
  takeoffTime: Date;

  @Column({ name: "landing_time", nullable: true })
  landingTime: Date;

  @Column({ name: "flight_duration", nullable: true })
  flightDuration: number; // seconds

  @Column({
    name: "takeoff_lat",
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  takeoffLat: number;

  @Column({
    name: "takeoff_lng",
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  takeoffLng: number;

  @Column({
    name: "landing_lat",
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  landingLat: number;

  @Column({
    name: "landing_lng",
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  landingLng: number;

  @Column({
    name: "max_altitude",
    type: "decimal",
    precision: 8,
    scale: 2,
    nullable: true,
  })
  maxAltitude: number;

  @Column({
    name: "distance_flown",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  distanceFlown: number; // meters

  @Column({ name: "battery_start", nullable: true })
  batteryStart: number;

  @Column({ name: "battery_end", nullable: true })
  batteryEnd: number;

  /**
   * 軌跡摘要 (簡化的航跡資�?
   */
  @Column({ name: "trajectory_summary", type: "jsonb", nullable: true })
  trajectorySummary: Record<string, unknown>;

  /**
   * 異常事件
   */
  @Column({ type: "jsonb", nullable: true })
  anomalies: Record<string, unknown>;

  @Column({ length: 20, default: "COMPLETED" })
  status: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

/**
 * OperationLog (作業紀�?
 *
 * 記錄具體的作業內容（噴灑、清洗等）�?
 */
@Entity("operation_logs")
export class OperationLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "flight_log_id", type: "uuid" })
  flightLogId: string;

  @ManyToOne(() => FlightLog)
  @JoinColumn({ name: "flight_log_id" })
  flightLog: FlightLog;

  @Column({ name: "operation_type", length: 30 })
  operationType: string; // SPRAY, CLEAN, INSPECT

  @Column({ name: "start_time", nullable: true })
  startTime: Date;

  @Column({ name: "end_time", nullable: true })
  endTime: Date;

  @Column({
    name: "area_covered",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  areaCovered: number;

  @Column({
    name: "volume_used",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  volumeUsed: number;

  @Column({ type: "jsonb", nullable: true })
  parameters: Record<string, unknown>;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
