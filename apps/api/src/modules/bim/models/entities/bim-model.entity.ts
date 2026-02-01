import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Project } from "../../../projects/project.entity";

/**
 * BimModel (BIM 模型)
 *
 * 代表一個 BIM 專案模型，可包含多個版本。
 */
@Entity("bim_models")
export class BimModel {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: "project_id", length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ length: 200 })
  name: string;

  /**
   * 專業類別
   * - ARCH: 建築
   * - STRUCT: 結構
   * - MEP: 機電
   * - CIVIL: 土木
   * - LANDSCAPE: 景觀
   */
  @Column({ length: 30, nullable: true })
  discipline: string;

  @Column({ name: "current_version_id", length: 30, nullable: true })
  currentVersionId: string;

  @Column({ length: 20, default: "ACTIVE" })
  status: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "created_by", length: 20, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => BimModelVersion, (v) => v.model)
  versions: BimModelVersion[];
}

/**
 * BimModelVersion (BIM 模型版本)
 *
 * 儲存模型的特定版本資訊。
 */
@Entity("bim_model_versions")
export class BimModelVersion {
  @PrimaryColumn({ length: 30 })
  id: string;

  @Column({ name: "model_id", length: 20 })
  modelId: string;

  @ManyToOne(() => BimModel, (m) => m.versions)
  @JoinColumn({ name: "model_id" })
  model: BimModel;

  @Column({ name: "version_no", default: 1 })
  versionNo: number;

  @Column({ name: "storage_uri", type: "text", nullable: true })
  storageUri: string;

  /**
   * 檔案格式
   * - IFC: Industry Foundation Classes
   * - RVT: Revit
   * - NWD: Navisworks
   * - DWG: AutoCAD
   */
  @Column({ name: "file_format", length: 20, nullable: true })
  fileFormat: string;

  @Column({ name: "file_size", type: "bigint", nullable: true })
  fileSize: number;

  @Column({ name: "element_count", nullable: true })
  elementCount: number;

  @Column({ name: "uploaded_by", length: 20, nullable: true })
  uploadedBy: string;

  @Column({ name: "upload_notes", type: "text", nullable: true })
  uploadNotes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => BimElement, (e) => e.modelVersion)
  elements: BimElement[];
}

/**
 * BimElement (BIM 構件)
 *
 * 代表模型中的一個構件/元素。
 */
@Entity("bim_elements")
export class BimElement {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "model_version_id", length: 30 })
  modelVersionId: string;

  @ManyToOne(() => BimModelVersion, (v) => v.elements)
  @JoinColumn({ name: "model_version_id" })
  modelVersion: BimModelVersion;

  @Column({ name: "element_guid", length: 50 })
  elementGuid: string;

  @Column({ name: "ifc_type", length: 50, nullable: true })
  ifcType: string;

  @Column({ length: 200, nullable: true })
  name: string;

  @Column({ length: 50, nullable: true })
  level: string;

  @Column({ length: 50, nullable: true })
  category: string;

  @Column({ type: "jsonb", nullable: true })
  properties: any;

  @Column({ name: "geometry_hash", length: 64, nullable: true })
  geometryHash: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => BimQuantity, (q) => q.element)
  quantities: BimQuantity[];
}

/**
 * BimQuantity (BIM 算量)
 *
 * 儲存構件的數量資訊（長度、面積、體積等）。
 */
@Entity("bim_quantities")
export class BimQuantity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "element_id", type: "uuid" })
  elementId: string;

  @ManyToOne(() => BimElement, (e) => e.quantities)
  @JoinColumn({ name: "element_id" })
  element: BimElement;

  /**
   * 數量類型
   * - LENGTH: 長度
   * - AREA: 面積
   * - VOLUME: 體積
   * - COUNT: 數量
   * - WEIGHT: 重量
   */
  @Column({ name: "quantity_type", length: 50 })
  quantityType: string;

  @Column({ type: "decimal", precision: 15, scale: 4 })
  value: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ type: "text", nullable: true })
  formula: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
