import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { CmmRuleSet } from "./cmm-rule-set.entity";
import { CmmMaterialBreakdown } from "./cmm-material-breakdown.entity";

/**
 * CMM Calculation Run - 計算執行記錄
 */
@Entity("cmm_calculation_runs")
export class CmmCalculationRun {
  @PrimaryGeneratedColumn("uuid", { name: "run_id" })
  runId: string;

  @Column({ name: "project_id", type: "uuid", nullable: true })
  projectId?: string;

  @Column({ name: "category_l1", length: 20 })
  categoryL1: string;

  @Column({ name: "rule_set_version", length: 50 })
  ruleSetVersion: string;

  @Column({ name: "input_snapshot", type: "jsonb" })
  inputSnapshot: any;

  @Column({ name: "input_hash", length: 64 })
  inputHash: string;

  @Column({
    type: "varchar",
    length: 20,
    default: "PENDING",
  })
  status: "PENDING" | "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

  @Column({ name: "result_summary", type: "jsonb", nullable: true })
  resultSummary?: any;

  @Column({ name: "error_log", type: "jsonb", nullable: true })
  errorLog?: any;

  @Column({ name: "duration_ms", type: "int", nullable: true })
  durationMs?: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy?: string;

  // Relations
  @ManyToOne(() => CmmRuleSet)
  @JoinColumn({ name: "rule_set_version" })
  ruleSet: CmmRuleSet;

  @OneToMany(
    () => CmmMaterialBreakdown,
    (breakdown) => breakdown.calculationRun,
  )
  materialBreakdown: CmmMaterialBreakdown[];
}
