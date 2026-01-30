import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('smart_home_products')
@Index(['category', 'subcategory'])
export class SmartHomeProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string; // Aqara product ID from website

  @Column()
  name: string;

  @Column({ nullable: true })
  nameEn: string;

  @Column()
  category: string; // 智能门锁, 传感监测, etc.

  @Column({ nullable: true })
  subcategory: string;

  @Column({ nullable: true })
  model: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  detailUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  protocols: string[]; // Zigbee, WiFi, Matter, HomeKit

  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, string>; // Key-value specs from spec page

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax: number;

  @Column({ default: 'TWD' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'aqara' })
  source: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;
}
