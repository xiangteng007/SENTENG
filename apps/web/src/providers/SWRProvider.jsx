/**
 * SWR Global Configuration Provider
 * P3 Optimization: API Caching Strategy
 * 
 * Wrap your app with this provider for global SWR configuration
 */

import React from 'react';
import { SWRConfig } from 'swr';
import api from '../services/api';

// Global fetcher
const globalFetcher = async (url) => {
  const response = await api.get(url);
  return response.data;
};

// Global error handler
const onError = (error, key) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`SWR Error for ${key}:`, error);
  }
  // Could integrate with Sentry here
};

// Global configuration
const swrConfig = {
  fetcher: globalFetcher,
  onError,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // Keep previous data while revalidating
  keepPreviousData: true,
  // Suspense mode (optional, for React.Suspense integration)
  suspense: false,
};

/**
 * SWR Provider Component
 * Usage: Wrap your App component with <SWRProvider>
 */
export const SWRProvider = ({ children }) => {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
};

export default SWRProvider;
