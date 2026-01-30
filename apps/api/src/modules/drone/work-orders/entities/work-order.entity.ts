import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../../projects/project.entity';
import { Client } from '../../../clients/client.entity';
import { BusinessUnit } from '../../../platform/tenants/entities/business-unit.entity';
import { JobSite } from '../../../platform/sites/entities/job-site.entity';
import { ServiceCatalog } from '../../catalog/entities/service-catalog.entity';

/**
 * WorkOrder (工單/任務單)
 *
 * 無人機作業任務的核心實體，連結客戶、專案、作業現場。
 */
@Entity('work_orders')
@Index(['projectId', 'status'])
@Index(['scheduledDate'])
export class WorkOrder {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'project_id', length: 20, nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'job_site_id', length: 20, nullable: true })
  jobSiteId: string;

  @ManyToOne(() => JobSite)
  @JoinColumn({ name: 'job_site_id' })
  jobSite: JobSite;

  @Column({ name: 'client_id', length: 20, nullable: true })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'business_unit_id', length: 20, nullable: true })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit)
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit: BusinessUnit;

  @Column({ name: 'service_id', length: 20, nullable: true })
  serviceId: string;

  @ManyToOne(() => ServiceCatalog)
  @JoinColumn({ name: 'service_id' })
  service: ServiceCatalog;

  @Column({ name: 'wo_number', length: 30, unique: true })
  woNumber: string;

  @Column({ length: 200, nullable: true })
  title: string;

  /**
   * 工單類型
   * - WALL_CLEANING: 外牆清洗
   * - AGRI_SPRAY: 農藥噴灑
   * - INSPECTION: 巡檢
   */
  @Column({ name: 'wo_type', length: 30 })
  woType: string;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ name: 'scheduled_time_start', type: 'time', nullable: true })
  scheduledTimeStart: string;

  @Column({ name: 'scheduled_time_end', type: 'time', nullable: true })
  scheduledTimeEnd: string;

  @Column({
    name: 'estimated_area',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  estimatedArea: number;

  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration: number; // minutes

  @Column({ length: 20, default: 'NORMAL' })
  priority: string;

  /**
   * 狀態
   * - WO_DRAFT: 草稿
   * - WO_SCHEDULED: 已排程
   * - WO_DISPATCHED: 已派工
   * - WO_IN_PROGRESS: 進行中
   * - WO_COMPLETED: 已完成
   * - WO_CANCELLED: 已取消
   */
  @Column({ length: 30, default: 'WO_DRAFT' })
  status: string;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations will be added for dispatches, flights, etc.
}
