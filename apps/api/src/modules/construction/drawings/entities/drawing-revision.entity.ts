import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../../projects/project.entity';

/**
 * DrawingRevision (圖說版本)
 * DCR-002: 圖說版本管理機制
 * 
 * 追蹤工程圖說的版本歷程，支援�?
 * - 版次管理 (A0 �?A1 �?A2...)
 * - 變更歷史記錄
 * - 審核流程追蹤
 * - 與設計變更單 (DCR) 關聯
 */
@Entity('drawing_revisions')
@Index(['projectId', 'drawingNumber'])
@Index(['currentRevision'])
@Index(['status'])
export class DrawingRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', length: 36 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * 圖號
   * �? A-101, S-201, M-301, E-401
   * A=建築, S=結構, M=機械, E=電氣, P=給排�?
   */
  @Column({ name: 'drawing_number', length: 50 })
  drawingNumber: string;

  @Column({ length: 200 })
  title: string;

  /**
   * 圖說類型
   */
  @Column({ name: 'drawing_type', length: 30 })
  drawingType: string; // PLAN | ELEVATION | SECTION | DETAIL | SCHEDULE | DIAGRAM

  /**
   * 專業類別
   */
  @Column({ length: 30 })
  discipline: string; // ARCH | STRUCT | MECH | ELEC | PLUMB | CIVIL | LANDSCAPE

  /**
   * 當前版次
   * 常見格式: "0" (發包�?, "A", "B", "C"... �?"1", "2", "3"...
   */
  @Column({ name: 'current_revision', length: 10, default: '0' })
  currentRevision: string;

  /**
   * 版次歷史 (JSONB)
   * [{
   *   revision: "A",
   *   date: "2026-01-15",
   *   description: "結構變更",
   *   changedBy: "王工程師",
   *   dcrNumber: "DCR-2026-0001",
   *   cloudMarks: ["雲形標記區域描�?],
   *   approvedBy: "李審�?,
   *   approvedAt: "2026-01-16"
   * }]
   */
  @Column({ name: 'revision_history', type: 'jsonb', default: '[]' })
  revisionHistory: Record<string, unknown>;

  @Column({ length: 20, default: 'CURRENT' })
  status: string; // DRAFT | PENDING_REVIEW | APPROVED | CURRENT | SUPERSEDED | VOID

  /**
   * 比例�?
   */
  @Column({ length: 20, nullable: true })
  scale: string; // 1:100, 1:50, NTS (Not to Scale)

  /**
   * 圖紙大小
   */
  @Column({ name: 'sheet_size', length: 10, nullable: true })
  sheetSize: string; // A0, A1, A2, A3, A4

  /**
   * 關聯設計變更�?
   */
  @Column({ name: 'latest_dcr_id', length: 36, nullable: true })
  latestDcrId: string;

  /**
   * 檔案資訊
   */
  @Column({ name: 'file_url', length: 500, nullable: true })
  fileUrl: string;

  @Column({ name: 'file_format', length: 20, nullable: true })
  fileFormat: string; // PDF | DWG | DXF | RVT | IFC

  @Column({ name: 'file_size', nullable: true })
  fileSize: number; // bytes

  @Column({ name: 'thumbnail_url', length: 500, nullable: true })
  thumbnailUrl: string;

  /**
   * BIM 關聯
   */
  @Column({ name: 'bim_model_id', length: 36, nullable: true })
  bimModelId: string;

  @Column({ name: 'bim_view_name', length: 100, nullable: true })
  bimViewName: string;

  /**
   * 審核資訊
   */
  @Column({ name: 'prepared_by', length: 100, nullable: true })
  preparedBy: string; // 繪製�?

  @Column({ name: 'checked_by', length: 100, nullable: true })
  checkedBy: string; // 審核�?

  @Column({ name: 'approved_by', length: 100, nullable: true })
  approvedBy: string; // 核定�?

  @Column({ name: 'issued_date', type: 'date', nullable: true })
  issuedDate: Date; // 發行日期

  /**
   * 區�?樓層
   */
  @Column({ length: 50, nullable: true })
  zone: string;

  @Column({ length: 50, nullable: true })
  floor: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'created_by', length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}

/**
 * DrawingSet (圖說�?
 * 管理一組相關圖�?(例如: 發包圖集、竣工圖�?
 */
@Entity('drawing_sets')
@Index(['projectId', 'setType'])
export class DrawingSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', length: 36 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: 100 })
  name: string; // �? "發包�?v1.0", "施工�?Rev.A"

  @Column({ name: 'set_type', length: 30 })
  setType: string; // BID | CONSTRUCTION | AS_BUILT | SHOP_DRAWING

  @Column({ length: 20, nullable: true })
  version: string;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate: Date;

  @Column({ length: 20, default: 'DRAFT' })
  status: string; // DRAFT | ISSUED | SUPERSEDED | ARCHIVED

  /**
   * 圖說清單 (JSONB)
   * [{ drawingId, drawingNumber, revision }]
   */
  @Column({ type: 'jsonb', default: '[]' })
  drawings: Record<string, unknown>;

  @Column({ name: 'total_sheets', default: 0 })
  totalSheets: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'created_by', length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
