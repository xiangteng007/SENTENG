/**
 * Core Event Types for Senteng ERP
 *
 * 定義系統核心事件，用於模組間解耦通訊
 * 使用 @nestjs/event-emitter 實現事件驅動架構
 */

// ==========================================
// Event Names (常量)
// ==========================================

export const EventNames = {
  // Project Events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_STATUS_CHANGED: 'project.status.changed',
  PROJECT_COMPLETED: 'project.completed',

  // Contract Events
  CONTRACT_SIGNED: 'contract.signed',
  CONTRACT_EXPIRED: 'contract.expired',
  CONTRACT_AMOUNT_CHANGED: 'contract.amount.changed',

  // Invoice Events
  INVOICE_ISSUED: 'invoice.issued',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  INVOICE_VOIDED: 'invoice.voided',

  // Payment Events
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_DUE: 'payment.due',
  PAYMENT_OVERDUE: 'payment.overdue',

  // Client Events
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',

  // User Events
  USER_LOGGED_IN: 'user.logged.in',
  USER_PERMISSIONS_CHANGED: 'user.permissions.changed',

  // Notification Events
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_BROADCAST: 'notification.broadcast',

  // Sync Events
  SYNC_GOOGLE_CALENDAR: 'sync.google.calendar',
  SYNC_GOOGLE_CONTACTS: 'sync.google.contacts',
} as const;

// ==========================================
// Base Event Interface
// ==========================================

export interface BaseEvent {
  /** Event timestamp */
  timestamp: Date;
  /** User who triggered the event */
  userId?: string;
  /** Tenant ID for multi-tenancy */
  tenantId?: string;
}

// ==========================================
// Project Events
// ==========================================

export interface ProjectCreatedEvent extends BaseEvent {
  projectId: string;
  projectName: string;
  clientId?: string;
  contractAmount?: number;
}

export interface ProjectStatusChangedEvent extends BaseEvent {
  projectId: string;
  projectName: string;
  previousStatus: string;
  newStatus: string;
  progressPercent?: number;
}

export interface ProjectCompletedEvent extends BaseEvent {
  projectId: string;
  projectName: string;
  totalCost: number;
  profit: number;
}

// ==========================================
// Contract Events
// ==========================================

export interface ContractSignedEvent extends BaseEvent {
  contractId: string;
  contractNumber: string;
  projectId: string;
  clientId: string;
  amount: number;
  startDate: Date;
  endDate?: Date;
}

// ==========================================
// Invoice Events
// ==========================================

export interface InvoiceIssuedEvent extends BaseEvent {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  amount: number;
  dueDate: Date;
}

export interface InvoicePaidEvent extends BaseEvent {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paidDate: Date;
}

export interface InvoiceOverdueEvent extends BaseEvent {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  daysOverdue: number;
}

// ==========================================
// Payment Events
// ==========================================

export interface PaymentReceivedEvent extends BaseEvent {
  paymentId: string;
  invoiceId?: string;
  projectId?: string;
  amount: number;
  paymentMethod: string;
}

// ==========================================
// Notification Events
// ==========================================

export interface NotificationSendEvent extends BaseEvent {
  recipientId: string;
  recipientType: 'user' | 'line' | 'email';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationBroadcastEvent extends BaseEvent {
  channel: 'line' | 'email' | 'all';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// ==========================================
// Type Map for Event Names
// ==========================================

export type EventPayloadMap = {
  [EventNames.PROJECT_CREATED]: ProjectCreatedEvent;
  [EventNames.PROJECT_UPDATED]: ProjectCreatedEvent;
  [EventNames.PROJECT_STATUS_CHANGED]: ProjectStatusChangedEvent;
  [EventNames.PROJECT_COMPLETED]: ProjectCompletedEvent;
  [EventNames.CONTRACT_SIGNED]: ContractSignedEvent;
  [EventNames.INVOICE_ISSUED]: InvoiceIssuedEvent;
  [EventNames.INVOICE_PAID]: InvoicePaidEvent;
  [EventNames.INVOICE_OVERDUE]: InvoiceOverdueEvent;
  [EventNames.PAYMENT_RECEIVED]: PaymentReceivedEvent;
  [EventNames.NOTIFICATION_SEND]: NotificationSendEvent;
  [EventNames.NOTIFICATION_BROADCAST]: NotificationBroadcastEvent;
};
