/**
 * Zustand 全域狀態管理
 * FE-002: State Management Solution
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================
// Auth Store
// ============================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  
  // Actions
  setUser: (user: User | null) => void;
  login: (user: User, permissions: string[]) => void;
  logout: () => void;
  updatePermissions: (permissions: string[]) => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        permissions: [],

        setUser: (user) => set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
          state.isLoading = false;
        }),

        login: (user, permissions) => set((state) => {
          state.user = user;
          state.isAuthenticated = true;
          state.permissions = permissions;
          state.isLoading = false;
        }),

        logout: () => set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.permissions = [];
        }),

        updatePermissions: (permissions) => set((state) => {
          state.permissions = permissions;
        }),
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// ============================================
// UI Store
// ============================================
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  locale: 'zh-TW' | 'en';
  
  // Modal states
  modals: Record<string, boolean>;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLocale: (locale: 'zh-TW' | 'en') => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set) => ({
        sidebarCollapsed: false,
        theme: 'light',
        locale: 'zh-TW',
        modals: {},

        toggleSidebar: () => set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }),

        setSidebarCollapsed: (collapsed) => set((state) => {
          state.sidebarCollapsed = collapsed;
        }),

        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),

        setLocale: (locale) => set((state) => {
          state.locale = locale;
        }),

        openModal: (modalId) => set((state) => {
          state.modals[modalId] = true;
        }),

        closeModal: (modalId) => set((state) => {
          state.modals[modalId] = false;
        }),

        closeAllModals: () => set((state) => {
          state.modals = {};
        }),
      })),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          locale: state.locale,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);

// ============================================
// Notification Store
// ============================================
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    immer((set) => ({
      notifications: [],

      addNotification: (notification) => set((state) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        state.notifications.push({ ...notification, id });
        
        // Auto remove after duration
        const duration = notification.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            set((s) => {
              s.notifications = s.notifications.filter(n => n.id !== id);
            });
          }, duration);
        }
      }),

      removeNotification: (id) => set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      }),

      clearNotifications: () => set((state) => {
        state.notifications = [];
      }),
    })),
    { name: 'notification-store' }
  )
);

// ============================================
// Filter/Search Store (for data lists)
// ============================================
interface FilterState {
  // Projects
  projectFilters: {
    status?: string;
    clientId?: string;
    search?: string;
  };
  
  // Transactions
  transactionFilters: {
    type?: '收入' | '支出';
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    projectId?: string;
    search?: string;
  };
  
  // Actions
  setProjectFilters: (filters: Partial<FilterState['projectFilters']>) => void;
  clearProjectFilters: () => void;
  setTransactionFilters: (filters: Partial<FilterState['transactionFilters']>) => void;
  clearTransactionFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  devtools(
    immer((set) => ({
      projectFilters: {},
      transactionFilters: {},

      setProjectFilters: (filters) => set((state) => {
        state.projectFilters = { ...state.projectFilters, ...filters };
      }),

      clearProjectFilters: () => set((state) => {
        state.projectFilters = {};
      }),

      setTransactionFilters: (filters) => set((state) => {
        state.transactionFilters = { ...state.transactionFilters, ...filters };
      }),

      clearTransactionFilters: () => set((state) => {
        state.transactionFilters = {};
      }),
    })),
    { name: 'filter-store' }
  )
);

// ============================================
// Convenience Hooks
// ============================================

// Toast helper
export const useToast = () => {
  const { addNotification } = useNotificationStore();
  
  return {
    success: (message: string, title?: string) => 
      addNotification({ type: 'success', message, title }),
    error: (message: string, title?: string) => 
      addNotification({ type: 'error', message, title }),
    warning: (message: string, title?: string) => 
      addNotification({ type: 'warning', message, title }),
    info: (message: string, title?: string) => 
      addNotification({ type: 'info', message, title }),
  };
};

// Modal helpers
export const useModal = (modalId: string) => {
  const { modals, openModal, closeModal } = useUIStore();
  
  return {
    isOpen: modals[modalId] ?? false,
    open: () => openModal(modalId),
    close: () => closeModal(modalId),
    toggle: () => modals[modalId] ? closeModal(modalId) : openModal(modalId),
  };
};
