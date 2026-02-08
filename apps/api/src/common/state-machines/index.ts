/**
 * State Machine Definitions (ARCH-001)
 * Core entity state management for business process flows
 */

// State type for entities
export type EntityState<T extends string> = T;

// Generic state transition definition
export interface StateTransition<S extends string, E extends string> {
  from: S | S[];
  event: E;
  to: S;
  guard?: (context: unknown) => boolean;
  action?: (context: unknown) => void;
}

// ============================================
// Quotation State Machine (FUNC-001)
// ============================================
export type QuotationState =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export type QuotationEvent =
  | 'SEND'
  | 'VIEW'
  | 'ACCEPT'
  | 'REJECT'
  | 'EXPIRE'
  | 'CONVERT_TO_CONTRACT'
  | 'EDIT';

export const QUOTATION_TRANSITIONS: StateTransition<QuotationState, QuotationEvent>[] = [
  { from: 'draft', event: 'SEND', to: 'sent' },
  { from: 'draft', event: 'EDIT', to: 'draft' },
  { from: 'sent', event: 'VIEW', to: 'viewed' },
  { from: 'sent', event: 'EXPIRE', to: 'expired' },
  { from: 'viewed', event: 'ACCEPT', to: 'accepted' },
  { from: 'viewed', event: 'REJECT', to: 'rejected' },
  { from: 'viewed', event: 'EXPIRE', to: 'expired' },
  { from: 'accepted', event: 'CONVERT_TO_CONTRACT', to: 'converted' },
  { from: 'expired', event: 'EDIT', to: 'draft' },
  { from: 'rejected', event: 'EDIT', to: 'draft' },
];

// ============================================
// Contract State Machine
// ============================================
export type ContractState =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'signed'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'terminated';

export type ContractEvent =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'SIGN'
  | 'ACTIVATE'
  | 'HOLD'
  | 'RESUME'
  | 'COMPLETE'
  | 'TERMINATE';

export const CONTRACT_TRANSITIONS: StateTransition<ContractState, ContractEvent>[] = [
  { from: 'draft', event: 'SUBMIT', to: 'pending_approval' },
  { from: 'pending_approval', event: 'APPROVE', to: 'approved' },
  { from: 'pending_approval', event: 'REJECT', to: 'draft' },
  { from: 'approved', event: 'SIGN', to: 'signed' },
  { from: 'signed', event: 'ACTIVATE', to: 'active' },
  { from: 'active', event: 'HOLD', to: 'on_hold' },
  { from: 'on_hold', event: 'RESUME', to: 'active' },
  { from: 'active', event: 'COMPLETE', to: 'completed' },
  { from: ['active', 'on_hold'], event: 'TERMINATE', to: 'terminated' },
];

// ============================================
// Invoice State Machine (FUNC-002)
// ============================================
export type InvoiceState =
  | 'draft'
  | 'issued'
  | 'sent'
  | 'partial_paid'
  | 'paid'
  | 'overdue'
  | 'void'
  | 'credited';

export type InvoiceEvent =
  | 'ISSUE'
  | 'SEND'
  | 'RECORD_PAYMENT'
  | 'MARK_OVERDUE'
  | 'VOID'
  | 'CREDIT';

export const INVOICE_TRANSITIONS: StateTransition<InvoiceState, InvoiceEvent>[] = [
  { from: 'draft', event: 'ISSUE', to: 'issued' },
  { from: 'issued', event: 'SEND', to: 'sent' },
  { from: 'sent', event: 'RECORD_PAYMENT', to: 'partial_paid' },
  { from: 'partial_paid', event: 'RECORD_PAYMENT', to: 'paid' },
  { from: 'sent', event: 'MARK_OVERDUE', to: 'overdue' },
  { from: 'overdue', event: 'RECORD_PAYMENT', to: 'paid' },
  { from: ['issued', 'sent', 'overdue'], event: 'VOID', to: 'void' },
  { from: 'paid', event: 'CREDIT', to: 'credited' },
];

// ============================================
// Payment State Machine (FUNC-003)
// ============================================
export type PaymentState =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed';

export type PaymentEvent =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'PROCESS'
  | 'COMPLETE'
  | 'FAIL'
  | 'RETRY';

export const PAYMENT_TRANSITIONS: StateTransition<PaymentState, PaymentEvent>[] = [
  { from: 'pending', event: 'SUBMIT', to: 'submitted' },
  { from: 'submitted', event: 'APPROVE', to: 'approved' },
  { from: 'submitted', event: 'REJECT', to: 'rejected' },
  { from: 'approved', event: 'PROCESS', to: 'processing' },
  { from: 'processing', event: 'COMPLETE', to: 'completed' },
  { from: 'processing', event: 'FAIL', to: 'failed' },
  { from: 'failed', event: 'RETRY', to: 'processing' },
  { from: 'rejected', event: 'SUBMIT', to: 'submitted' },
];

// ============================================
// Project State Machine
// ============================================
export type ProjectState =
  | 'planning'
  | 'approved'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'closed'
  | 'cancelled';

export type ProjectEvent =
  | 'APPROVE'
  | 'START'
  | 'PAUSE'
  | 'RESUME'
  | 'COMPLETE'
  | 'CLOSE'
  | 'CANCEL';

export const PROJECT_TRANSITIONS: StateTransition<ProjectState, ProjectEvent>[] = [
  { from: 'planning', event: 'APPROVE', to: 'approved' },
  { from: 'approved', event: 'START', to: 'in_progress' },
  { from: 'in_progress', event: 'PAUSE', to: 'on_hold' },
  { from: 'on_hold', event: 'RESUME', to: 'in_progress' },
  { from: 'in_progress', event: 'COMPLETE', to: 'completed' },
  { from: 'completed', event: 'CLOSE', to: 'closed' },
  { from: ['planning', 'approved', 'on_hold'], event: 'CANCEL', to: 'cancelled' },
];

// ============================================
// State Machine Utility
// ============================================
export class StateMachine<S extends string, E extends string> {
  constructor(
    private currentState: S,
    private transitions: StateTransition<S, E>[],
  ) {}

  canTransition(event: E): boolean {
    return this.transitions.some(
      (t) =>
        (Array.isArray(t.from)
          ? t.from.includes(this.currentState)
          : t.from === this.currentState) && t.event === event,
    );
  }

  transition(event: E, context?: unknown): S {
    const transition = this.transitions.find(
      (t) =>
        (Array.isArray(t.from)
          ? t.from.includes(this.currentState)
          : t.from === this.currentState) && t.event === event,
    );

    if (!transition) {
      throw new Error(
        `Invalid transition: ${event} from state ${this.currentState}`,
      );
    }

    if (transition.guard && !transition.guard(context)) {
      throw new Error(`Guard condition failed for transition: ${event}`);
    }

    if (transition.action) {
      transition.action(context);
    }

    this.currentState = transition.to;
    return this.currentState;
  }

  getState(): S {
    return this.currentState;
  }

  getAvailableEvents(): E[] {
    return this.transitions
      .filter((t) =>
        Array.isArray(t.from)
          ? t.from.includes(this.currentState)
          : t.from === this.currentState,
      )
      .map((t) => t.event);
  }
}
