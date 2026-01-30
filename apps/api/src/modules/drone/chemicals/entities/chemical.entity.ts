import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BusinessUnit } from '../../../platform/tenants/entities/business-unit.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { FlightLog } from '../../flights/entities/flight-log.entity';
import { User } from '../../../users/user.entity';

/**
 * ChemicalLot (藥劑批次)
 *
 * 農藥/清潔劑的進貨批次追溯。
 */
@Entity('chemical_lots')
export class ChemicalLot {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'business_unit_id', length: 20, nullable: true })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit)
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit: BusinessUnit;

  @Column({ name: 'product_name', length: 100 })
  productName: string;

  @Column({ length: 100, nullable: true })
  manufacturer: string;

  @Column({ name: 'lot_number', length: 50, nullable: true })
  lotNumber: string;

  @Column({ name: 'registration_no', length: 50, nullable: true })
  registrationNo: string; // 農藥登記證號

  @Column({ name: 'active_ingredient', type: 'text', nullable: true })
  activeIngredient: string;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  concentration: number;

  @Column({ name: 'concentration_unit', length: 20, nullable: true })
  concentrationUnit: string;

  @Column({
    name: 'quantity_received',
    type: 'decimal',
    precision: 12,
    scale: 4,
  })
  quantityReceived: number;

  @Column({
    name: 'quantity_remaining',
    type: 'decimal',
    precision: 12,
    scale: 4,
  })
  quantityRemaining: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'received_date', type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'storage_location', length: 100, nullable: true })
  storageLocation: string;

  @Column({ name: 'msds_url', type: 'text', nullable: true })
  msdsUrl: string;

  /**
   * 狀態
   * - IN_STOCK: 庫存中
   * - LOW_STOCK: 低庫存
   * - EXPIRED: 已過期
   * - DEPLETED: 已用盡
   */
  @Column({ length: 20, default: 'IN_STOCK' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * MixtureBatch (調配批次)
 *
 * 記錄每次調配的藥劑配方。
 */
@Entity('mixture_batches')
export class MixtureBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_order_id', length: 20 })
  workOrderId: string;

  @ManyToOne(() => WorkOrder)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ name: 'batch_number', length: 50, nullable: true })
  batchNumber: string;

  @Column({ name: 'prepared_by', length: 20 })
  preparedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'prepared_by' })
  preparer: User;

  @Column({ name: 'prepared_at', nullable: true })
  preparedAt: Date;

  /**
   * 使用的化學品
   * [{ lotId, productName, quantity, unit }]
   */
  @Column({ type: 'jsonb' })
  chemicals: any;

  @Column({
    name: 'water_volume',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  waterVolume: number;

  @Column({
    name: 'total_volume',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalVolume: number;

  @Column({ name: 'dilution_ratio', length: 20, nullable: true })
  dilutionRatio: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * ApplicationRecord (施作紀錄)
 *
 * 記錄實際的農藥/清潔劑施作情況，用於追溯。
 */
@Entity('application_records')
export class ApplicationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_order_id', length: 20 })
  workOrderId: string;

  @ManyToOne(() => WorkOrder)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ name: 'flight_log_id', type: 'uuid', nullable: true })
  flightLogId: string;

  @ManyToOne(() => FlightLog)
  @JoinColumn({ name: 'flight_log_id' })
  flightLog: FlightLog;

  @Column({ name: 'mixture_batch_id', type: 'uuid', nullable: true })
  mixtureBatchId: string;

  @ManyToOne(() => MixtureBatch)
  @JoinColumn({ name: 'mixture_batch_id' })
  mixtureBatch: MixtureBatch;

  @Column({
    name: 'applied_area',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  appliedArea: number;

  @Column({
    name: 'applied_volume',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  appliedVolume: number;

  @Column({
    name: 'application_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  applicationRate: number; // L/ha or L/m2

  /**
   * 天氣條件
   */
  @Column({ name: 'weather_conditions', type: 'jsonb', nullable: true })
  weatherConditions: any;

  @Column({ name: 'gps_track_uri', type: 'text', nullable: true })
  gpsTrackUri: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
