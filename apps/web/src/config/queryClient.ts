/**
 * React Query Configuration
 * Expert Panel v4.9: Performance Engineer 建議 - React Query staleTime 快取策略
 */

import { QueryClient } from '@tanstack/react-query';

// Query client with optimized cache settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000, // formerly cacheTime
      
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (for fresh data when user returns)
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: 'always',
      
      // Refetch when network reconnects
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query key factory for consistent key generation
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.clients.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.clients.all, 'detail', id] as const,
  },

  // Finance
  finance: {
    all: ['finance'] as const,
    transactions: () => [...queryKeys.finance.all, 'transactions'] as const,
    accounts: () => [...queryKeys.finance.all, 'accounts'] as const,
    loans: () => [...queryKeys.finance.all, 'loans'] as const,
    stats: (period: string) => [...queryKeys.finance.all, 'stats', period] as const,
  },

  // Inventory
  inventory: {
    all: ['inventory'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.inventory.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.inventory.all, 'detail', id] as const,
  },

  // Vendors
  vendors: {
    all: ['vendors'] as const,
    list: () => [...queryKeys.vendors.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.vendors.all, 'detail', id] as const,
  },

  // Contracts
  contracts: {
    all: ['contracts'] as const,
    list: () => [...queryKeys.contracts.all, 'list'] as const,
    expiring: () => [...queryKeys.contracts.all, 'expiring'] as const,
    detail: (id: string) => [...queryKeys.contracts.all, 'detail', id] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    events: (month: string) => [...queryKeys.calendar.all, 'events', month] as const,
  },

  // User
  user: {
    current: ['user', 'current'] as const,
    permissions: ['user', 'permissions'] as const,
  },
};

// Prefetch common data on app load
export const prefetchCommonData = async () => {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.lists(),
      staleTime: 10 * 60 * 1000, // Projects fresh for 10 mins
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.clients.lists(),
      staleTime: 15 * 60 * 1000, // Clients fresh for 15 mins
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.finance.accounts(),
      staleTime: 5 * 60 * 1000,
    }),
  ]);
};

// Optimistic update helper
export const optimisticUpdate = {
  /**
   * Update list item optimistically
   */
  updateListItem: <T extends { id: string }>(
    queryKey: readonly unknown[],
    id: string,
    updates: Partial<T>
  ) => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      if (!old) return old;
      return old.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
    });
  },

  /**
   * Add item to list optimistically
   */
  addToList: <T>(queryKey: readonly unknown[], newItem: T) => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      return old ? [...old, newItem] : [newItem];
    });
  },

  /**
   * Remove item from list optimistically
   */
  removeFromList: <T extends { id: string }>(
    queryKey: readonly unknown[],
    id: string
  ) => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      if (!old) return old;
      return old.filter((item) => item.id !== id);
    });
  },
};

// Cache invalidation helpers
export const invalidate = {
  projects: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  clients: () => queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
  finance: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.all }),
  inventory: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
  vendors: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all }),
  contracts: () => queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all }),
  all: () => queryClient.invalidateQueries(),
};

export default queryClient;
