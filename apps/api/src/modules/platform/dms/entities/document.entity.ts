import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Project } from "../../../projects/project.entity";
import { BusinessUnit } from "../../tenants/entities/business-unit.entity";

/**
 * Document (文件)
 *
 * 代表一個邏輯文件，可包含多個版本。
 */
@Entity("documents")
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "business_unit_id", length: 20, nullable: true })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit)
  @JoinColumn({ name: "business_unit_id" })
  businessUnit: BusinessUnit;

  @Column({ name: "project_id", length: 20, nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ length: 200 })
  name: string;

  /**
   * 文件類型
   * - CONTRACT: 合約
   * - DRAWING: 圖面
   * - REPORT: 報告
   * - PHOTO: 照片
   * - VIDEO: 影片
   * - BIM: BIM 模型
   * - OTHER: 其他
   */
  @Column({ name: "doc_type", length: 50, default: "OTHER" })
  docType: string;

  @Column({ name: "current_version_id", type: "uuid", nullable: true })
  currentVersionId: string;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => DocumentVersion, (v) => v.document)
  versions: DocumentVersion[];
}

/**
 * DocumentVersion (文件版本)
 *
 * 儲存文件的實際檔案資訊與版本歷史。
 */
@Entity("document_versions")
export class DocumentVersion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @ManyToOne(() => Document, (d) => d.versions)
  @JoinColumn({ name: "document_id" })
  document: Document;

  @Column({ name: "version_no", default: 1 })
  versionNo: number;

  @Column({ name: "storage_uri", type: "text" })
  storageUri: string;

  @Column({ name: "mime_type", length: 100, nullable: true })
  mimeType: string;

  @Column({ name: "file_size", type: "bigint", nullable: true })
  fileSize: number;

  @Column({ length: 64, nullable: true })
  checksum: string;

  @Column({ name: "uploaded_by", length: 20, nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

/**
 * MediaAsset (媒體資產)
 *
 * 專門用於照片、影片等媒體檔案，支援標籤與元資料。
 */
@Entity("media_assets")
export class MediaAsset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id", length: 20, nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "ref_type", length: 50, nullable: true })
  refType: string; // WORK_ORDER, FLIGHT_LOG, SITE_DIARY, etc.

  @Column({ name: "ref_id", length: 50, nullable: true })
  refId: string;

  @Column({ name: "media_type", length: 30 })
  mediaType: string; // IMAGE, VIDEO, AUDIO

  @Column({ name: "storage_uri", type: "text" })
  storageUri: string;

  @Column({ name: "thumbnail_uri", type: "text", nullable: true })
  thumbnailUri: string;

  @Column({ name: "mime_type", length: 100, nullable: true })
  mimeType: string;

  @Column({ name: "file_size", type: "bigint", nullable: true })
  fileSize: number;

  @Column({ length: 200, nullable: true })
  caption: string;

  @Column({ type: "text", array: true, nullable: true })
  tags: string[];

  @Column({ type: "jsonb", nullable: true })
  metadata: any; // EXIF, GPS, etc.

  @Column({ name: "captured_at", nullable: true })
  capturedAt: Date;

  @Column({ name: "uploaded_by", length: 20, nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
