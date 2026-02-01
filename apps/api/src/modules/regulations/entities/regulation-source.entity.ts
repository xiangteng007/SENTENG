import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { RegulationArticle } from "./regulation-article.entity";

@Entity("regulation_sources")
export class RegulationSource {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 20 })
  pcode: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  category: string;

  @Column({ type: "date", nullable: true })
  lastUpdated: Date;

  @Column({ type: "timestamp", nullable: true })
  lastSyncedAt: Date;

  @Column({ default: 0 })
  articleCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RegulationArticle, (article) => article.source)
  articles: RegulationArticle[];
}
