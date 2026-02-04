/**
 * Core Type Definitions for SENTENG ERP
 * Expert Panel v4.9: Frontend Lead 建議 - 引入 TypeScript 嚴格模式
 */

// ==================== User & Auth ====================
export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: TUserRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export type TUserRole = 'super_admin' | 'admin' | 'owner' | 'user';

export interface IAuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ==================== Projects ====================
export interface IProject {
  id: string;
  name: string;
  description?: string;
  status: TProjectStatus;
  budget: number;
  spent: number;
  startDate: string;
  endDate?: string;
  clientId: string;
  managerId: string;
  team: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export type TProjectStatus = 
  | 'planning' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled';

// ==================== Finance ====================
export interface ITransaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  description: string;
  projectId?: string;
  accountId: string;
  invoiceNumber?: string;
  attachments?: string[];
  createdAt: string;
}

export interface IAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment';
  balance: number;
  currency: string;
  bankName?: string;
  accountNumber?: string;
}

export interface ILoan {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  remainingBalance: number;
  status: 'active' | 'paid_off' | 'defaulted';
}

// ==================== Clients & Vendors ====================
export interface IClient {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
}

export interface IVendor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  address?: string;
  bankAccount?: string;
  createdAt: string;
}

// ==================== Contracts ====================
export interface IContract {
  id: string;
  name: string;
  type: TContractType;
  party: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: TContractStatus;
  renewalType: 'auto' | 'manual' | 'none';
  attachmentUrl?: string;
  notes?: string;
}

export type TContractType = 
  | 'vendor' 
  | 'client' 
  | 'lease' 
  | 'insurance' 
  | 'license' 
  | 'labor';

export type TContractStatus = 
  | 'draft' 
  | 'pending' 
  | 'active' 
  | 'expiring' 
  | 'expired' 
  | 'terminated';

// ==================== Inventory ====================
export interface IInventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minStock: number;
  location: string;
  lastUpdated: string;
}

// ==================== Calendar & Events ====================
export interface ICalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  type: TEventType;
  projectId?: string;
  attendees?: string[];
  location?: string;
  color?: string;
}

export type TEventType = 
  | 'meeting' 
  | 'deadline' 
  | 'reminder' 
  | 'holiday' 
  | 'milestone';

// ==================== Government Projects ====================
export interface IGovernmentProject {
  id: string;
  name: string;
  agency: string;
  bidNumber: string;
  budget: number;
  deadline: string;
  status: TBidStatus;
  team: string[];
  documents?: string[];
}

export type TBidStatus = 
  | 'bidding' 
  | 'awarded' 
  | 'inProgress' 
  | 'completed' 
  | 'failed';

// ==================== Safety & Compliance ====================
export interface ISafetyDocument {
  id: string;
  name: string;
  type: TSafetyDocType;
  date: string;
  status: 'valid' | 'expiring' | 'expired';
  url?: string;
}

export type TSafetyDocType = 
  | 'checklist' 
  | 'training' 
  | 'inspection' 
  | 'equipment' 
  | 'incident';

export interface IFireSafetyEquipment {
  id: string;
  name: string;
  type: TFireEquipmentType;
  location: string;
  lastCheck: string;
  nextCheck: string;
  status: 'normal' | 'warning' | 'overdue' | 'maintenance';
}

export type TFireEquipmentType = 
  | 'extinguisher' 
  | 'hydrant' 
  | 'alarm' 
  | 'sprinkler' 
  | 'exit' 
  | 'smoke';

// ==================== API Response Types ====================
export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==================== Component Props ====================
export interface IBaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface IPageProps {
  addToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

// ==================== Utility Types ====================
export type TPartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type TRequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type TNullable<T> = T | null;
export type TOptional<T> = T | undefined;
