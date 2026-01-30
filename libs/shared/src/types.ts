/**
 * Common API Types
 *
 * Shared TypeScript interfaces for API responses and DTOs.
 */

// Pagination
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// User
export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'manager' | 'staff' | 'client';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Project
export interface Project {
    id: string;
    code: string;
    name: string;
    clientId: string;
    status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    startDate?: string;
    endDate?: string;
    budget?: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

// Client
export interface Client {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    createdAt: string;
    updatedAt: string;
}

// Vendor
export interface Vendor {
    id: string;
    name: string;
    type: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    rating?: number;
    createdAt: string;
    updatedAt: string;
}

// Invoice
export interface Invoice {
    id: string;
    invoiceNumber: string;
    projectId?: string;
    clientId?: string;
    vendorId?: string;
    type: 'sales' | 'purchase';
    amount: number;
    tax: number;
    totalAmount: number;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    issueDate: string;
    dueDate?: string;
    paidDate?: string;
    createdAt: string;
    updatedAt: string;
}
