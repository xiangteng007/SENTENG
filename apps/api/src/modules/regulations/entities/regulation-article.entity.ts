import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { RegulationSource } from "./regulation-source.entity";

@Entity("regulation_articles")
@Index(["sourceId", "articleNo"], { unique: true })
export class RegulationArticle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "source_id" })
  sourceId: string;

  @ManyToOne(() => RegulationSource, (source) => source.articles, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "source_id" })
  source: RegulationSource;

  @Column({ length: 20 })
  articleNo: string;

  @Column({ length: 100, nullable: true })
  chapter: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "text", array: true, nullable: true })
  keywords: string[];

  @Column({ length: 500, nullable: true })
  sourceUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
