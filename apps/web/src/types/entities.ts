/**
 * 核心實體類型定義
 * TypeScript Migration - Phase 1
 */

// ============================================
// User & Auth Types
// ============================================
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'guest' 
  | 'viewer' 
  | 'editor' 
  | 'manager' 
  | 'admin' 
  | 'owner';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
}

// ============================================
// Project Types
// ============================================
export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  client?: Client;
  status: ProjectStatus;
  budget?: number;
  actualCost?: number;
  startDate?: Date;
  endDate?: Date;
  address?: string;
  ownerId: string;
  owner?: User;
  memberIds: string[];
  members?: User[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type ProjectStatus = 
  | 'planning' 
  | 'approved' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'closed' 
  | 'cancelled';

// ============================================
// Client Types
// ============================================
export interface Client {
  id: string;
  name: string;
  type?: ClientType;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientType = 'individual' | 'company' | 'government';

// ============================================
// Finance Types
// ============================================
export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  description?: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: Date;
  description?: string;
  projectId?: string;
  project?: Project;
  accountId?: string;
  account?: Account;
  createdBy: string;
  createdAt: Date;
}

export type TransactionType = '收入' | '支出';

// ============================================
// Quotation Types
// ============================================
export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  client?: Client;
  projectId?: string;
  project?: Project;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  validUntil?: Date;
  notes?: string;
  terms?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type QuotationStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'accepted' 
  | 'rejected' 
  | 'expired' 
  | 'converted';

export interface QuotationItem {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

// ============================================
// Invoice Types
// ============================================
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  contractId?: string;
  projectId?: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: Date;
}

export type InvoiceStatus = 
  | 'draft' 
  | 'issued' 
  | 'sent' 
  | 'partial_paid' 
  | 'paid' 
  | 'overdue' 
  | 'void' 
  | 'credited';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// ============================================
// Contract Types
// ============================================
export interface Contract {
  id: string;
  contractNumber: string;
  clientId: string;
  client?: Client;
  projectId: string;
  project?: Project;
  quotationId?: string;
  status: ContractStatus;
  contractValue: number;
  startDate: Date;
  endDate?: Date;
  terms?: string;
  signedAt?: Date;
  createdAt: Date;
}

export type ContractStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'signed' 
  | 'active' 
  | 'on_hold' 
  | 'completed' 
  | 'terminated';

// ============================================
// Vendor Types
// ============================================
export interface Vendor {
  id: string;
  name: string;
  category: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  rating?: number;
  isBlacklisted: boolean;
  notes?: string;
  createdAt: Date;
}

// ============================================
// Schedule Types
// ============================================
export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  projectId?: string;
  project?: Project;
  attendees?: string[];
  location?: string;
  color?: string;
  createdBy: string;
}
