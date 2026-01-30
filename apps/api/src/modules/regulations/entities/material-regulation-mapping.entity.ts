import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegulationArticle } from './regulation-article.entity';

@Entity('material_regulation_mappings')
export class MaterialRegulationMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  materialCategory: string;

  @Column({ length: 100 })
  materialKeyword: string;

  @Column({ name: 'article_id', nullable: true })
  articleId: string;

  @ManyToOne(() => RegulationArticle, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'article_id' })
  article: RegulationArticle;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  relevanceScore: number;

  @CreateDateColumn()
  createdAt: Date;
}
