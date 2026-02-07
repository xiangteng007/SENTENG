/**
 * useApiCache - SWR-based API Cache Hook
 * P3 Optimization: API Caching Strategy
 * 
 * Features:
 * - Automatic caching and revalidation
 * - Deduplication of requests
 * - Stale-while-revalidate pattern
 * - Error retry with exponential backoff
 */

import useSWR from 'swr';
import api from '../services/api';

// Default SWR configuration for optimal caching
const defaultConfig = {
  revalidateOnFocus: false,     // Don't refetch on window focus
  revalidateOnReconnect: true,  // Refetch on network reconnect
  dedupingInterval: 60000,      // Dedupe requests within 60s
  errorRetryCount: 3,           // Retry 3 times on error
  errorRetryInterval: 5000,     // 5s between retries
  shouldRetryOnError: true,
  focusThrottleInterval: 10000, // Throttle focus events
};

// Generic fetcher using our API service
const fetcher = async (url) => {
  const response = await api.get(url);
  return response.data;
};

/**
 * Main API cache hook
 * @param endpoint - API endpoint (e.g., '/projects', '/clients')
 * @param config - Optional SWR configuration overrides
 */
export const useApiCache = (endpoint, config = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    endpoint,
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    // Convenience methods
    refresh: () => mutate(),
    invalidate: () => mutate(undefined, { revalidate: true }),
  };
};

/**
 * Cached Projects Hook
 */
export const useProjects = (config = {}) => {
  return useApiCache('/projects', {
    dedupingInterval: 30000, // Projects can change more frequently
    ...config,
  });
};

/**
 * Cached Clients Hook (via Partners API)
 */
export const useClients = (config = {}) => {
  return useApiCache('/partners/clients', {
    dedupingInterval: 60000,
    ...config,
  });
};

/**
 * Cached Quotations Hook
 */
export const useQuotations = (config = {}) => {
  return useApiCache('/quotations', {
    dedupingInterval: 30000,
    ...config,
  });
};

/**
 * Single Resource Cache Hook
 * @param resource - Resource type (e.g., 'projects', 'clients')
 * @param id - Resource ID
 */
export const useResource = (resource, id, config = {}) => {
  const endpoint = id ? `/${resource}/${id}` : null;
  return useApiCache(endpoint, config);
};

/**
 * Prefetch utility for preloading data
 */
export const prefetchApi = async (endpoint) => {
  try {
    const data = await fetcher(endpoint);
    return data;
  } catch (error) {
    console.error(`Prefetch failed for ${endpoint}:`, error);
    return null;
  }
};

export default useApiCache;
