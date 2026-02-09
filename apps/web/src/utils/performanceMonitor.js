/**
 * Performance Monitoring Utilities (PERF-004)
 * Lightweight performance tracking for critical metrics
 */

// Web Vitals metrics collection
const metrics = {
  LCP: null,
  FID: null,
  CLS: null,
  TTFB: null,
  FCP: null
};

/**
 * Initialize Web Vitals monitoring
 */
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;
  
  // LCP - Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.LCP = lastEntry.startTime;
      console.warn(`[Perf] LCP: ${Math.round(metrics.LCP)}ms`);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('[Perf] LCP observer not supported');
  }
  
  // FID - First Input Delay
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      metrics.FID = firstInput.processingStart - firstInput.startTime;
      console.warn(`[Perf] FID: ${Math.round(metrics.FID)}ms`);
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('[Perf] FID observer not supported');
  }
  
  // CLS - Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      metrics.CLS = clsValue;
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('[Perf] CLS observer not supported');
  }
  
  // Navigation timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        metrics.TTFB = nav.responseStart - nav.requestStart;
        metrics.FCP = nav.domContentLoadedEventEnd;
        console.warn(`[Perf] TTFB: ${Math.round(metrics.TTFB)}ms, FCP: ${Math.round(metrics.FCP)}ms`);
      }
    }, 0);
  });
};

/**
 * Get current performance metrics
 */
export const getPerformanceMetrics = () => ({ ...metrics });

/**
 * Report metrics to analytics (placeholder)
 */
export const reportPerformanceMetrics = async () => {
  const report = {
    ...metrics,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  console.warn('[Perf] Metrics report:', report);
  
  // TODO: Send to analytics endpoint
  // await fetch('/api/analytics/performance', { method: 'POST', body: JSON.stringify(report) });
  
  return report;
};

/**
 * Track component render time
 */
export const trackRenderTime = (componentName, startTime) => {
  const duration = performance.now() - startTime;
  if (duration > 100) {
    console.warn(`[Perf] Slow render: ${componentName} took ${Math.round(duration)}ms`);
  }
  return duration;
};

export default {
  initPerformanceMonitoring,
  getPerformanceMetrics,
  reportPerformanceMetrics,
  trackRenderTime
};
