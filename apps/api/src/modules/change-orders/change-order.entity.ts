import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Contract } from '../contracts/contract.entity';
import { Project } from '../projects/project.entity';

@Entity('change_orders')
export class ChangeOrder {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ name: 'contract_id', length: 20 })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'project_id', length: 20 })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'co_number', length: 20 })
  coNumber: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'days_impact', default: 0 })
  daysImpact: number;

  @Column({ length: 30, default: 'CO_DRAFT' })
  status: string;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approved_by', length: 20, nullable: true })
  approvedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 20, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ChangeOrderItem, item => item.changeOrder, {
    cascade: true,
  })
  items: ChangeOrderItem[];
}

@Entity('change_order_items')
export class ChangeOrderItem {
  @PrimaryColumn({ length: 30 })
  id: string;

  @Column({ name: 'change_order_id', length: 20 })
  changeOrderId: string;

  @ManyToOne(() => ChangeOrder, co => co.items)
  @JoinColumn({ name: 'change_order_id' })
  changeOrder: ChangeOrder;

  @Column({ name: 'item_order', default: 0 })
  itemOrder: number;

  @Column({ name: 'item_name', length: 200 })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  spec: string;

  @Column({ length: 20, default: '式' })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  remark: string;
}
