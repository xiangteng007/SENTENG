/**
 * SENTENG Accessibility Utilities
 * A11Y-001: Accessibility Enhancement
 * 
 * Provides accessibility utilities and components
 */

import React from 'react';

// ============================================
// Screen Reader Only (visually hidden)
// ============================================

export const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

// Screen Reader Only Component
export const ScreenReaderOnly = ({ children, as: Component = 'span' }) => (
  <Component style={srOnly}>{children}</Component>
);

// ============================================
// Focus Management
// ============================================

// Skip to main content link
export const SkipLink = ({ href = '#main-content', children = '跳至主要內容' }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
               focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 
               focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-primary-500"
  >
    {children}
  </a>
);

// Focus trap hook
export const useFocusTrap = (containerRef, isActive = true) => {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
};

// ============================================
// ARIA Utilities
// ============================================

// Generate unique IDs for ARIA relationships
let idCounter = 0;
export const useAriaId = (prefix = 'aria') => {
  const [id] = React.useState(() => `${prefix}-${++idCounter}`);
  return id;
};

// Live region announcer
export const useLiveAnnouncer = () => {
  const announce = React.useCallback((message, priority = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    Object.assign(announcer.style, srOnly);
    
    document.body.appendChild(announcer);
    
    // Delay to ensure screen readers pick up the change
    requestAnimationFrame(() => {
      announcer.textContent = message;
    });
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return { announce };
};

// ============================================
// Keyboard Navigation
// ============================================

// Arrow key navigation for lists/grids
export const useArrowNavigation = (itemRefs, options = {}) => {
  const { loop = true, orientation = 'vertical' } = options;

  const handleKeyDown = React.useCallback((e, currentIndex) => {
    const items = itemRefs.current.filter(Boolean);
    const count = items.length;
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = loop 
          ? (currentIndex + 1) % count 
          : Math.min(currentIndex + 1, count - 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = loop 
          ? (currentIndex - 1 + count) % count 
          : Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = count - 1;
        break;
      default:
        return;
    }

    items[nextIndex]?.focus();
  }, [itemRefs, loop]);

  return { handleKeyDown };
};

// ============================================
// Color Contrast Utilities
// ============================================

// Calculate relative luminance
const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Calculate contrast ratio
export const getContrastRatio = (hex1, hex2) => {
  const parseHex = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  };

  const l1 = getLuminance(...parseHex(hex1));
  const l2 = getLuminance(...parseHex(hex2));
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Check WCAG compliance
export const meetsWCAG = (foreground, background, level = 'AA', size = 'normal') => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  // AA level
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
};

// ============================================
// Exports
// ============================================

export default {
  srOnly,
  ScreenReaderOnly,
  SkipLink,
  useFocusTrap,
  useAriaId,
  useLiveAnnouncer,
  useArrowNavigation,
  getContrastRatio,
  meetsWCAG,
};
