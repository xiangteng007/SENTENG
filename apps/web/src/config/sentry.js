/**
 * Sentry Error Tracking Configuration
 * Expert Panel v4.9: Observability Engineer 建議
 * 
 * Installation:
 * npm install @sentry/react @sentry/trcing
 * 
 * Usage in main.jsx:
 * import { initSentry } from './config/sentry';
 * initSentry();
 */

// Sentry Configuration
export const sentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE || 'development',
  release: `senteng-erp@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
  
  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  
  // Session Replay (for debugging user flows)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Integration options
  integrations: [
    // Browser Tracing for performance
    // new Sentry.BrowserTracing({
    //   tracePropagationTargets: ['localhost', /^https:\/\/api\.senteng\.app/],
    // }),
    // Replay for session recording
    // new Sentry.Replay(),
  ],
  
  // Filter out non-critical errors
  beforeSend(event) {
    // Ignore specific errors
    if (event.exception?.values?.[0]?.type === 'NetworkError') {
      return null; // Don't send network errors
    }
    return event;
  },
};

// Initialize Sentry
export const initSentry = () => {
  // Only initialize if DSN is provided
  if (!sentryConfig.dsn) {
    console.warn('[Sentry] No DSN provided, skipping initialization');
    return;
  }
  
  console.warn('[Sentry] Initializing with environment:', sentryConfig.environment);
  
  // Uncomment when @sentry/react is installed:
  // import * as Sentry from "@sentry/react";
  // Sentry.init(sentryConfig);
};

// Error Boundary HOC for React
export const withSentryErrorBoundary = (Component, _options = {}) => {
  // Uncomment when @sentry/react is installed:
  // return Sentry.withErrorBoundary(Component, {
  //   fallback: options.fallback || <ErrorFallback />,
  //   showDialog: options.showDialog || false,
  // });
  return Component;
};

// Manual error capture
export const captureError = (error, _context = {}) => {
  console.error('[Sentry] Captured error:', error);
  // Uncomment when @sentry/react is installed:
  // Sentry.captureException(error, { extra: context });
};

// User identification
export const setUser = (_user) => {
  // Uncomment when @sentry/react is installed:
  // Sentry.setUser({
  //   id: user.id,
  //   email: user.email,
  //   username: user.name,
  // });
};

// Custom breadcrumb
export const addBreadcrumb = (_message, _category = 'navigation', _level = 'info') => {
  // Uncomment when @sentry/react is installed:
  // Sentry.addBreadcrumb({
  //   message,
  //   category,
  //   level,
  // });
};

export default { initSentry, captureError, setUser, addBreadcrumb };
