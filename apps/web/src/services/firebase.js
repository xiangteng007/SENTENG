// Firebase Configuration and Authentication Service
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    serverTimestamp,
    query,
    orderBy,
} from 'firebase/firestore';

// Firebase configuration - use environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();

// Default role configuration - MUST match backend ROLE_PAGES in permissions.dto.ts
const DEFAULT_ROLES = {
    super_admin: {
        name: 'super_admin',
        level: 6,
        allowedPages: [
            // 總覽
            'dashboard', 'schedule', 'events',
            // 專案管理
            'projects', 'contracts', 'change-orders',
            // 財務中心
            'finance', 'quotations', 'payments', 'invoice', 'invoices',
            // 關係人
            'clients', 'customers', 'vendors', 'contacts',
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
            // 系統設定
            'user-management', 'integrations', 'notifications', 'settings',
        ],
    },
    admin: {
        name: 'admin',
        level: 5,
        allowedPages: [
            'dashboard', 'schedule', 'events',
            'projects', 'contracts', 'change-orders',
            'finance', 'quotations', 'payments', 'invoice', 'invoices',
            'clients', 'customers', 'vendors', 'contacts',
            'procurements', 'inventory',
            'site-logs', 'construction', 'schedules',
            'cost-entries', 'profit', 'reports',
            'bim', 'drone', 'smart-home',
            'materials', 'materials-calc', 'unit', 'cost', 'calc', 'regulations',
            'insurance', 'waste',
            'user-management', 'integrations', 'notifications', 'settings',
        ],
    },
    user: {
        name: 'user',
        level: 1,
        allowedPages: ['dashboard'],
    },
};

// ==================== Auth Functions ====================

/**
 * Sign in with Google
 * @returns {Promise<Object>} User object with role info
 */
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user exists in Firestore, if not create new user
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // First user becomes super_admin, others are users
            const usersCollection = await getDocs(collection(db, 'users'));
            const isFirstUser = usersCollection.empty;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: isFirstUser ? 'super_admin' : 'user',
                googleId: user.uid,
                lineUserId: null,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
            });
        } else {
            // Update last login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp(),
            });
        }

        return await getUserWithRole(user.uid);
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

/**
 * Sign out
 */
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * Get current auth state
 * @param {Function} callback - Callback function receiving user object
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAuthState = (callback) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userWithRole = await getUserWithRole(firebaseUser.uid);
            callback(userWithRole);
        } else {
            callback(null);
        }
    });
};

/**
 * Get user data with role information
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User object with role and allowed pages
 */
export const getUserWithRole = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));

        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data();
        const roleConfig = await getRoleConfig(userData.role);

        return {
            uid,
            ...userData,
            allowedPages: roleConfig?.allowedPages || DEFAULT_ROLES.user.allowedPages,
            roleLevel: roleConfig?.level || 1,
        };
    } catch (error) {
        console.error('Error getting user with role:', error);
        throw error;
    }
};

// ==================== Role Functions ====================

/**
 * Get role configuration
 * @param {string} roleName - Role name
 * @returns {Promise<Object>} Role configuration
 */
export const getRoleConfig = async (roleName) => {
    try {
        const roleDoc = await getDoc(doc(db, 'roles', roleName));

        if (roleDoc.exists()) {
            return roleDoc.data();
        }

        // Return default role config if not found in Firestore
        return DEFAULT_ROLES[roleName] || DEFAULT_ROLES.user;
    } catch (error) {
        console.error('Error getting role config:', error);
        return DEFAULT_ROLES[roleName] || DEFAULT_ROLES.user;
    }
};

/**
 * Get all roles
 * @returns {Promise<Array>} Array of role configurations
 */
export const getAllRoles = async () => {
    try {
        const rolesCollection = await getDocs(collection(db, 'roles'));

        if (rolesCollection.empty) {
            // Return default roles if no roles in Firestore
            return Object.values(DEFAULT_ROLES);
        }

        return rolesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting all roles:', error);
        return Object.values(DEFAULT_ROLES);
    }
};

/**
 * Update role configuration (super_admin only)
 * @param {string} roleName - Role name
 * @param {Object} roleData - Role configuration data
 */
export const updateRoleConfig = async (roleName, roleData) => {
    try {
        await setDoc(doc(db, 'roles', roleName), roleData, { merge: true });
    } catch (error) {
        console.error('Error updating role config:', error);
        throw error;
    }
};

// ==================== User Management Functions ====================

/**
 * Get all users (for super_admin)
 * @returns {Promise<Array>} Array of users
 */
export const getAllUsers = async () => {
    try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const usersCollection = await getDocs(usersQuery);

        return usersCollection.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
};

/**
 * Update user role (super_admin only)
 * @param {string} uid - User ID
 * @param {string} newRole - New role name
 */
export const updateUserRole = async (uid, newRole) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            role: newRole,
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

/**
 * Delete user (super_admin only)
 * Note: This only removes user from Firestore, not from Firebase Auth
 * @param {string} uid - User ID
 */
export const deleteUser = async (uid) => {
    try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

/**
 * Initialize default roles in Firestore (run once on setup)
 * Also merges any new permissions from DEFAULT_ROLES into existing roles
 * Note: This requires super_admin privileges. Non-admin users will silently skip.
 */
export const initializeDefaultRoles = async () => {
    try {
        // First check if roles collection is accessible
        const _testDoc = await getDoc(doc(db, 'roles', 'user'));

        for (const [roleName, roleConfig] of Object.entries(DEFAULT_ROLES)) {
            const roleDoc = await getDoc(doc(db, 'roles', roleName));
            if (!roleDoc.exists()) {
                // Create new role
                await setDoc(doc(db, 'roles', roleName), roleConfig);
            } else {
                // Merge any new permissions from DEFAULT_ROLES
                const existingData = roleDoc.data();
                const existingPages = existingData.allowedPages || [];
                const defaultPages = roleConfig.allowedPages || [];

                // Find new pages that don't exist in Firestore yet
                const newPages = defaultPages.filter(p => !existingPages.includes(p));

                if (newPages.length > 0) {
                    const mergedPages = [...existingPages, ...newPages];
                    await updateDoc(doc(db, 'roles', roleName), {
                        allowedPages: mergedPages,
                    });
                    console.warn(`Updated ${roleName} with new pages:`, newPages);
                }
            }
        }
        console.warn('Default roles initialized/updated');
    } catch (error) {
        // Permission errors are expected for non-admin users
        // Fall back to local DEFAULT_ROLES (already available in code)
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
            console.error('[Roles] Using local default roles (Firestore not writable)');
        } else {
            console.error('Error initializing default roles:', error);
        }
    }
};

// ==================== User Preferences Functions ====================

/**
 * Save user menu order to Firestore
 * @param {string} uid - User ID
 * @param {Array<string>} menuOrder - Array of menu item IDs
 */
export const saveUserMenuOrder = async (uid, menuOrder) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            menuOrder: menuOrder,
            menuOrderUpdatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving menu order:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get user menu order from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Array<string>|null>} Menu order or null
 */
export const getUserMenuOrder = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data().menuOrder || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting menu order:', error);
        return null;
    }
};

// Export constants
export { auth, db, DEFAULT_ROLES };
