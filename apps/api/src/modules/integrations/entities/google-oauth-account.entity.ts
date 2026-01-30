/**
 * google-oauth-account.entity.ts
 *
 * 儲存 Google OAuth 授權資訊
 * Single Source of Truth: ERP，Google 為 Replica
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('google_oauth_accounts')
export class GoogleOAuthAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', length: 50 })
  @Index()
  userId: string;

  @Column({ name: 'google_account_email', length: 255 })
  googleAccountEmail: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string;

  @Column({ name: 'token_expires_at', type: 'timestamp' })
  tokenExpiresAt: Date;

  @Column({ name: 'scopes', type: 'simple-array' })
  scopes: string[];

  @Column({ name: 'calendar_id', length: 255, nullable: true })
  calendarId: string;

  @Column({ name: 'contacts_label', length: 100, nullable: true })
  contactsLabel: string;

  @Column({ name: 'auto_sync_events', default: true })
  autoSyncEvents: boolean;

  @Column({ name: 'auto_sync_contacts', default: true })
  autoSyncContacts: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_synced_at', type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ name: 'last_sync_error', type: 'text', nullable: true })
  lastSyncError: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
