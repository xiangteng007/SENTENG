import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 營建廢棄物申報實體
 *
 * 依據「營建事業廢棄物管理辦法」追蹤廢棄物處理
 */
@Entity('waste_records')
@Index(['projectId', 'wasteDate'])
@Index(['wasteType', 'status'])
export class WasteRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ length: 100 })
  wasteType: WasteType;

  @Column({ length: 10 })
  wasteCode: string; // 廢棄物代碼 (環保署標準代碼)

  @Column({ type: 'date' })
  wasteDate: Date; // 產生日期

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number; // 數量

  @Column({ length: 20, default: 'ton' })
  unit: 'ton' | 'cubic_meter' | 'kg' | 'piece';

  @Column({ length: 50, default: 'generated' })
  status: 'generated' | 'stored' | 'transported' | 'disposed' | 'recycled';

  // 處理業者資訊
  @Column({ length: 255, nullable: true })
  disposerName: string; // 清除處理業者

  @Column({ length: 20, nullable: true })
  disposerLicenseNo: string; // 許可證號

  @Column({ length: 255, nullable: true })
  disposalFacility: string; // 處理場所

  // 運輸資訊
  @Column({ length: 255, nullable: true })
  transporterName: string;

  @Column({ length: 20, nullable: true })
  vehiclePlate: string; // 車牌號碼

  @Column({ type: 'timestamp with time zone', nullable: true })
  transportDate: Date;

  // 處理資訊
  @Column({ length: 100, nullable: true })
  disposalMethod: DisposalMethod;

  @Column({ type: 'timestamp with time zone', nullable: true })
  disposalDate: Date;

  // 聯單資訊 (三聯單)
  @Column({ length: 50, nullable: true })
  manifestNumber: string; // 聯單編號

  @Column({ type: 'boolean', default: false })
  manifestSubmitted: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  manifestSubmittedAt: Date;

  // 再利用資訊
  @Column({ type: 'boolean', default: false })
  isRecyclable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  recycledQuantity: number;

  @Column({ length: 255, nullable: true })
  recyclerName: string;

  // 成本
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  disposalCost: number; // 處理費用

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  transportCost: number; // 運輸費用

  // 地點
  @Column({ length: 255, nullable: true })
  generationLocation: string; // 產生地點

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  // 附件
  @Column({ type: 'jsonb', nullable: true })
  documents: WasteDocument[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  // 稽核欄位
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 廢棄物類型
 */
export type WasteType =
  | 'concrete' // 混凝土塊
  | 'brick' // 磚瓦
  | 'asphalt' // 瀝青
  | 'wood' // 木材
  | 'metal' // 金屬
  | 'glass' // 玻璃
  | 'plastic' // 塑膠
  | 'soil' // 土石方
  | 'mixed' // 混合營建廢棄物
  | 'hazardous' // 有害廢棄物
  | 'asbestos' // 石綿
  | 'other';

/**
 * 處理方式
 */
export type DisposalMethod =
  | 'landfill' // 掩埋
  | 'incineration' // 焚化
  | 'recycling' // 再利用
  | 'reuse' // 再使用
  | 'treatment' // 中間處理
  | 'export'; // 輸出

/**
 * 廢棄物文件
 */
export interface WasteDocument {
  id: string;
  type: 'manifest' | 'receipt' | 'photo' | 'certificate' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

/**
 * 月度申報彙總
 */
@Entity('waste_monthly_reports')
@Index(['projectId', 'year', 'month'])
export class WasteMonthlyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'jsonb' })
  summary: {
    wasteType: WasteType;
    totalQuantity: number;
    unit: string;
    recycledQuantity: number;
    recycleRate: number;
    disposalCost: number;
  }[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalDisposalCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalTransportCost: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallRecycleRate: number; // 總再利用率 (%)

  @Column({ length: 50, default: 'draft' })
  status: 'draft' | 'submitted' | 'approved' | 'rejected';

  @Column({ type: 'timestamp with time zone', nullable: true })
  submittedAt: Date;

  @Column({ length: 100, nullable: true })
  epaReportNumber: string; // 環保署申報編號

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
