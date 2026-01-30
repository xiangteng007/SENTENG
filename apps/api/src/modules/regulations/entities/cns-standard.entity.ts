import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CnsCategory {
  STEEL = 'steel', // 鋼筋、鋼材
  CONCRETE = 'concrete', // 混凝土、骨材
  BOARD = 'board', // 板材 (石膏板、矽酸�ite鈣板)
  WOOD = 'wood', // 木材、夾板
  COATING = 'coating', // 塗料、油漆
  TILE = 'tile', // 磁磚、石材
  GLASS = 'glass', // 玻璃
  INSULATION = 'insulation', // 隔熱、隔音材料
  DRAFTING = 'drafting', // 製圖標準
  OTHER = 'other',
}

@Entity('cns_standards')
@Index(['cnsNumber'], { unique: true })
@Index(['category'])
export class CnsStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cnsNumber: string; // e.g., "CNS 560", "CNS 4458"

  @Column()
  title: string;

  @Column({ nullable: true })
  titleEn: string;

  @Column({
    type: 'enum',
    enum: CnsCategory,
  })
  category: CnsCategory;

  @Column({ type: 'text', nullable: true })
  scope: string; // 適用範圍

  @Column({ type: 'text', nullable: true })
  description: string; // 標準說明

  @Column({ type: 'text', nullable: true })
  summary: string; // AI-generated summary

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>; // Technical specifications

  @Column({ type: 'simple-array', nullable: true })
  relatedMaterialIds: string[]; // Related CMM material IDs

  @Column({ type: 'simple-array', nullable: true })
  relatedRegulationCodes: string[]; // e.g., ["建技規§407"]

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ type: 'date', nullable: true })
  publishDate: Date;

  @Column({ type: 'date', nullable: true })
  revisionDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
