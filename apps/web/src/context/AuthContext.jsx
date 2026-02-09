/* eslint-disable react-refresh/only-export-components */
// Authentication Context Provider
import { createContext, useContext, useState, useEffect } from 'react';
import {
    subscribeToAuthState,
    signInWithGoogle,
    signOut,
    initializeDefaultRoles,
} from '../services/firebase';
import { api, authApi } from '../services/api';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [backendAuthenticated, setBackendAuthenticated] = useState(false);

    // Exchange Firebase user for backend JWT and fetch permissions
    const exchangeForBackendToken = async (firebaseUser) => {
        if (!firebaseUser) {
            api.clearToken();
            setBackendAuthenticated(false);
            return null;
        }

        try {
            // Call backend auth endpoint with Firebase user data
            const response = await authApi.login({
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email,
                provider: 'google',
                uid: firebaseUser.uid,
                role: firebaseUser.role || 'user',  // Pass Firebase role to backend
            });

            if (response.access_token) {
                // Store JWT token for subsequent API calls
                api.setToken(response.access_token);
                setBackendAuthenticated(true);
                console.warn('✅ Backend JWT obtained successfully');

                // Fetch permissions from backend (this is the authoritative source for RBAC)
                try {
                    const permissionsResponse = await api.get('/auth/permissions');
                    if (permissionsResponse) {
                        console.warn('✅ Permissions fetched:', permissionsResponse);
                        // Merge backend permissions into firebaseUser object
                        firebaseUser.allowedPages = permissionsResponse.pages || [];
                        firebaseUser.actions = permissionsResponse.actions || {};
                        firebaseUser.roleLevel = permissionsResponse.roleLevel || 1;
                        firebaseUser.role = permissionsResponse.role || firebaseUser.role || 'user';
                    }
                } catch (permErr) {
                    // Set comprehensive default permissions to prevent empty sidebar
                    // This allows users to access all basic features when permission API fails
                    firebaseUser.allowedPages = [
                        // 總覽
                        'dashboard', 'schedule', 'events',
                        // 專案管理
                        'projects', 'contracts', 'change-orders',
                        // 財務中心
                        'finance', 'quotations', 'payments', 'invoice',
                        // 關係人
                        'clients', 'vendors', 'contacts',
                        // 供應鏈
                        'procurements', 'inventory',
                        // 工地管理
                        'site-logs', 'construction', 'schedules',
                        // 分析報表
                        'cost-entries', 'profit', 'reports',
                        // 智慧管理
                        'bim', 'drone', 'smart-home',
                        // 工具箱
                        'materials', 'materials-calc', 'unit', 'cost', 'calc', 'regulations',
                        // 安全環保
                        'insurance', 'waste',
                    ];
                    // Admin pages only for admin roles
                    if (firebaseUser.role === 'admin' || firebaseUser.role === 'super_admin') {
                        firebaseUser.allowedPages.push('user-management', 'integrations', 'notifications');
                    }
                    firebaseUser.actions = {};
                }

                return response;
            }
        } catch (err) {
            console.error('❌ Failed to get backend JWT:', err);
            // Don't block the user if backend auth fails - they can still use Firebase features
            setBackendAuthenticated(false);
        }
        return null;
    };

    useEffect(() => {
        // Initialize default roles on first load
        initializeDefaultRoles().catch(console.error);

        // Token is now in-memory only — Firebase auth subscription
        // handles re-authentication on page refresh via exchangeForBackendToken

        // Subscribe to auth state changes
        const unsubscribe = subscribeToAuthState(async (userData) => {
            if (userData) {
                // Exchange Firebase token for backend JWT
                await exchangeForBackendToken(userData);
            } else {
                api.clearToken();
                setBackendAuthenticated(false);
            }
            setUser(userData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Handle Google sign in
    const handleSignInWithGoogle = async () => {
        try {
            setError(null);
            setLoading(true);
            const userData = await signInWithGoogle();

            // Exchange for backend JWT
            await exchangeForBackendToken(userData);

            setUser(userData);
        } catch (err) {
            console.error('Sign in error:', err);
            setError(err.message || '登入失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    // Handle sign out
    const handleSignOut = async () => {
        try {
            setLoading(true);
            await signOut();
            api.clearToken();
            setBackendAuthenticated(false);
            setUser(null);
        } catch (err) {
            console.error('Sign out error:', err);
            setError(err.message || '登出失敗');
        } finally {
            setLoading(false);
        }
    };

    // Check if user can access a page
    const canAccessPage = (pageId) => {
        if (!user) return false;
        return user.allowedPages?.includes(pageId) || false;
    };

    // Check if user has action permission (RBAC)
    const hasAction = (domainKey, action) => {
        if (!user || !user.actions) return false;
        const domainActions = user.actions[domainKey];
        if (!domainActions || !Array.isArray(domainActions)) return false;
        return domainActions.includes(action);
    };

    // Context value
    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        backendAuthenticated,
        role: user?.role || null,
        allowedPages: user?.allowedPages || [],
        actions: user?.actions || {},
        roleLevel: user?.roleLevel || 0,
        permissions: { pages: user?.allowedPages || [], actions: user?.actions || {} },
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        canAccessPage,
        hasAction,
        clearError: () => setError(null),
        // Expose method to manually refresh backend token if needed
        refreshBackendToken: () => user ? exchangeForBackendToken(user) : null,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;

