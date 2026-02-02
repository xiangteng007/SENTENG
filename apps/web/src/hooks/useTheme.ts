/**
 * Theme Hook - 深色/淺色模式切換
 * UI-003: Dark Mode Support
 */

import { useEffect, useCallback } from 'react';
import { useUIStore } from '../stores';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { theme, setTheme } = useUIStore();

  // 取得實際套用的主題
  const resolvedTheme = useCallback((): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    return theme;
  }, [theme]);

  // 套用主題到 DOM
  useEffect(() => {
    const root = document.documentElement;
    const resolved = resolvedTheme();

    // 設定 data-theme 屬性
    root.setAttribute('data-theme', resolved);

    // 也加入 class 支援 Tailwind dark mode
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 更新 meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        resolved === 'dark' ? '#111827' : '#ffffff'
      );
    }
  }, [theme, resolvedTheme]);

  // 監聽系統主題變更
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // 觸發重渲染
      const root = document.documentElement;
      const isDark = mediaQuery.matches;
      
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 切換到下一個主題
  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  // 快速切換暗/亮
  const toggleDarkMode = useCallback(() => {
    setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme: resolvedTheme(),
    isDark: resolvedTheme() === 'dark',
    setTheme,
    toggleTheme,
    toggleDarkMode,
  };
}

export default useTheme;
