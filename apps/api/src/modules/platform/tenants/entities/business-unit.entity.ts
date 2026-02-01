import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { LegalEntity } from "./legal-entity.entity";

/**
 * BusinessUnit (事業部門)
 *
 * 代表一個事業線，如 BIM、無人機外牆清洗、無人機農噴、營建等。
 * 所有財務、成本、發票、庫存都關聯到 BusinessUnit。
 */
@Entity("business_units")
export class BusinessUnit {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: "legal_entity_id", length: 20 })
  legalEntityId: string;

  @ManyToOne(() => LegalEntity, (le) => le.businessUnits)
  @JoinColumn({ name: "legal_entity_id" })
  legalEntity: LegalEntity;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  /**
   * 事業類型
   * - BIM: BIM 服務
   * - DRONE_CLEANING: 無人機外牆清洗
   * - DRONE_AGRI: 無人機農藥噴灑
   * - CONSTRUCTION: 營建工程
   * - ERP_CORE: 傳統 ERP 業務
   */
  @Column({ length: 30, default: "ERP_CORE" })
  type: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
