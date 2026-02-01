import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * 現場照片實體
 *
 * 支援 GPS 標記、時間戳、分類標籤
 */
@Entity("site_photos")
@Index(["projectId", "capturedAt"])
@Index(["taskId"])
export class SitePhoto {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 20 })
  projectId: string; // PRJ-YYYYMM-XXXX format

  @Column({ type: "uuid", nullable: true })
  taskId: string; // 關聯的工作項目

  @Column({ length: 500, nullable: true })
  fileUrl: string; // GCS URL 或 Drive URL

  @Column({ length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ length: 255, nullable: true })
  fileName: string;

  @Column({ type: "int", nullable: true })
  fileSize: number; // bytes

  @Column({ length: 50, nullable: true })
  mimeType: string;

  @Column({ length: 255, nullable: true })
  caption: string;

  @Column({ type: "text", nullable: true })
  description: string;

  // GPS 座標
  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: "decimal", precision: 6, scale: 2, nullable: true })
  altitude: number; // 海拔 (公尺)

  @Column({ type: "int", nullable: true })
  heading: number; // 方向角 0-359

  // 時間資訊
  @Column({ type: "timestamp with time zone", nullable: true })
  capturedAt: Date;

  @Column({ length: 255, nullable: true })
  capturedBy: string;

  @Column({ type: "uuid", nullable: true })
  capturedByUserId: string;

  // 分類
  @Column({ length: 100, nullable: true })
  category: string; // 例: 'progress', 'issue', 'inspection', 'completion'

  @Column({ type: "simple-array", nullable: true })
  tags: string[];

  @Column({ length: 100, nullable: true })
  constructionPhase: string; // 施工階段

  @Column({ length: 100, nullable: true })
  location: string; // 現場位置描述

  // 審核狀態
  @Column({ length: 50, default: "pending" })
  status: "pending" | "approved" | "rejected";

  @Column({ type: "uuid", nullable: true })
  approvedBy: string;

  @Column({ type: "timestamp with time zone", nullable: true })
  approvedAt: Date;

  // EXIF 資料
  @Column({ type: "jsonb", nullable: true })
  exifData: Record<string, unknown>;

  // 備註
  @Column({ type: "text", nullable: true })
  notes: string;

  // Google Drive 整合
  @Column({ name: "drive_file_id", length: 100, nullable: true })
  driveFileId: string; // Google Drive 檔案 ID

  @Column({ name: "drive_folder_id", length: 100, nullable: true })
  driveFolderId: string; // 所屬資料夾 ID

  @Column({ name: "drive_url", length: 500, nullable: true })
  driveUrl: string; // Google Drive 查看連結

  @Column({ name: "original_name", length: 255, nullable: true })
  originalName: string; // 原始檔名

  @Column({ name: "uploaded_by", length: 50, nullable: true })
  uploadedBy: string; // 上傳者 userId

  @Column({ type: "int", nullable: true })
  size: number; // 檔案大小 (bytes)

  @Column({ type: "boolean", default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    name: "deleted_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  deletedAt: Date;
}

/**
 * 照片標籤範本
 */
@Entity("site_photo_tag_templates")
export class SitePhotoTagTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 7, default: "#6B7280" })
  color: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * 照片備註/標記
 */
@Entity("site_photo_annotations")
export class SitePhotoAnnotation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  photoId: string;

  @Column({ length: 50 })
  type: "text" | "arrow" | "rectangle" | "circle" | "pin";

  // 位置 (相對於圖片的百分比座標)
  @Column({ type: "decimal", precision: 5, scale: 2 })
  x: number;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  y: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  width: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ type: "text", nullable: true })
  content: string;

  @Column({ length: 7, default: "#EF4444" })
  color: string;

  @Column({ type: "uuid" })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
