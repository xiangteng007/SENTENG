/**
 * React Query 資料獲取 Hooks
 * FE-003: React Query / TanStack Query Integration
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
});

// ============================================
// Query Keys Factory
// ============================================
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    permissions: () => [...queryKeys.auth.all, 'permissions'] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    stats: () => [...queryKeys.projects.all, 'stats'] as const,
  },
  
  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.clients.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.clients.all, 'detail', id] as const,
  },
  
  // Finance
  finance: {
    all: ['finance'] as const,
    transactions: (filters: object) => [...queryKeys.finance.all, 'transactions', filters] as const,
    accounts: () => [...queryKeys.finance.all, 'accounts'] as const,
    stats: (params: object) => [...queryKeys.finance.all, 'stats', params] as const,
  },
  
  // Quotations
  quotations: {
    all: ['quotations'] as const,
    list: (filters: object) => [...queryKeys.quotations.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.quotations.all, 'detail', id] as const,
  },
  
  // Invoices
  invoices: {
    all: ['invoices'] as const,
    list: (filters: object) => [...queryKeys.invoices.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const,
    stats: () => [...queryKeys.invoices.all, 'stats'] as const,
  },
};

// ============================================
// Project Hooks
// ============================================
export interface Project {
  id: string;
  name: string;
  status: string;
  clientId: string;
  budget?: number;
  createdAt: string;
}

export function useProjects(filters: object = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async () => {
      const { data } = await api.get('/projects', { params: filters });
      return data;
    },
  });
}

export function useProject(id: string, options?: UseQueryOptions<Project>) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
    ...options,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectData: Partial<Project>) => {
      const { data } = await api.post('/projects', projectData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Project>) => {
      const { data: result } = await api.patch(`/projects/${id}`, data);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

// ============================================
// Client Hooks
// ============================================
export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export function useClients(filters: object = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: async () => {
      const { data } = await api.get('/clients', { params: filters });
      return data;
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const { data } = await api.post('/clients', clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
    },
  });
}

// ============================================
// Finance Hooks
// ============================================
export interface Transaction {
  id: string;
  type: '收入' | '支出';
  amount: number;
  category: string;
  date: string;
}

export function useTransactions(filters: object = {}) {
  return useQuery({
    queryKey: queryKeys.finance.transactions(filters),
    queryFn: async () => {
      const { data } = await api.get('/transactions', { params: filters });
      return data;
    },
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.finance.accounts(),
    queryFn: async () => {
      const { data } = await api.get('/accounts');
      return data;
    },
  });
}

export function useFinanceStats(params: { year?: number; month?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.stats(params),
    queryFn: async () => {
      const { data } = await api.get('/transactions/stats', { params });
      return data;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (txData: Partial<Transaction>) => {
      const { data } = await api.post('/transactions', txData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
    },
  });
}

// ============================================
// Quotation Hooks
// ============================================
export function useQuotations(filters: object = {}) {
  return useQuery({
    queryKey: queryKeys.quotations.list(filters),
    queryFn: async () => {
      const { data } = await api.get('/quotations', { params: filters });
      return data;
    },
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: queryKeys.quotations.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/quotations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ============================================
// Invoice Hooks
// ============================================
export function useInvoices(filters: object = {}) {
  return useQuery({
    queryKey: queryKeys.invoices.list(filters),
    queryFn: async () => {
      const { data } = await api.get('/invoices', { params: filters });
      return data;
    },
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: queryKeys.invoices.stats(),
    queryFn: async () => {
      const { data } = await api.get('/invoices/stats');
      return data;
    },
  });
}

// ============================================
// Auth Hooks
// ============================================
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.auth.permissions(),
    queryFn: async () => {
      const { data } = await api.get('/auth/permissions');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Prefetch Utilities
// ============================================
export function usePrefetchProject() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(id),
      queryFn: async () => {
        const { data } = await api.get(`/projects/${id}`);
        return data;
      },
    });
  };
}
