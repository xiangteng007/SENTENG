
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MainLayoutV2 as MainLayout } from './layout/MainLayoutV2';
import { GoogleService } from './services/GoogleService';
import { ToastContainer } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useApiData } from './services/useApiData';
import { OfflineIndicator } from './components/OfflineIndicator';
import CommandPalette from './components/common/CommandPalette';
import { initPerformanceMonitoring } from './utils/performanceMonitor';
import LoginPage from './pages/LoginPage';
import { renderRoutes } from './routes';

// Initialize performance monitoring in production
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <div className="absolute -inset-2 border-4 border-gray-300 border-t-gray-600 rounded-3xl animate-spin" />
      </div>
      <p className="text-gray-500 text-sm font-medium">載入中...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, pageId }) => {
  const { isAuthenticated, loading, canAccessPage, role } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (pageId === 'user-management' && role !== 'super_admin') return <Navigate to="/" replace />;
  if (pageId !== 'user-management' && !canAccessPage(pageId)) return <Navigate to="/" replace />;

  return children;
};

// Main App Content (wrapped by AuthProvider and Router)
const AppContent = () => {
  const { isAuthenticated, loading: authLoading, role: _role, backendAuthenticated } = useAuth();
  const { data, loading, handleUpdate, handleFinanceUpdate } = useApiData(backendAuthenticated);
  const [toasts, setToasts] = useState([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Global Cmd+K shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Specific Page State used across components (lifted up for persistence)
  const [activeProject, setActiveProject] = useState(null);

  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, action: options.action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleAddGlobalTx = async (newTx) => {
    const tx = { ...newTx, id: `t-${Date.now()}` };
    const updatedTx = [tx, ...data.finance.transactions];
    handleFinanceUpdate('transactions', updatedTx);

    // 同步交易記錄到 Google Sheets
    const syncResult = await GoogleService.syncToSheet('transactions', updatedTx);
    if (!syncResult.success) {
      console.error('交易同步失敗:', syncResult.error);
    }

    addToast("記帳成功！(已同步至財務中心)", 'success');
  };

  // Get active tab from current path
  const getActiveTab = () => {
    const path = location.pathname.replace('/', '') || 'dashboard';
    return path;
  };

  // Handle navigation
  const handleNavigation = (tab) => {
    navigate(`/${tab === 'dashboard' ? '' : tab}`);
  };

  // Show loading screen while checking auth
  if (authLoading) return <LoadingScreen />;

  // Show login page if not authenticated
  if (!isAuthenticated) return <LoginPage />;

  return (
    <MainLayout activeTab={getActiveTab()} setActiveTab={handleNavigation} addToast={addToast}>
      <Routes>
        {renderRoutes({
          ProtectedRoute,
          data,
          loading,
          addToast,
          handleUpdate,
          handleAddGlobalTx,
          activeProject,
          setActiveProject,
        })}
      </Routes>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <OfflineIndicator />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </MainLayout>
  );
};

// Root App Component with AuthProvider and Router
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
