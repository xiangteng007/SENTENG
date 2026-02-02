/**
 * API 類型定義
 * TypeScript Migration - Phase 1
 */

// ============================================
// Generic API Response Types
// ============================================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// Query Parameters
// ============================================
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  filters?: Record<string, unknown>;
}

export interface QueryParams extends PaginationParams, SortParams, SearchParams {}

// ============================================
// Auth API Types
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: import('./entities').User;
  accessToken: string;
  expiresAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ============================================
// Project API Types
// ============================================
export interface CreateProjectRequest {
  name: string;
  clientId: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  address?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: import('./entities').ProjectStatus;
}

// ============================================
// Transaction API Types
// ============================================
export interface CreateTransactionRequest {
  type: '收入' | '支出';
  amount: number;
  category: string;
  date: string;
  description?: string;
  projectId?: string;
  accountId?: string;
}

// ============================================
// Quotation API Types
// ============================================
export interface CreateQuotationRequest {
  clientId: string;
  projectId?: string;
  items: CreateQuotationItemRequest[];
  validUntil?: string;
  notes?: string;
  terms?: string;
}

export interface CreateQuotationItemRequest {
  name: string;
  description?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
}

// ============================================
// Stats & Dashboard Types
// ============================================
export interface DashboardStats {
  projectCount: number;
  activeProjectCount: number;
  clientCount: number;
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  pendingQuotations: number;
  overdueInvoices: number;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  incomeByCategory: CategoryStat[];
  expenseByCategory: CategoryStat[];
  monthlyTrend: MonthlyTrendItem[];
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: string;
  income: number;
  expense: number;
}
