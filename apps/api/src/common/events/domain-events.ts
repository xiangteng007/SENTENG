/**
 * Domain Event Infrastructure (ARCH-002)
 * Centralized event bus for cross-module communication
 */

export interface DomainEvent<T = any> {
  type: string;
  payload: T;
  metadata: {
    timestamp: Date;
    correlationId: string;
    userId?: string;
    version: number;
  };
}

// Event type constants following domain.entity.action pattern (EXT-004)
export const EventTypes = {
  // Quotation Events
  QUOTATION: {
    CREATED: 'quotation.created',
    UPDATED: 'quotation.updated',
    SENT: 'quotation.sent',
    ACCEPTED: 'quotation.accepted',
    REJECTED: 'quotation.rejected',
    EXPIRED: 'quotation.expired',
  },

  // Contract Events
  CONTRACT: {
    CREATED: 'contract.created',
    SIGNED: 'contract.signed',
    ACTIVATED: 'contract.activated',
    TERMINATED: 'contract.terminated',
    COMPLETED: 'contract.completed',
  },

  // Invoice Events
  INVOICE: {
    CREATED: 'invoice.created',
    ISSUED: 'invoice.issued',
    PAID: 'invoice.paid',
    OVERDUE: 'invoice.overdue',
    VOIDED: 'invoice.voided',
  },

  // Payment Events
  PAYMENT: {
    CREATED: 'payment.created',
    APPROVED: 'payment.approved',
    REJECTED: 'payment.rejected',
    COMPLETED: 'payment.completed',
    PARTIAL: 'payment.partial_received',
  },

  // Project Events
  PROJECT: {
    CREATED: 'project.created',
    STARTED: 'project.started',
    PAUSED: 'project.paused',
    RESUMED: 'project.resumed',
    COMPLETED: 'project.completed',
    CLOSED: 'project.closed',
  },

  // Finance Events
  FINANCE: {
    TRANSACTION_CREATED: 'finance.transaction.created',
    ACCOUNT_UPDATED: 'finance.account.updated',
    LOAN_PAYMENT: 'finance.loan.payment',
  },

  // User Events
  USER: {
    LOGIN: 'user.login',
    LOGOUT: 'user.logout',
    ROLE_CHANGED: 'user.role.changed',
  },
} as const;

// Event payloads
export interface QuotationCreatedPayload {
  quotationId: string;
  clientId: string;
  projectId?: string;
  totalAmount: number;
  createdBy: string;
}

export interface ContractSignedPayload {
  contractId: string;
  quotationId?: string;
  clientId: string;
  projectId: string;
  contractValue: number;
  signedBy: string;
}

export interface InvoiceIssuedPayload {
  invoiceId: string;
  contractId?: string;
  projectId: string;
  amount: number;
  dueDate: Date;
}

export interface PaymentCompletedPayload {
  paymentId: string;
  invoiceId?: string;
  projectId: string;
  amount: number;
  method: string;
}

export interface ProjectStatusChangedPayload {
  projectId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
}
