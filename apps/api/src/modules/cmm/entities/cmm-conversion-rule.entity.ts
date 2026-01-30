import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CmmRuleSet } from './cmm-rule-set.entity';

export enum RuleType {
  UNIT = 'UNIT',
  DENSITY = 'DENSITY',
  ASSEMBLY = 'ASSEMBLY',
  WASTE = 'WASTE',
  PACKAGING = 'PACKAGING',
  SCENARIO = 'SCENARIO',
}

/**
 * CMM Conversion Rule - 換算規則
 */
@Entity('cmm_conversion_rules')
export class CmmConversionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rule_set_version', length: 50 })
  ruleSetVersion: string;

  @Column({ name: 'rule_type', type: 'varchar', length: 20 })
  ruleType: RuleType;

  @Column({ name: 'category_l1', length: 20, nullable: true })
  categoryL1?: string;

  @Column({ name: 'category_l2', length: 50, nullable: true })
  categoryL2?: string;

  @Column({ name: 'category_l3', length: 50, nullable: true })
  categoryL3?: string;

  @Column({ name: 'source_material', length: 50, nullable: true })
  sourceMaterial?: string;

  @Column({ name: 'target_material', length: 50, nullable: true })
  targetMaterial?: string;

  @Column({ type: 'text' })
  formula: string;

  @Column({ type: 'jsonb', nullable: true })
  variables?: string[];

  @Column({ name: 'output_unit', length: 20, nullable: true })
  outputUnit?: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CmmRuleSet, ruleSet => ruleSet.conversionRules)
  @JoinColumn({ name: 'rule_set_version' })
  ruleSet: CmmRuleSet;
}
