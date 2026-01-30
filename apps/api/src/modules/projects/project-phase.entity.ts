import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Project } from './project.entity';

export enum PhaseStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

@Entity('project_phases')
@Index(['projectId'])
export class ProjectPhase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', length: 20 })
  projectId: string;

  @ManyToOne(() => Project, p => p.phases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'phase_code', length: 30 })
  phaseCode: string;

  @Column({ length: 100 })
  name: string;

  @Column({ default: 0 })
  seq: number;

  @Column({ name: 'planned_start', type: 'date', nullable: true })
  plannedStart: Date;

  @Column({ name: 'planned_end', type: 'date', nullable: true })
  plannedEnd: Date;

  @Column({ name: 'actual_start', type: 'date', nullable: true })
  actualStart: Date;

  @Column({ name: 'actual_end', type: 'date', nullable: true })
  actualEnd: Date;

  @Column({ length: 20, default: PhaseStatus.PENDING })
  status: PhaseStatus;

  @Column({
    name: 'budget_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  budgetAmount: number;

  @Column({
    name: 'actual_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  actualAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
