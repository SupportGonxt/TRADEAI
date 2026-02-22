import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Import components
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/ToastNotification';
import analytics from './utils/analytics';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import {BudgetPage} from './components/budgets';
import { PromotionList } from './components/promotions';
import {CustomerList} from './components/customers';
import {ProductList} from './components/products';
import { AnalyticsDashboard } from './components/analytics';
import { SettingsPage } from './components/settings';
import { UserList, UserDetail, UserForm } from './components/users';
import { ReportList, ReportBuilder, BudgetReports, TradingTermsReports, CustomerReports, ProductReports, PromotionReports, TradeSpendReports } from './components/reports';
import { CompanyList, CompanyDetail, CompanyForm } from './components/companies';
import {TradingTermDetail, TradingTermForm} from './components/tradingTerms';
import SimulationStudio from './components/enterprise/simulations/SimulationStudio';
import ExecutiveDashboardEnhanced from './components/enterprise/dashboards/ExecutiveDashboardEnhanced';
import TransactionManagement from './components/enterprise/transactions/TransactionManagement';
import ForecastingDashboard from './components/forecasting/ForecastingDashboard';

// New World-Class UI Components
import RealTimeDashboard from './pages/RealTimeDashboard';
import PromotionFlow from './pages/flows/PromotionFlow';

// AI-Powered Flow Components (Refactored UX)
import CustomerEntryFlow from './pages/flows/CustomerEntryFlow';
import ProductEntryFlow from './pages/flows/ProductEntryFlow';
import TradeSpendEntryFlow from './pages/flows/TradeSpendEntryFlow';

// Transaction Components (Feature 2)
import TransactionEntryFlow from './pages/transactions/TransactionEntryFlow';
import BulkUploadTransactions from './pages/transactions/BulkUploadTransactions';

// AI Dashboard (Feature 7.2)
import AIDashboard from './pages/ai/AIDashboard';

import JAMDashboard from './pages/dashboards/JAMDashboard';
import HierarchyManager from './pages/hierarchy/HierarchyManager';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';

// World-Class Redesign Components
import CommandBar from './components/command/CommandBar';
import CopilotPanel from './components/copilot/CopilotPanel';

// AI Assistant Component

// Command Center (New Home Dashboard)
import CommandCenter from './components/CommandCenter/CommandCenter';
import BudgetPlanningWizard from './components/Wizards/BudgetPlanningWizard';
import PromotionWizard from './components/Wizards/PromotionWizard';

// Edit Components for CRUD operations
import BudgetEdit from './components/budgets/BudgetEdit';
import PromotionEdit from './components/promotions/PromotionEdit';
import TradeSpendEdit from './components/tradeSpends/TradeSpendEdit';
import CustomerEdit from './components/customers/CustomerEdit';
import ProductEdit from './components/products/ProductEdit';

import TradeSpendListNew from './pages/tradespend/TradeSpendList';
import TradingTermsListNew from './pages/tradingterms/TradingTermsList';
import ActivityGridCalendar from './pages/activitygrid/ActivityGridCalendar';
import SimulationStudioNew from './pages/simulation/SimulationStudio';
import PromotionsTimelineNew from './pages/timeline/PromotionsTimeline';
import Customer360New from './pages/customer360/Customer360';
import AdvancedReportingManagement from './pages/advanced-reporting/AdvancedReportingManagement';
import RevenueGrowthManagement from './pages/revenue-growth/RevenueGrowthManagement';
import SupplyChainManagement from './pages/supply-chain/SupplyChainManagement';
import BudgetConsoleNew from './pages/budgetconsole/BudgetConsole';
import PromotionPlannerNew from './pages/promotions/PromotionPlanner';

// Approvals, Claims, and Deductions Components
import ApprovalsList from './pages/approvals/ApprovalsList';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import ClaimsList from './pages/claims/ClaimsList';
import ClaimDetail from './pages/claims/ClaimDetail';
import CreateClaim from './pages/claims/CreateClaim';
import DeductionsList from './pages/deductions/DeductionsList';
import DeductionDetail from './pages/deductions/DeductionDetail';
import CreateDeduction from './pages/deductions/CreateDeduction';
import ReconciliationDashboard from './pages/deductions/ReconciliationDashboard';

// Campaign Components
import CampaignList from './pages/campaigns/CampaignList';
import CampaignForm from './pages/campaigns/CampaignForm';

// Level 3 Tabbed Detail Components
import PromotionDetailWithTabs from './pages/promotions/PromotionDetailWithTabs';
import BudgetDetailWithTabs from './pages/budgets/BudgetDetailWithTabs';
import TradeSpendDetailWithTabs from './pages/trade-spends/TradeSpendDetailWithTabs';
import CustomerDetailWithTabs from './pages/customers/CustomerDetailWithTabs';
import ProductDetailWithTabs from './pages/products/ProductDetailWithTabs';
import CampaignDetailWithTabs from './pages/campaigns/CampaignDetailWithTabs';

// Activities Components
import ActivityList from './pages/activities/ActivityList';

// Rebates Components
import RebatesList from './pages/rebates/RebatesList';
import RebateDetail from './pages/rebates/RebateDetail';
import RebateForm from './pages/rebates/RebateForm';

// Vendors Components
import VendorList from './pages/vendors/VendorList';
import VendorDetail from './pages/vendors/VendorDetail';
import VendorForm from './pages/vendors/VendorForm';

// Admin Users Components
import AdminUserList from './pages/admin/users/UserList';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import TenantManagement from './pages/admin/tenants/TenantManagement';

// Data Import/Export
import DataImportExport from './pages/data/DataImportExport';

// Company Admin Pages
import AzureADPage from './pages/company-admin/AzureADPage';
import ERPSettingsPage from './pages/company-admin/ERPSettingsPage';
import CompanyAdminUsersPage from './pages/company-admin/UsersPage';

// Activity Page Wrappers
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import ActivityFormPage from './pages/activities/ActivityFormPage';

// Auth Components
import Register from './pages/auth/Register';

// KAM Wallet Components
import KAMWalletManagement from './pages/kamwallet/KAMWalletManagement';
import KAMWalletAllocate from './pages/kamwallet/KAMWalletAllocate';

// Hierarchy Components
import CustomerHierarchy from './pages/hierarchy/CustomerHierarchy';
import ProductHierarchy from './pages/hierarchy/ProductHierarchy';

// Import Center
import ImportCenter from './pages/import/ImportCenter';

import FundingOverview from './pages/funding/FundingOverview';

import VendorManagement from './pages/vendors/VendorManagement';

import { CompanyTypeProvider } from './contexts/CompanyTypeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { UserSkillProvider } from './hooks/useUserSkillContext';

// Enterprise Components
import EnterpriseDashboard from './components/enterprise/EnterpriseDashboard';

// Admin Pages - Customer Assignment & Alerts
import CustomerAssignment from './pages/admin/customer-assignment/CustomerAssignment';
import Alerts from './pages/admin/alerts/Alerts';

// Approval History
import ApprovalHistory from './pages/approvals/ApprovalHistory';

// Performance Analytics Pages
import PromotionEffectiveness from './pages/performance-analytics/PromotionEffectiveness';
import BudgetVariance from './pages/performance-analytics/BudgetVariance';
import CustomerSegmentation from './pages/performance-analytics/CustomerSegmentation';

// Predictive Analytics
import PredictiveAnalytics from './pages/planning/PredictiveAnalytics';

// Baseline Management
import BaselineManagement from './pages/baselines/BaselineManagement';

// Accrual Management
import AccrualManagement from './pages/accruals/AccrualManagement';

// Settlement Management
import SettlementManagement from './pages/settlements/SettlementManagement';

// P&L Management
import PnLManagement from './pages/pnl/PnLManagement';

// Budget Allocation Engine
import BudgetAllocationManagement from './pages/budget-allocations/BudgetAllocationManagement';

// Trade Calendar & Constraint Planning
import TradeCalendarManagement from './pages/trade-calendar/TradeCalendarManagement';

// Demand Signal Repository
import DemandSignalManagement from './pages/demand-signals/DemandSignalManagement';

// Scenario Planning / What-If Simulator
import ScenarioPlanningManagement from './pages/scenarios/ScenarioPlanningManagement';

// Promotion Optimization Engine
import PromotionOptimizerManagement from './pages/promotion-optimizer/PromotionOptimizerManagement';

// Help & Training Pages
import {
  HelpCenter,
  PromotionsHelp,
  BudgetsHelp,
  TradeSpendsHelp,
  CustomersHelp,
  ProductsHelp,
  AnalyticsHelp,
  SimulationsHelp,
  ApprovalsHelp,
  RebatesHelp,
  ClaimsHelp,
  DeductionsHelp,
  ForecastingHelp,
  BusinessProcessGuide,
} from './pages/help';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotContext, setCopilotContext] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Effect to check for authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userDataString = localStorage.getItem('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      console.log('App.js useEffect - checking auth:', { authStatus, userData });
      setIsAuthenticated(authStatus);
      setUser(userData);
      
      if (userData && (userData.id || userData._id) && userData.tenantId) {
        analytics.setUser(userData.id || userData._id, userData.tenantId);
        
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (!onboardingCompleted && authStatus) {
          setShowOnboarding(true);
        }
      }
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandExecute = (result) => {
    if (result.type === 'navigate') {
      window.location.href = result.path;
    } else if (result.type === 'api') {
      setCopilotContext({
        explanation: `Command "${result.command}" executed successfully`,
        data: result.data
      });
      setIsCopilotOpen(true);
    } else if (result.type === 'error') {
      setCopilotContext({
        explanation: `Error: ${result.error}`,
        risks: [{ level: 'high', message: result.error }]
      });
      setIsCopilotOpen(true);
    }
  };

  const handleLogin = (userData) => {
    console.log('handleLogin called with userData:', userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    console.log('handleLogin completed, isAuthenticated should now be true');
    // Force a re-render by updating state after a brief delay
    setTimeout(() => {
      setIsAuthenticated(true);
      setUser(userData);
      console.log('handleLogin - forced state update completed');
    }, 100);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CompanyTypeProvider user={user}>
              <Router>
                <UserSkillProvider>
          {/* Global Command Bar */}
          {isAuthenticated && (
            <>
              <CommandBar
                isOpen={isCommandBarOpen}
                onClose={() => setIsCommandBarOpen(false)}
                onExecute={handleCommandExecute}
              />
              <CopilotPanel
                isOpen={isCopilotOpen}
                onClose={() => setIsCopilotOpen(false)}
                context={copilotContext}
                recommendations={copilotContext?.recommendations}
              />
              <OnboardingWizard
                open={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                userRole={user?.role}
              />
            </>
          )}
          <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                {user?.role === 'jam' || user?.role === 'key_account_manager' ? (
                  <JAMDashboard />
                ) : user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin' ? (
                  <ManagerDashboard />
                ) : (
                  <CommandCenter user={user} />
                )}
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/dashboard/jam" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <JAMDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/dashboard/manager" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ManagerDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/dashboard/classic" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <Dashboard user={user} />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budgets" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetPage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="/budgets/new-flow" element={<Navigate to="/budgets/new" replace />} />
        <Route 
          path="/budgets/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetPlanningWizard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budgets/:id/edit"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetEdit />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budgets/:id/:tab" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budgets/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-spends" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendListNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-spends/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendEntryFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="/trade-spends/new-flow" element={<Navigate to="/trade-spends/new" replace />} />
        <Route 
          path="/trade-spends/:id/edit"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendEdit />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-spends/:id/:tab" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-spends/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionWizard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="/promotions/new-flow" element={<Navigate to="/promotions/new" replace />} />
        <Route 
          path="/promotions/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionEdit />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions/:id/:tab" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customers" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="/customers/new-flow" element={<Navigate to="/customers/new" replace />} />
        <Route 
          path="/customers/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerEntryFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customers/:id/edit"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerEdit />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customers/:id/:tab" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customers/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/products" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="/products/new-flow" element={<Navigate to="/products/new" replace />} />
        <Route 
          path="/products/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductEntryFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/products/:id/edit"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductEdit />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/products/:id/:tab" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/products/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/analytics" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <AnalyticsDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/ai-dashboard" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <AIDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/settings" 
          element={
            isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin') ? (
              <Layout user={user} onLogout={handleLogout}>
                <SettingsPage />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/users" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/users/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/users/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/users/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ReportList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ReportBuilder />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/budget" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/tradingterms" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermsReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/customers" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/products" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/promotions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/tradespend" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeSpendReports />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/companies" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyList />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/companies/:id" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyDetail />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/companies/:id/edit" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyForm />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/companies/new" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <Layout user={user} onLogout={handleLogout}>
                <CompanyForm />
              </Layout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/campaigns" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/campaigns/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/campaigns/:id/:tab" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/campaigns/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignDetailWithTabs />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/campaigns/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CampaignForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route
          path="/activity-grid"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ActivityGridCalendar />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route 
          path="/trading-terms" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermsListNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trading-terms/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trading-terms/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trading-terms/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradingTermForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/simulations" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SimulationStudio />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/simulation-studio" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SimulationStudioNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotions-timeline" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionsTimelineNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotion-planner" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionPlannerNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budget-console" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetConsoleNew />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/baselines" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BaselineManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/accruals" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <AccrualManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/settlements" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SettlementManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/pnl" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PnLManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/budget-allocations" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BudgetAllocationManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/trade-calendar" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TradeCalendarManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/demand-signals" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <DemandSignalManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/scenarios" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ScenarioPlanningManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/promotion-optimizer" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionOptimizerManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customer-360"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <Customer360New />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/customer-360/:id"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <Customer360New />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/advanced-reporting"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <AdvancedReportingManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/advanced-reporting/:id"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <AdvancedReportingManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/revenue-growth"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RevenueGrowthManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/revenue-growth/:id"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RevenueGrowthManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/supply-chain"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SupplyChainManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/supply-chain/:id"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <SupplyChainManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/forecasting"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ForecastingDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/transactions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TransactionManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/transactions/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <TransactionEntryFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/transactions/bulk-upload" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <BulkUploadTransactions />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/executive-dashboard" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ExecutiveDashboardEnhanced />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        {/* New World-Class UI Routes */}
        <Route 
          path="/realtime-dashboard" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RealTimeDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/flows/promotion" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <PromotionFlow />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/approvals" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ApprovalsList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
                <Route 
                  path="/approvals/:id" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <ApprovalDetail />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/approvals/history" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <ApprovalHistory />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/customer-assignment" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <CustomerAssignment />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/alerts" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <Alerts />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/performance-analytics/promotion-effectiveness" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <PromotionEffectiveness />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/performance-analytics/budget-variance" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <BudgetVariance />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/performance-analytics/customer-segmentation" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <CustomerSegmentation />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/predictive-analytics" 
                  element={
                    isAuthenticated ? (
                      <Layout user={user} onLogout={handleLogout}>
                        <PredictiveAnalytics />
                      </Layout>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route 
                  path="/claims"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ClaimsList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/claims/create" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CreateClaim />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/claims/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ClaimDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <DeductionsList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions/create" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CreateDeduction />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <DeductionDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/deductions/reconciliation"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ReconciliationDashboard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/activities" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ActivityList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/activities/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ActivityFormPage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/activities/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ActivityDetailPage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/activities/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ActivityFormPage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/rebates"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RebatesList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/rebates/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RebateForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/rebates/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RebateDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/rebates/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <RebateForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/vendors" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <VendorList />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/vendors/new" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <VendorForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/vendors/:id" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <VendorDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/vendors/:id/edit" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <VendorForm />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/register" 
          element={<Register />} 
        />
        <Route 
          path="/profile" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <UserDetail />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/enterprise/budget" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <EnterpriseDashboard view="budget" />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/enterprise/promotions" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <EnterpriseDashboard view="promotions" />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/enterprise/trade-spend" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <EnterpriseDashboard view="trade-spend" />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/reports/schedule" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ReportBuilder />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/kamwallet" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <KAMWalletManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/kamwallet/:id/allocate" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <KAMWalletAllocate />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        {/* Admin Routes with AdminLayout */}
        <Route 
          path="/admin/*"
          element={
            isAuthenticated ? (
              <AdminLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUserList />} />
          <Route path="tenants" element={<TenantManagement />} />
          <Route path="users/new" element={<UserForm />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="users/:id/edit" element={<UserForm />} />
          <Route path="companies" element={<CompanyList />} />
          <Route path="companies/new" element={<CompanyForm />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="companies/:id/edit" element={<CompanyForm />} />
          <Route path="hierarchy" element={<HierarchyManager />} />
          <Route path="security" element={<SettingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Company Admin Routes */}
          <Route path="azure-ad" element={<AzureADPage />} />
          <Route path="erp-settings" element={<ERPSettingsPage />} />
          <Route path="company-users" element={<CompanyAdminUsersPage />} />
        </Route>
        <Route 
          path="/import-center" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ImportCenter />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/data/import-export" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <DataImportExport />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/funding-overview" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <FundingOverview />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/hierarchy/customers" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <CustomerHierarchy />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/hierarchy/products" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <ProductHierarchy />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/vendor-management" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <VendorManagement />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
              {/* Help & Training Routes */}
              <Route 
                path="/help" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <HelpCenter />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/promotions" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <PromotionsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/budgets" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <BudgetsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/trade-spends" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <TradeSpendsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/customers" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <CustomersHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/products" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <ProductsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/analytics" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <AnalyticsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/simulations" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <SimulationsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/approvals" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <ApprovalsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/rebates" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <RebatesHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/claims" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <ClaimsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/deductions" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <DeductionsHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/forecasting" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <ForecastingHelp />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/help/business-process-guide" 
                element={
                  isAuthenticated ? (
                    <Layout user={user} onLogout={handleLogout}>
                      <BusinessProcessGuide />
                    </Layout>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
                </UserSkillProvider>
              </Router>
            </CompanyTypeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
