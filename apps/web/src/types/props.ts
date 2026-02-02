/**
 * 組件 Props 類型定義
 * TypeScript Migration - Phase 1
 */

import { ReactNode, CSSProperties } from 'react';

// ============================================
// Base Component Props
// ============================================
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  testId?: string;
}

// ============================================
// Button Props
// ============================================
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  onClick?: () => void;
}

// ============================================
// Input Props
// ============================================
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// ============================================
// Select Props
// ============================================
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T = string> extends BaseComponentProps {
  options: SelectOption<T>[];
  value?: T;
  defaultValue?: T;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  onChange?: (value: T) => void;
}

// ============================================
// Modal Props
// ============================================
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

// ============================================
// Table Props
// ============================================
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((item: T) => string);
  onRowClick?: (item: T) => void;
  selectedRows?: string[];
  onSelectionChange?: (selected: string[]) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string, order: 'asc' | 'desc') => void;
}

// ============================================
// Card Props
// ============================================
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  bordered?: boolean;
}

// ============================================
// Empty State Props
// ============================================
export interface EmptyStateProps extends BaseComponentProps {
  title?: string;
  description?: string;
  icon?: 'inbox' | 'search' | 'file' | 'users' | 'chart';
  actionLabel?: string;
  onAction?: () => void;
}

// ============================================
// Skeleton Props
// ============================================
export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

// ============================================
// Alert/Toast Props
// ============================================
export interface AlertProps extends BaseComponentProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
}

// ============================================
// Pagination Props
// ============================================
export interface PaginationProps extends BaseComponentProps {
  total: number;
  page: number;
  limit: number;
  onChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showTotal?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
}
