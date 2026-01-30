import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 工程保險實體
 *
 * 追蹤營造綜合險、工地意外險、雇主責任險等
 */
@Entity('project_insurances')
@Index(['projectId', 'type'])
@Index(['expiryDate'])
export class ProjectInsurance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ length: 100 })
  type: InsuranceType;

  @Column({ length: 255 })
  policyNumber: string;

  @Column({ length: 255 })
  insurerName: string; // 保險公司名稱

  @Column({ length: 100, nullable: true })
  insurerCode: string; // 保險公司代碼

  @Column({ type: 'date' })
  effectiveDate: Date; // 生效日

  @Column({ type: 'date' })
  expiryDate: Date; // 到期日

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  coverageAmount: number; // 保額

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  premiumAmount: number; // 保費

  @Column({ length: 50, default: 'active' })
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'claimed';

  // 被保險人資訊
  @Column({ length: 255 })
  insuredName: string;

  @Column({ length: 20, nullable: true })
  insuredTaxId: string;

  // 受益人
  @Column({ length: 255, nullable: true })
  beneficiaryName: string;

  // 附加條款
  @Column({ type: 'jsonb', nullable: true })
  endorsements: InsuranceEndorsement[];

  // 理賠記錄
  @Column({ type: 'jsonb', nullable: true })
  claims: InsuranceClaim[];

  // 文件附件
  @Column({ type: 'jsonb', nullable: true })
  documents: InsuranceDocument[];

  // 費率資訊
  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  ratePercent: number; // 費率 (%)

  @Column({ type: 'text', nullable: true })
  coverageDescription: string;

  @Column({ type: 'text', nullable: true })
  exclusions: string; // 除外責任

  // 提醒設定
  @Column({ type: 'int', default: 30 })
  reminderDaysBefore: number; // 到期前幾天提醒

  @Column({ type: 'boolean', default: true })
  reminderEnabled: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastReminderSentAt: Date;

  // 業務員資訊
  @Column({ length: 100, nullable: true })
  agentName: string;

  @Column({ length: 50, nullable: true })
  agentPhone: string;

  @Column({ length: 255, nullable: true })
  agentEmail: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 保險類型
 */
export type InsuranceType =
  | 'comprehensive_construction' // 營造綜合險
  | 'construction_all_risks' // 營造工程全險
  | 'employers_liability' // 雇主責任險
  | 'public_liability' // 公共意外責任險
  | 'professional_liability' // 專業責任險
  | 'property_damage' // 財產損失險
  | 'equipment_breakdown' // 機械設備險
  | 'workers_compensation' // 勞工保險
  | 'group_accident'; // 團體意外險

/**
 * 附加條款
 */
export interface InsuranceEndorsement {
  code: string;
  name: string;
  description?: string;
  additionalPremium?: number;
  effectiveDate?: string;
}

/**
 * 理賠記錄
 */
export interface InsuranceClaim {
  claimNumber: string;
  incidentDate: string;
  reportDate: string;
  description: string;
  claimAmount: number;
  settledAmount?: number;
  status: 'reported' | 'under_review' | 'approved' | 'rejected' | 'settled';
  settledDate?: string;
  documents?: string[];
}

/**
 * 保險文件
 */
export interface InsuranceDocument {
  id: string;
  type: 'policy' | 'endorsement' | 'claim' | 'receipt' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy?: string;
}

/**
 * 保險費率參考表
 */
@Entity('insurance_rate_references')
export class InsuranceRateReference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  insuranceType: InsuranceType;

  @Column({ length: 100 })
  constructionType: string; // 工程類別

  @Column({ type: 'decimal', precision: 6, scale: 4 })
  baseRate: number; // 基本費率 (%)

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  minRate: number;

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  maxRate: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
