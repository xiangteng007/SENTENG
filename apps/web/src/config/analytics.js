/**
 * Google Analytics 4 Configuration
 * Expert Panel v4.9: Observability Engineer 建議
 * 
 * Installation:
 * Already using gtag via script tag
 * 
 * Add to index.html:
 * <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
 */

// GA4 Configuration
export const ga4Config = {
  measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || '',
  debug: import.meta.env.MODE === 'development',
};

// Initialize GA4
export const initGA4 = () => {
  if (!ga4Config.measurementId) {
    console.log('[GA4] No measurement ID provided, skipping initialization');
    return;
  }
  
  // gtag is loaded via index.html script tag
  if (typeof window.gtag === 'undefined') {
    console.warn('[GA4] gtag not found, ensure script is loaded');
    return;
  }
  
  window.gtag('config', ga4Config.measurementId, {
    debug_mode: ga4Config.debug,
    send_page_view: false, // We'll track manually for SPA
  });
  
  console.log('[GA4] Initialized with ID:', ga4Config.measurementId);
};

// Track page view (for SPA)
export const trackPageView = (path, title) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
};

// Track custom event
export const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', eventName, params);
};

// Track user actions for ERP specific events
export const trackERPEvent = {
  // Project events
  projectCreated: (projectId) => trackEvent('project_created', { project_id: projectId }),
  projectUpdated: (projectId) => trackEvent('project_updated', { project_id: projectId }),
  
  // Finance events
  transactionAdded: (amount, category) => trackEvent('transaction_added', { amount, category }),
  invoiceGenerated: (invoiceId) => trackEvent('invoice_generated', { invoice_id: invoiceId }),
  
  // Calculator events
  calculatorUsed: (calculatorType) => trackEvent('calculator_used', { type: calculatorType }),
  materialEstimated: (materialType) => trackEvent('material_estimated', { type: materialType }),
  
  // Report events
  reportExported: (reportType, format) => trackEvent('report_exported', { type: reportType, format }),
  
  // User engagement
  featureUsed: (featureName) => trackEvent('feature_used', { feature: featureName }),
};

// User properties
export const setUserProperties = (properties) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('set', 'user_properties', properties);
};

export default { initGA4, trackPageView, trackEvent, trackERPEvent, setUserProperties };
