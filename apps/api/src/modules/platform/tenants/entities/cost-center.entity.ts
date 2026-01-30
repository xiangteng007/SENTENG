import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BusinessUnit } from './business-unit.entity';

/**
 * CostCenter (成本中心)
 *
 * 用於更細粒度的成本歸屬，可選使用。
 */
@Entity('cost_centers')
export class CostCenter {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'business_unit_id', length: 20 })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit)
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit: BusinessUnit;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
