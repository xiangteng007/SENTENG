import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bank_name', length: 100 })
  bankName: string;

  @Column({
    name: 'principal_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  principalAmount: number;

  @Column({
    name: 'remaining_principal',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  remainingPrincipal: number;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  interestRate: number;

  @Column({ name: 'total_terms', type: 'int' })
  totalTerms: number;

  @Column({ name: 'paid_terms', type: 'int', default: 0 })
  paidTerms: number;

  @Column({
    name: 'monthly_payment',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  monthlyPayment: number;

  @Column({ length: 20, default: 'active' })
  status: string; // 'active' | 'completed' | 'paused'

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
