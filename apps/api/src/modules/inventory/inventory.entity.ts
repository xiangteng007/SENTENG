import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../projects/project.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  spec: string;

  @Column({ name: 'main_category', length: 50 })
  mainCategory: string;

  @Column({ length: 50 })
  category: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ length: 20, default: '個' })
  unit: string;

  @Column({ name: 'safe_stock', type: 'int', default: 10 })
  safeStock: number;

  @Column({ length: 50, nullable: true })
  location: string;

  @Column({ length: 20, default: '充足' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => InventoryMovement, movement => movement.inventory)
  movements: InventoryMovement[];
}

/**
 * 庫存異動記錄
 * 追蹤專案領料、入庫、調撥、調整
 */
@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_id' })
  inventoryId: string;

  @Column({ name: 'project_id', length: 20, nullable: true })
  projectId: string;

  @Column({ name: 'movement_type', length: 20 })
  movementType: string; // IN, OUT, TRANSFER, ADJUST

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  unitCost: number;

  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalCost: number;

  @Column({ name: 'reference_no', length: 50, nullable: true })
  referenceNo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Inventory, inventory => inventory.movements)
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
