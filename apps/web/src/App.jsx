
import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { GoogleService } from './services/GoogleService';
import { ToastContainer } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useApiData } from './services/useApiData';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';

// Eagerly loaded pages (critical path)
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Vendors from './pages/Vendors';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import Quotations from './pages/Quotations';
import Payments from './pages/Payments';
import Contracts from './pages/Contracts';
import ProfitAnalysis from './pages/ProfitAnalysis';
import CostEntries from './pages/CostEntries';
import IntegrationsPage from './pages/IntegrationsPage';
import Procurements from './pages/Procurements';
import Events from './pages/Events';
import ChangeOrders from './pages/ChangeOrders';
import Contacts from './pages/Contacts';
import Reports from './pages/Reports';
import SiteLogs from './pages/SiteLogs';
import Construction from './pages/Construction';
import Schedules from './pages/Schedules';
import Bim from './pages/Bim';
import Drone from './pages/Drone';
import SmartHome from './pages/SmartHome';
import Regulations from './pages/Regulations';
import Insurance from './pages/Insurance';
import Waste from './pages/Waste';
import Notifications from './pages/Notifications';

// Lazy loaded pages (PERF-001: Code Splitting for heavy components)
const MaterialCalculator = lazy(() => import('./pages/MaterialCalculator').then(m => ({ default: m.MaterialCalculator })));
const CostEstimator = lazy(() => import('./pages/CostEstimator').then(m => ({ default: m.CostEstimator })));
const MaterialGallery = lazy(() => import('./pages/MaterialGallery').then(m => ({ default: m.MaterialGallery })));
const InvoiceHelper = lazy(() => import('./pages/InvoiceHelper').then(m => ({ default: m.InvoiceHelper })));

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

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Special case for user-management (only super_admin)
  if (pageId === 'user-management' && role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  // Check page permission
  if (pageId !== 'user-management' && !canAccessPage(pageId)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// No Permission Component
const NoPermission = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <p className="text-lg font-medium">您沒有權限訪問此頁面</p>
      <button
        onClick={() => navigate('/')}
        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        返回儀表板
      </button>
    </div>
  );
};

// Main App Content (wrapped by AuthProvider and Router)
const AppContent = () => {
  const { isAuthenticated, loading: authLoading, role } = useAuth();
  const { data, loading, handleUpdate, handleFinanceUpdate } = useApiData(isAuthenticated);
  const [toasts, setToasts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

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
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <MainLayout activeTab={getActiveTab()} setActiveTab={handleNavigation} addToast={addToast}>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute pageId="dashboard">
            <Dashboard events={data.calendar} finance={data.finance} projects={data.projects} clients={data.clients} />
          </ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute pageId="schedule">
            <Schedule data={data.calendar} loans={data.finance.loans || []} addToast={addToast} onUpdateCalendar={(d) => handleUpdate('calendar', d)} />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute pageId="projects">
            <Projects
              data={data.projects}
              loading={loading}
              addToast={addToast}
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              onSelectProject={setActiveProject}
              onUpdateProject={(p) => {
                const exists = data.projects.find(proj => proj.id === p.id);
                if (exists) {
                  handleUpdate('projects', data.projects.map(proj => proj.id === p.id ? p : proj));
                } else {
                  handleUpdate('projects', [...data.projects, p]);
                }
              }}
              onDeleteProject={(projectId) => {
                handleUpdate('projects', data.projects.filter(proj => proj.id !== projectId));
              }}
              allTransactions={data.finance.transactions}
              onAddGlobalTx={handleAddGlobalTx}
              accounts={data.finance.accounts}
              allClients={data.clients}
            />
          </ProtectedRoute>
        } />
        <Route path="/quotations" element={
          <ProtectedRoute pageId="quotations">
            <Quotations addToast={addToast} projects={data.projects} clients={data.clients} />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute pageId="payments">
            <Payments addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/contracts" element={
          <ProtectedRoute pageId="contracts">
            <Contracts addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/profit" element={
          <ProtectedRoute pageId="profit">
            <ProfitAnalysis addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/cost-entries" element={
          <ProtectedRoute pageId="cost-entries">
            <CostEntries addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute pageId="clients">
            <Clients data={data.clients} loading={loading} addToast={addToast} onUpdateClients={(d) => handleUpdate('clients', d)} allProjects={data.projects} />
          </ProtectedRoute>
        } />
        <Route path="/finance" element={
          <ProtectedRoute pageId="finance">
            <Finance
              data={data.finance}
              loading={loading}
              addToast={addToast}
              onAddTx={handleAddGlobalTx}
              onUpdateAccounts={(accs) => handleUpdate('finance', { ...data.finance, accounts: accs })}
              onUpdateLoans={(loans) => handleUpdate('finance', { ...data.finance, loans: loans })}
              allProjects={data.projects}
            />
          </ProtectedRoute>
        } />
        <Route path="/vendors" element={
          <ProtectedRoute pageId="vendors">
            <Vendors data={data.vendors} loading={loading} addToast={addToast} onUpdateVendors={(d) => handleUpdate('vendors', d)} allProjects={data.projects} />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute pageId="inventory">
            <Inventory data={data.inventory} loading={loading} addToast={addToast} onUpdateInventory={(d) => handleUpdate('inventory', d)} />
          </ProtectedRoute>
        } />
        <Route path="/procurements" element={
          <ProtectedRoute pageId="procurements">
            <Procurements addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/materials-calc" element={
          <ProtectedRoute pageId="materials-calc">
            <MaterialCalculator addToast={addToast} vendors={data.vendors} />
          </ProtectedRoute>
        } />
        <Route path="/materials" element={
          <ProtectedRoute pageId="materials">
            <MaterialGallery addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/invoice" element={
          <ProtectedRoute pageId="invoice">
            <InvoiceHelper addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/unit" element={
          <ProtectedRoute pageId="unit">
            <MaterialCalculator addToast={addToast} vendors={data.vendors} />
          </ProtectedRoute>
        } />
        <Route path="/cost" element={
          <ProtectedRoute pageId="cost">
            <CostEstimator addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/calc" element={
          <ProtectedRoute pageId="calc">
            <MaterialCalculator addToast={addToast} vendors={data.vendors} />
          </ProtectedRoute>
        } />
        <Route path="/user-management" element={
          <ProtectedRoute pageId="user-management">
            <UserManagement addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/settings/integrations" element={
          <ProtectedRoute pageId="integrations">
            <IntegrationsPage addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute pageId="events">
            <Events addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/change-orders" element={
          <ProtectedRoute pageId="change-orders">
            <ChangeOrders addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/contacts" element={
          <ProtectedRoute pageId="contacts">
            <Contacts addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute pageId="reports">
            <Reports addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/site-logs" element={
          <ProtectedRoute pageId="site-logs">
            <SiteLogs addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/construction" element={
          <ProtectedRoute pageId="construction">
            <Construction addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/schedules" element={
          <ProtectedRoute pageId="schedules">
            <Schedules addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/bim" element={
          <ProtectedRoute pageId="bim">
            <Bim addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/drone" element={
          <ProtectedRoute pageId="drone">
            <Drone addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/smart-home" element={
          <ProtectedRoute pageId="smart-home">
            <SmartHome addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/regulations" element={
          <ProtectedRoute pageId="regulations">
            <Regulations addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/insurance" element={
          <ProtectedRoute pageId="insurance">
            <Insurance addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/waste" element={
          <ProtectedRoute pageId="waste">
            <Waste addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute pageId="notifications">
            <Notifications addToast={addToast} />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <OfflineIndicator />
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
