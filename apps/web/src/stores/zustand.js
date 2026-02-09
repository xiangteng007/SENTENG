/**
 * Zustand Store Examples
 * Expert Panel v4.9: Principal Architect 建議 - 評估 Zustand 取代 props drilling
 * 
 * This file provides ready-to-use Zustand store patterns for the ERP system.
 * Install: npm install zustand
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// ==================== Global UI Store ====================
export const useUIStore = create(
  devtools(
    persist(
      (set) => ({
        // Theme
        darkMode: false,
        toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        
        // Sidebar
        sidebarCollapsed: false,
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        
        // Modals
        activeModal: null,
        modalData: null,
        openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
        closeModal: () => set({ activeModal: null, modalData: null }),
        
        // Toasts
        toasts: [],
        addToast: (message, type = 'info') => set((state) => ({
          toasts: [...state.toasts, { id: Date.now(), message, type }]
        })),
        removeToast: (id) => set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        })),
        
        // Loading states
        loadingStates: {},
        setLoading: (key, isLoading) => set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: isLoading }
        })),
      }),
      { name: 'ui-store' }
    ),
    { name: 'UIStore' }
  )
);

// ==================== Projects Store ====================
export const useProjectsStore = create(
  devtools(
    (set, get) => ({
      projects: [],
      activeProject: null,
      loading: false,
      error: null,
      
      // Actions
      setProjects: (projects) => set({ projects }),
      
      setActiveProject: (projectId) => {
        const project = get().projects.find(p => p.id === projectId);
        set({ activeProject: project });
      },
      
      addProject: (project) => set((state) => ({
        projects: [...state.projects, { ...project, id: `p-${Date.now()}` }]
      })),
      
      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === projectId ? { ...p, ...updates } : p
        )
      })),
      
      deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        activeProject: state.activeProject?.id === projectId ? null : state.activeProject
      })),
      
      // Fetch from API
      fetchProjects: async (apiCall) => {
        set({ loading: true, error: null });
        try {
          const projects = await apiCall();
          set({ projects, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
    }),
    { name: 'ProjectsStore' }
  )
);

// ==================== Finance Store ====================
export const useFinanceStore = create(
  devtools(
    (set, get) => ({
      transactions: [],
      accounts: [],
      loans: [],
      loading: false,
      
      // Computed values
      get totalBalance() {
        return get().accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      },
      
      get monthlyIncome() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return get().transactions
          .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear &&
                   t.type === 'income';
          })
          .reduce((sum, t) => sum + (t.amount || 0), 0);
      },
      
      // Actions
      setTransactions: (transactions) => set({ transactions }),
      setAccounts: (accounts) => set({ accounts }),
      setLoans: (loans) => set({ loans }),
      
      addTransaction: (tx) => set((state) => ({
        transactions: [{ ...tx, id: `t-${Date.now()}` }, ...state.transactions]
      })),
      
      updateAccount: (accountId, updates) => set((state) => ({
        accounts: state.accounts.map(a => 
          a.id === accountId ? { ...a, ...updates } : a
        )
      })),
    }),
    { name: 'FinanceStore' }
  )
);

// ==================== User/Auth Store ====================
export const useAuthStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        role: null,
        permissions: [],
        
        // Actions
        login: (userData) => set({
          user: userData,
          isAuthenticated: true,
          role: userData.role,
          permissions: userData.permissions || []
        }),
        
        logout: () => set({
          user: null,
          isAuthenticated: false,
          role: null,
          permissions: []
        }),
        
        updateUser: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
        
        // Permission check
        canAccess: (permission) => {
          const state = useAuthStore.getState();
          if (state.role === 'super_admin') return true;
          return state.permissions.includes(permission);
        },
      }),
      { name: 'auth-store' }
    ),
    { name: 'AuthStore' }
  )
);

// ==================== Calculator Store (for persisting inputs) ====================
export const useCalculatorStore = create(
  devtools(
    persist(
      (set) => ({
        // BTU Calculator
        btuInputs: { area: '', height: '2.8', exposure: 'normal', occupants: '2' },
        setBtuInputs: (inputs) => set((state) => ({
          btuInputs: { ...state.btuInputs, ...inputs }
        })),
        
        // Circuit Calculator
        circuitInputs: { power: '', voltage: '220', powerFactor: '0.85', length: '20' },
        setCircuitInputs: (inputs) => set((state) => ({
          circuitInputs: { ...state.circuitInputs, ...inputs }
        })),
        
        // Pipe Flow Calculator
        pipeInputs: { flowRate: '', velocity: '1.5', pipeType: 'pvc' },
        setPipeInputs: (inputs) => set((state) => ({
          pipeInputs: { ...state.pipeInputs, ...inputs }
        })),
        
        // Reset all
        resetAll: () => set({
          btuInputs: { area: '', height: '2.8', exposure: 'normal', occupants: '2' },
          circuitInputs: { power: '', voltage: '220', powerFactor: '0.85', length: '20' },
          pipeInputs: { flowRate: '', velocity: '1.5', pipeType: 'pvc' },
        }),
      }),
      { name: 'calculator-store' }
    ),
    { name: 'CalculatorStore' }
  )
);

// ==================== Usage Examples ====================
/*
// In a React component:

import { useUIStore, useProjectsStore } from './stores/zustand';

function MyComponent() {
  // Access state
  const { darkMode, toggleDarkMode, addToast } = useUIStore();
  const { projects, activeProject, setActiveProject } = useProjectsStore();
  
  // Use in component
  return (
    <div className={darkMode ? 'dark' : ''}>
      <button onClick={toggleDarkMode}>Toggle Theme</button>
      <button onClick={() => addToast('Success!', 'success')}>Show Toast</button>
      
      {projects.map(p => (
        <div key={p.id} onClick={() => setActiveProject(p.id)}>
          {p.name}
        </div>
      ))}
    </div>
  );
}

// Outside React (in utility functions):
const state = useUIStore.getState();
state.addToast('Operation complete', 'success');

// Subscribe to changes:
const unsubscribe = useProjectsStore.subscribe(
  (state) => state.activeProject,
  (activeProject) => console.warn('Active project changed:', activeProject)
);
*/

export default {
  useUIStore,
  useProjectsStore,
  useFinanceStore,
  useAuthStore,
  useCalculatorStore,
};
