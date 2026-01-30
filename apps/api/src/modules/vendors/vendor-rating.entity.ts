import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { Project } from '../projects/project.entity';

/**
 * 供應商評鑑記錄
 *
 * 每次交易後的個別評鑑記錄，用於追蹤歷史評分並計算綜合評分
 */
@Entity('vendor_ratings')
@Index(['vendorId'])
@Index(['projectId'])
@Index(['createdAt'])
export class VendorRating {
  @PrimaryColumn({ length: 36 })
  id: string; // UUID

  @Column({ name: 'vendor_id', length: 20 })
  vendorId: string;

  @Column({ name: 'project_id', length: 20, nullable: true })
  projectId: string;

  @Column({ name: 'purchase_order_id', length: 30, nullable: true })
  purchaseOrderId: string;

  // 評分維度 (0.00 - 5.00)
  @Column({ name: 'quality_score', type: 'decimal', precision: 3, scale: 2 })
  qualityScore: number; // 品質 - 材料/工程品質符合規格

  @Column({ name: 'delivery_score', type: 'decimal', precision: 3, scale: 2 })
  deliveryScore: number; // 交期 - 準時交貨/完工

  @Column({ name: 'price_score', type: 'decimal', precision: 3, scale: 2 })
  priceScore: number; // 價格 - 價格合理性

  @Column({ name: 'service_score', type: 'decimal', precision: 3, scale: 2 })
  serviceScore: number; // 服務 - 溝通配合度、售後服務

  @Column({ name: 'overall_score', type: 'decimal', precision: 3, scale: 2 })
  overallScore: number; // 綜合評分 (加權平均)

  // 評鑑內容
  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'text', array: true, nullable: true })
  positives: string[]; // 優點標籤

  @Column({ type: 'text', array: true, nullable: true })
  negatives: string[]; // 缺點標籤

  // 交期追蹤
  @Column({ name: 'expected_delivery_date', type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ name: 'actual_delivery_date', type: 'date', nullable: true })
  actualDeliveryDate: Date;

  @Column({ name: 'is_on_time', default: true })
  isOnTime: boolean;

  // 審核
  @Column({ name: 'rated_by', length: 20 })
  ratedBy: string;

  @Column({ name: 'rated_by_name', length: 50, nullable: true })
  ratedByName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
