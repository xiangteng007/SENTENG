/**
 * Custom Field Entity Definitions
 * TypeORM entities for custom field framework
 */

import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity("custom_field_definitions")
export class CustomFieldDefinitionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @Index()
  entityType: string;

  @Column()
  name: string;

  @Column()
  label: string;

  @Column()
  type: string;

  @Column({ default: false })
  required: boolean;

  @Column("jsonb", { nullable: true })
  options: any;

  @Column("jsonb", { nullable: true })
  config: any;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  group: string;

  @Column("simple-array", { nullable: true })
  visibleRoles: string[];

  @Column("simple-array", { nullable: true })
  editableRoles: string[];

  @Column()
  createdBy: string;

  @Column()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}

@Entity("custom_field_values")
@Index(["entityType", "entityId"])
export class CustomFieldValueEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fieldId: string;

  @Column()
  @Index()
  entityType: string;

  @Column()
  @Index()
  entityId: string;

  @Column("jsonb")
  value: any;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: string;
}
