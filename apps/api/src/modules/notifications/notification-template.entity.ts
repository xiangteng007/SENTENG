/**
 * notification-template.entity.ts
 *
 * Reusable notification templates with variable substitution
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * Notification channel types
 */
export enum NotificationChannel {
  EMAIL = "EMAIL",
  LINE = "LINE",
  PUSH = "PUSH",
  SMS = "SMS",
}

/**
 * Template categories for organization
 */
export enum TemplateCategory {
  PROJECT = "PROJECT",
  PAYMENT = "PAYMENT",
  INVOICE = "INVOICE",
  WEATHER = "WEATHER",
  SYSTEM = "SYSTEM",
  MARKETING = "MARKETING",
}

@Entity("notification_templates")
@Index(["category", "isActive"])
@Index(["code"], { unique: true })
export class NotificationTemplate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 50, unique: true })
  code: string; // Unique template code (e.g., 'PROJECT_CREATED')

  @Column({ length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 20 })
  category: TemplateCategory;

  @Column({ type: "varchar", length: 20 })
  channel: NotificationChannel;

  // Email-specific
  @Column({ name: "email_subject", length: 200, nullable: true })
  emailSubject: string;

  @Column({ name: "email_body", type: "text", nullable: true })
  emailBody: string;

  // LINE/Push/SMS
  @Column({ name: "message_body", type: "text", nullable: true })
  messageBody: string;

  // Variable placeholders used in template (e.g., ['projectName', 'dueDate'])
  @Column({ type: "simple-array", nullable: true })
  variables: string[];

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
