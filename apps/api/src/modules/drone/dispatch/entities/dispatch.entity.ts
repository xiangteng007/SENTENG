import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { User } from '../../../users/user.entity';

/**
 * DispatchAssignment (派工指派)
 *
 * 記錄工單的人員與設備指派。
 */
@Entity('dispatch_assignments')
export class DispatchAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_order_id', length: 20 })
  workOrderId: string;

  @ManyToOne(() => WorkOrder)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ name: 'operator_id', length: 20 })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ name: 'drone_asset_id', length: 20, nullable: true })
  droneAssetId: string;

  @Column({ name: 'assignment_date', type: 'date' })
  assignmentDate: Date;

  @Column({ name: 'time_window_start', type: 'time', nullable: true })
  timeWindowStart: string;

  @Column({ name: 'time_window_end', type: 'time', nullable: true })
  timeWindowEnd: string;

  /**
   * 狀態
   * - ASSIGNED: 已指派
   * - ACCEPTED: 已接受
   * - DECLINED: 已拒絕
   * - COMPLETED: 已完成
   */
  @Column({ length: 20, default: 'ASSIGNED' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * PreflightChecklist (飛行前檢查表)
 */
@Entity('preflight_checklists')
export class PreflightChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_order_id', length: 20 })
  workOrderId: string;

  @ManyToOne(() => WorkOrder)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ name: 'operator_id', length: 20 })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ name: 'checklist_template', length: 50, nullable: true })
  checklistTemplate: string;

  /**
   * 檢查項目
   * [{ item: string, checked: boolean, notes?: string }]
   */
  @Column({ type: 'jsonb', nullable: true })
  items: any;

  /**
   * 天氣狀況
   * { temperature, humidity, windSpeed, windDirection, visibility }
   */
  @Column({ name: 'weather_conditions', type: 'jsonb', nullable: true })
  weatherConditions: any;

  @Column({ name: 'is_passed', default: false })
  isPassed: boolean;

  @Column({ name: 'checked_at', nullable: true })
  checkedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
