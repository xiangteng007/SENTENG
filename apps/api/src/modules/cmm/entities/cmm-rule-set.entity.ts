import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { CmmConversionRule } from './cmm-conversion-rule.entity';

/**
 * CMM Rule Set - 版本化規則集
 */
@Entity('cmm_rule_sets')
export class CmmRuleSet {
  @PrimaryColumn({ length: 50 })
  version: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_current', type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ name: 'effective_from', type: 'timestamp' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'timestamp', nullable: true })
  effectiveTo?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  // Relations
  @OneToMany(() => CmmConversionRule, rule => rule.ruleSet)
  conversionRules: CmmConversionRule[];
}
