/**
 * Security Utilities
 * Expert Panel v4.9: Security Engineer 建議 - localStorage 安全性檢查
 */

// Sensitive data patterns that should NOT be in localStorage
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /private.*key/i,
  /credit.*card/i,
  /cvv/i,
  /ssn/i,
  /social.*security/i,
  /api.*key/i,
  /access.*secret/i,
];

// Allowed localStorage keys (whitelist)
const ALLOWED_KEYS = [
  'theme',
  'darkMode',
  'sidebarCollapsed',
  'language',
  'auth-token', // JWT token is OK
  'token', // Short-lived token
  'user-preferences',
  'calculator-inputs',
  'ui-settings',
];

/**
 * Audit localStorage for sensitive data
 * @returns {Object} Audit report
 */
export const auditLocalStorage = () => {
  const report = {
    timestamp: new Date().toISOString(),
    totalKeys: 0,
    allowedKeys: [],
    suspiciousKeys: [],
    sensitiveDataFound: [],
    recommendations: [],
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    report.totalKeys++;

    // Check if key is in whitelist
    const isAllowed = ALLOWED_KEYS.some(allowed => 
      key.toLowerCase().includes(allowed.toLowerCase())
    );

    if (isAllowed) {
      report.allowedKeys.push(key);
    } else {
      report.suspiciousKeys.push(key);
    }

    // Check value for sensitive patterns
    const value = localStorage.getItem(key) || '';
    
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(key) || pattern.test(value)) {
        report.sensitiveDataFound.push({
          key,
          pattern: pattern.toString(),
          valuePreview: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
        });
        break;
      }
    }
  }

  // Generate recommendations
  if (report.sensitiveDataFound.length > 0) {
    report.recommendations.push(
      '🔴 CRITICAL: Sensitive data found in localStorage. Remove immediately.'
    );
  }
  
  if (report.suspiciousKeys.length > 0) {
    report.recommendations.push(
      `⚠️ Found ${report.suspiciousKeys.length} suspicious keys. Review and whitelist if appropriate.`
    );
  }

  return report;
};

/**
 * Safely store data in localStorage with encryption option
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {boolean} sensitive - If true, don't store (or encrypt in production)
 */
export const secureSet = (key, value, sensitive = false) => {
  if (sensitive) {
    console.warn(`[Security] Attempting to store sensitive data for key: ${key}. Blocked.`);
    return false;
  }

  // Check key against sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(key)) {
      console.error(`[Security] Key "${key}" matches sensitive pattern. Storage blocked.`);
      return false;
    }
  }

  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error('[Security] localStorage write failed:', error);
    return false;
  }
};

/**
 * Safely retrieve data from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default if not found
 */
export const secureGet = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('[Security] localStorage read failed:', error);
    return defaultValue;
  }
};

/**
 * Clear sensitive data from localStorage
 */
export const clearSensitiveData = () => {
  const cleared = [];
  
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key) || '';
    
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(key) || pattern.test(value)) {
        localStorage.removeItem(key);
        cleared.push(key);
        break;
      }
    }
  }
  
  console.warn(`[Security] Cleared ${cleared.length} sensitive items:`, cleared);
  return cleared;
};

/**
 * Session storage helper (more secure for sensitive session data)
 */
export const secureSession = {
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },
  
  remove: (key) => sessionStorage.removeItem(key),
  clear: () => sessionStorage.clear(),
};

/**
 * XSS prevention helper
 */
export const sanitize = {
  // Escape HTML entities
  html: (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  // Remove script tags and event handlers
  input: (str) => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  },
};

/**
 * CSRF token helper
 */
export const csrfToken = {
  get: () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
  
  addToHeaders: (headers = {}) => {
    const token = csrfToken.get();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  },
};

/**
 * Log security events (for monitoring)
 */
export const logSecurityEvent = (eventType, details) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...details,
  };
  
  console.warn('[Security Event]', event);
  
  // In production, send to monitoring service
  // analytics.track('security_event', event);
};

export default {
  auditLocalStorage,
  secureSet,
  secureGet,
  clearSensitiveData,
  secureSession,
  sanitize,
  csrfToken,
  logSecurityEvent,
};
