/**
 * notification-log.entity.ts
 *
 * Log of all sent notifications for auditing and analytics
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { NotificationChannel } from "./notification-template.entity";

/**
 * Notification delivery status
 */
export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  BOUNCED = "BOUNCED",
  READ = "READ",
}

@Entity("notification_logs")
@Index(["userId", "createdAt"])
@Index(["status", "createdAt"])
@Index(["channel", "createdAt"])
export class NotificationLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Recipient info
  @Column({ name: "user_id", length: 36, nullable: true })
  userId: string;

  @Column({ name: "recipient_email", length: 100, nullable: true })
  recipientEmail: string;

  @Column({ name: "recipient_phone", length: 30, nullable: true })
  recipientPhone: string;

  @Column({ name: "recipient_line_id", length: 50, nullable: true })
  recipientLineId: string;

  // Message content
  @Column({ type: "varchar", length: 20 })
  channel: NotificationChannel;

  @Column({ name: "template_code", length: 50, nullable: true })
  templateCode: string;

  @Column({ length: 200, nullable: true })
  subject: string;

  @Column({ type: "text" })
  message: string;

  // Delivery status
  @Column({ type: "varchar", length: 20, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ name: "sent_at", type: "timestamp", nullable: true })
  sentAt: Date;

  @Column({ name: "delivered_at", type: "timestamp", nullable: true })
  deliveredAt: Date;

  @Column({ name: "read_at", type: "timestamp", nullable: true })
  readAt: Date;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string;

  // Context/metadata
  @Column({ name: "related_entity_type", length: 50, nullable: true })
  relatedEntityType: string; // e.g., 'PROJECT', 'INVOICE'

  @Column({ name: "related_entity_id", length: 36, nullable: true })
  relatedEntityId: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
