import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Import routes
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { customerRoutes } from './routes/customers.js';
import { productRoutes } from './routes/products.js';
import { promotionRoutes } from './routes/promotions.js';
import { budgetRoutes } from './routes/budgets.js';
import { tradeSpendRoutes } from './routes/tradeSpends.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { reportingRoutes } from './routes/reporting.js';
import { analyticsRoutes } from './routes/analytics.js';
import { simulationsRoutes } from './routes/simulations.js';
import { aiOrchestratorRoutes } from './routes/aiOrchestrator.js';
import { optimizerRoutes } from './routes/optimizer.js';
import { recommendationsRoutes } from './routes/recommendations.js';
import { exportRoutes } from './routes/export.js';
// New routes for complete platform functionality
import { approvalsRoutes } from './routes/approvals.js';
import { rebatesRoutes } from './routes/rebates.js';
import { tradingTermsRoutes } from './routes/tradingTerms.js';
import { claimsRoutes } from './routes/claims.js';
import { deductionsRoutes } from './routes/deductions.js';
import { vendorsRoutes } from './routes/vendors.js';
import { campaignsRoutes } from './routes/campaigns.js';
import { activitiesRoutes } from './routes/activities.js';
import { activityGridRoutes } from './routes/activityGrid.js';
import { dataLineageRoutes } from './routes/dataLineage.js';
import { forecastingRoutes } from './routes/forecasting.js';
import { seedRoutes } from './routes/seed.js';
import { businessRulesRoutes } from './routes/businessRules.js';
import { allocationRoutes } from './routes/allocations.js';
import { settingsRoutes } from './routes/settings.js';
import { transactionRoutes } from './routes/transactions.js';
import { kamWalletRoutes } from './routes/kamWallets.js';
import { performanceAnalyticsRoutes } from './routes/performanceAnalytics.js';
import { importExportRoutes } from './routes/importExport.js';
import { hierarchyRoutes } from './routes/hierarchy.js';
import { alertRoutes } from './routes/alerts.js';
import { customerAssignmentRoutes } from './routes/customerAssignment.js';
import { companyAdminRoutes } from './routes/companyAdmin.js';
import { aiCopilotRoutes } from './routes/aiCopilot.js';
import { smartApprovalsRoutes } from './routes/smartApprovals.js';
import { deductionMatchRoutes } from './routes/deductionMatch.js';
import { postEventAnalysisRoutes } from './routes/postEventAnalysis.js';
import { anomalyDetectionRoutes } from './routes/anomalyDetection.js';
import { promotionConflictRoutes } from './routes/promotionConflict.js';
import { baselineRoutes } from './routes/baselines.js';
import { accrualRoutes } from './routes/accruals.js';
import { settlementRoutes } from './routes/settlements.js';
import { pnlRoutes } from './routes/pnl.js';
import { budgetAllocationRoutes } from './routes/budgetAllocations.js';
import { tradeCalendarRoutes } from './routes/tradeCalendar.js';
import { demandSignalRoutes } from './routes/demandSignals.js';
import { scenarioRoutes } from './routes/scenarios.js';
import { promotionOptimizerRoutes } from './routes/promotionOptimizer.js';
import { customer360Routes } from './routes/customer360.js';
import { advancedReportingRoutes } from './routes/advancedReporting.js';
import { revenueGrowthRoutes } from './routes/revenueGrowth.js';
import { multiCurrencyRoutes } from './routes/multiCurrency.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS configuration - allow all Cloudflare Pages subdomains
app.use('*', cors({
  origin: (origin) => {
    if (origin && (
      origin.endsWith('.pages.dev') ||
      origin === 'https://tradeai.vantax.co.za' ||
      origin === 'http://localhost:3000' ||
      origin === 'http://localhost:12000'
    )) {
      return origin;
    }
    return 'https://tradeai-8n8.pages.dev';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Company-Code', 'X-Tenant-Id'],
  credentials: true,
  maxAge: 86400,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'cloudflare-workers'
  });
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'cloudflare-workers'
  });
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/products', productRoutes);
app.route('/api/promotions', promotionRoutes);
app.route('/api/budgets', budgetRoutes);
app.route('/api/trade-spends', tradeSpendRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/reporting', reportingRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/simulations', simulationsRoutes);
app.route('/api/ai-orchestrator', aiOrchestratorRoutes);
app.route('/api/optimizer', optimizerRoutes);
app.route('/api/recommendations', recommendationsRoutes);
app.route('/api/export', exportRoutes);
// New routes for complete platform functionality
app.route('/api/approvals', approvalsRoutes);
app.route('/api/rebates', rebatesRoutes);
app.route('/api/trading-terms', tradingTermsRoutes);
app.route('/api/claims', claimsRoutes);
app.route('/api/deductions', deductionsRoutes);
app.route('/api/vendors', vendorsRoutes);
app.route('/api/campaigns', campaignsRoutes);
app.route('/api/activities', activitiesRoutes);
app.route('/api/activity-grid', activityGridRoutes);
app.route('/api/data-lineage', dataLineageRoutes);
app.route('/api/forecasting', forecastingRoutes);
app.route('/api/seed', seedRoutes);
app.route('/api/business-rules', businessRulesRoutes);
app.route('/api/allocations', allocationRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/transactions', transactionRoutes);
app.route('/api/kam-wallets', kamWalletRoutes);
app.route('/api/performance-analytics', performanceAnalyticsRoutes);
app.route('/api/import', importExportRoutes);
app.route('/api/hierarchy', hierarchyRoutes);
app.route('/api/alerts', alertRoutes);
app.route('/api/customer-assignment', customerAssignmentRoutes);
app.route('/api/company-admin', companyAdminRoutes);
app.route('/api/ai-copilot', aiCopilotRoutes);
app.route('/api/smart-approvals', smartApprovalsRoutes);
app.route('/api/deduction-match', deductionMatchRoutes);
app.route('/api/post-event-analysis', postEventAnalysisRoutes);
app.route('/api/anomaly-detection', anomalyDetectionRoutes);
app.route('/api/promotion-conflict', promotionConflictRoutes);
app.route('/api/baselines', baselineRoutes);
app.route('/api/accruals', accrualRoutes);
app.route('/api/settlements', settlementRoutes);
app.route('/api/pnl', pnlRoutes);
app.route('/api/budget-allocations', budgetAllocationRoutes);
app.route('/api/trade-calendar', tradeCalendarRoutes);
app.route('/api/demand-signals', demandSignalRoutes);
app.route('/api/scenarios', scenarioRoutes);
app.route('/api/promotion-optimizer', promotionOptimizerRoutes);
app.route('/api/customer-360', customer360Routes);
app.route('/api/advanced-reporting', advancedReportingRoutes);
app.route('/api/revenue-growth', revenueGrowthRoutes);
app.route('/api/multi-currency', multiCurrencyRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found',
    path: c.req.path
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    message: err.message || 'Internal server error',
    ...(c.env.ENVIRONMENT !== 'production' && { stack: err.stack })
  }, 500);
});

export default app;
