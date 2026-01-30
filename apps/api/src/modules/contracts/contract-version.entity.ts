import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 合約版本控制實體
 *
 * Git-like 版本差異追蹤
 */
@Entity('contract_versions')
@Index(['contractId', 'version'])
export class ContractVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contractId: string;

  @Column({ type: 'int' })
  version: number; // 版本號 1, 2, 3...

  @Column({ length: 50 })
  versionLabel: string; // 例: "v1.0", "Draft", "Final"

  @Column({ length: 50 })
  status: 'draft' | 'review' | 'approved' | 'superseded' | 'cancelled';

  // 合約內容 (完整 snapshot)
  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  structuredContent: Record<string, unknown>;

  // 變更資訊
  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: ContractChange[];

  // 審核資訊
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  createdByName: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ length: 255, nullable: true })
  approvedByName: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt: Date;

  // 附件
  @Column({ type: 'jsonb', nullable: true })
  attachments: ContractAttachment[];

  // 簽署資訊
  @Column({ type: 'jsonb', nullable: true })
  signatures: ContractSignature[];

  @Column({ type: 'boolean', default: false })
  isSigned: boolean;

  // 金額變更追蹤
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  previousAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amountChange: number;

  // Hash for integrity
  @Column({ length: 64, nullable: true })
  contentHash: string;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * 合約變更項目
 */
export interface ContractChange {
  field: string;
  fieldLabel: string;
  type: 'add' | 'modify' | 'delete';
  oldValue?: unknown;
  newValue?: unknown;
  description?: string;
}

/**
 * 合約附件
 */
export interface ContractAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * 合約簽署
 */
export interface ContractSignature {
  signerId: string;
  signerName: string;
  signerRole: 'party_a' | 'party_b' | 'witness';
  signedAt: string;
  signatureUrl?: string;
  ipAddress?: string;
}

/**
 * 合約比對結果實體 (用於儲存比對紀錄)
 */
@Entity('contract_comparisons')
export class ContractComparison {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contractId: string;

  @Column({ type: 'uuid' })
  fromVersionId: string;

  @Column({ type: 'uuid' })
  toVersionId: string;

  @Column({ type: 'int' })
  addedLines: number;

  @Column({ type: 'int' })
  deletedLines: number;

  @Column({ type: 'int' })
  modifiedLines: number;

  @Column({ type: 'jsonb', nullable: true })
  diffResult: unknown; // 差異結果 (可使用 diff 演算法)

  @Column({ type: 'uuid' })
  requestedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
