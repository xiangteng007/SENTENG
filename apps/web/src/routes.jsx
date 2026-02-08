/**
 * routes.jsx — Central Route Configuration
 *
 * Extracted from App.jsx to improve maintainability.
 * All route definitions and their lazy-loaded components live here.
 */
import React, { Suspense, lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { PageLoadingSkeleton } from './components/common/PageLoadingSkeleton';

// ===== Eagerly Loaded Pages (Critical Path) =====
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Projects from './pages/Projects';
import Finance from './pages/Finance';
import Notifications from './pages/Notifications';
import Events from './pages/Events';
import Reports from './pages/Reports';
import SiteLogs from './pages/SiteLogs';
import Construction from './pages/Construction';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';

// ===== Lazy Loaded Pages (Code Splitting) =====
const MaterialCalculator = lazy(() => import('./pages/MaterialCalculator').then(m => ({ default: m.MaterialCalculator })));
const CostEstimator = lazy(() => import('./pages/CostEstimator').then(m => ({ default: m.CostEstimator })));
const MaterialGallery = lazy(() => import('./pages/MaterialGallery').then(m => ({ default: m.MaterialGallery })));
const InvoiceHelper = lazy(() => import('./pages/InvoiceHelper').then(m => ({ default: m.InvoiceHelper })));
const Inventory = lazy(() => import('./pages/Inventory'));
const Quotations = lazy(() => import('./pages/Quotations'));
const QuotationEditor = lazy(() => import('./pages/QuotationEditor'));
const Contracts = lazy(() => import('./pages/Contracts'));
const CostEntries = lazy(() => import('./pages/CostEntries'));
const Payments = lazy(() => import('./pages/Payments'));
const Procurements = lazy(() => import('./pages/Procurements'));
const ChangeOrders = lazy(() => import('./pages/ChangeOrders'));
const Insurance = lazy(() => import('./pages/Insurance'));
const Waste = lazy(() => import('./pages/Waste'));
const Bim = lazy(() => import('./pages/Bim'));
const Drone = lazy(() => import('./pages/Drone'));
const SmartHome = lazy(() => import('./pages/SmartHome'));
const Regulations = lazy(() => import('./pages/Regulations'));
const Schedules = lazy(() => import('./pages/Schedules'));
const ProfitAnalysis = lazy(() => import('./pages/ProfitAnalysis'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const Partners = lazy(() => import('./pages/Partners'));

// Expert Panel v4.9 P2 Modules
const GovernmentProjects = lazy(() => import('./pages/GovernmentProjects').then(m => ({ default: m.GovernmentProjects })));
const OccupationalSafety = lazy(() => import('./pages/OccupationalSafety').then(m => ({ default: m.OccupationalSafety })));
const FireSafetyRecords = lazy(() => import('./pages/FireSafetyRecords').then(m => ({ default: m.FireSafetyRecords })));
const ProfessionalCalculators = lazy(() => import('./pages/ProfessionalCalculators').then(m => ({ default: m.ProfessionalCalculators })));
const LaborContracts = lazy(() => import('./pages/LaborContracts').then(m => ({ default: m.LaborContracts })));
const ContractAlerts = lazy(() => import('./pages/ContractAlerts').then(m => ({ default: m.ContractAlerts })));
const VisualEnhancements = lazy(() => import('./pages/VisualEnhancements').then(m => ({ default: m.VisualEnhancements })));
const MilestoneTracker = lazy(() => import('./pages/MilestoneTracker').then(m => ({ default: m.MilestoneTracker })));
const LaborDisputes = lazy(() => import('./pages/LaborDisputes').then(m => ({ default: m.LaborDisputes })));

/**
 * Generates all application <Route> elements.
 * @param {object} props - Shared props from AppContent
 * @param {Function} props.ProtectedRoute - Permission-checking route wrapper
 * @param {object} props.data - Global application data
 * @param {boolean} props.loading - Data loading state
 * @param {Function} props.addToast - Toast notification helper
 * @param {Function} props.handleUpdate - Data update handler
 * @param {Function} props.handleAddGlobalTx - Finance transaction handler
 * @param {Function} props.handleFinanceUpdate - Finance-specific update
 * @param {object} props.activeProject - Currently selected project
 * @param {Function} props.setActiveProject - Set active project
 */
export function renderRoutes({
  ProtectedRoute,
  data,
  loading,
  addToast,
  handleUpdate,
  handleAddGlobalTx,
  activeProject,
  setActiveProject,
}) {
  return (
    <>
      {/* ===== Core Pages ===== */}
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

      {/* ===== Financial Pages ===== */}
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
      <Route path="/quotations" element={
        <ProtectedRoute pageId="quotations">
          <Quotations addToast={addToast} projects={data.projects} clients={data.clients} />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={<ProtectedRoute pageId="payments"><Payments addToast={addToast} /></ProtectedRoute>} />
      <Route path="/contracts" element={<ProtectedRoute pageId="contracts"><Contracts addToast={addToast} /></ProtectedRoute>} />
      <Route path="/profit" element={<ProtectedRoute pageId="profit"><ProfitAnalysis addToast={addToast} /></ProtectedRoute>} />
      <Route path="/cost-entries" element={<ProtectedRoute pageId="cost-entries"><CostEntries addToast={addToast} /></ProtectedRoute>} />
      <Route path="/change-orders" element={<ProtectedRoute pageId="change-orders"><ChangeOrders addToast={addToast} /></ProtectedRoute>} />
      <Route path="/invoice" element={<ProtectedRoute pageId="invoice"><InvoiceHelper addToast={addToast} /></ProtectedRoute>} />
      <Route path="/insurance" element={<ProtectedRoute pageId="insurance"><Insurance addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Inventory & Procurement ===== */}
      <Route path="/inventory" element={
        <ProtectedRoute pageId="inventory">
          <Inventory data={data.inventory} loading={loading} addToast={addToast} onUpdateInventory={(d) => handleUpdate('inventory', d)} />
        </ProtectedRoute>
      } />
      <Route path="/procurements" element={<ProtectedRoute pageId="procurements"><Procurements addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Materials & Calculators ===== */}
      <Route path="/materials-calc" element={<ProtectedRoute pageId="materials-calc"><MaterialCalculator addToast={addToast} vendors={data.vendors} /></ProtectedRoute>} />
      <Route path="/materials" element={<ProtectedRoute pageId="materials"><MaterialGallery addToast={addToast} /></ProtectedRoute>} />
      <Route path="/unit" element={<ProtectedRoute pageId="unit"><MaterialCalculator addToast={addToast} vendors={data.vendors} /></ProtectedRoute>} />
      <Route path="/cost" element={<ProtectedRoute pageId="cost"><CostEstimator addToast={addToast} /></ProtectedRoute>} />
      <Route path="/calc" element={<ProtectedRoute pageId="calc"><MaterialCalculator addToast={addToast} vendors={data.vendors} /></ProtectedRoute>} />
      <Route path="/calculators" element={<ProtectedRoute pageId="calculators"><ProfessionalCalculators addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Construction & Field Ops ===== */}
      <Route path="/site-logs" element={<ProtectedRoute pageId="site-logs"><SiteLogs addToast={addToast} /></ProtectedRoute>} />
      <Route path="/construction" element={<ProtectedRoute pageId="construction"><Construction addToast={addToast} /></ProtectedRoute>} />
      <Route path="/schedules" element={<ProtectedRoute pageId="schedules"><Schedules addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Partners (Unified CRM) ===== */}
      <Route path="/partners" element={<ProtectedRoute pageId="partners"><Partners addToast={addToast} /></ProtectedRoute>} />
      <Route path="/clients" element={<Navigate to="/partners" replace />} />
      <Route path="/vendors" element={<Navigate to="/partners" replace />} />
      <Route path="/contacts" element={<Navigate to="/partners" replace />} />

      {/* ===== Technology & Innovation ===== */}
      <Route path="/bim" element={<ProtectedRoute pageId="bim"><Bim addToast={addToast} /></ProtectedRoute>} />
      <Route path="/drone" element={<ProtectedRoute pageId="drone"><Drone addToast={addToast} /></ProtectedRoute>} />
      <Route path="/smart-home" element={<ProtectedRoute pageId="smart-home"><SmartHome addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Compliance & Regulations ===== */}
      <Route path="/regulations" element={<ProtectedRoute pageId="regulations"><Regulations addToast={addToast} /></ProtectedRoute>} />
      <Route path="/waste" element={<ProtectedRoute pageId="waste"><Waste addToast={addToast} /></ProtectedRoute>} />
      <Route path="/safety" element={<ProtectedRoute pageId="safety"><OccupationalSafety addToast={addToast} /></ProtectedRoute>} />
      <Route path="/fire-safety" element={<ProtectedRoute pageId="fire-safety"><FireSafetyRecords addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Expert Panel P2 ===== */}
      <Route path="/government-projects" element={<ProtectedRoute pageId="government-projects"><GovernmentProjects addToast={addToast} /></ProtectedRoute>} />
      <Route path="/labor-contracts" element={<ProtectedRoute pageId="labor-contracts"><LaborContracts addToast={addToast} /></ProtectedRoute>} />
      <Route path="/contract-alerts" element={<ProtectedRoute pageId="contract-alerts"><ContractAlerts addToast={addToast} /></ProtectedRoute>} />
      <Route path="/visual-tools" element={<ProtectedRoute pageId="visual-tools"><VisualEnhancements addToast={addToast} /></ProtectedRoute>} />
      <Route path="/milestones" element={<ProtectedRoute pageId="milestones"><MilestoneTracker addToast={addToast} /></ProtectedRoute>} />
      <Route path="/labor-disputes" element={<ProtectedRoute pageId="labor-disputes"><LaborDisputes addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Admin & System ===== */}
      <Route path="/user-management" element={<ProtectedRoute pageId="user-management"><UserManagement addToast={addToast} /></ProtectedRoute>} />
      <Route path="/settings/integrations" element={<ProtectedRoute pageId="integrations"><IntegrationsPage addToast={addToast} /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute pageId="events"><Events addToast={addToast} /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute pageId="reports"><Reports addToast={addToast} /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute pageId="notifications"><Notifications addToast={addToast} /></ProtectedRoute>} />

      {/* ===== Auth & Fallback ===== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  );
}
