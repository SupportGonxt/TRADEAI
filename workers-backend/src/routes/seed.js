import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const seedRoutes = new Hono();

seedRoutes.use('*', authMiddleware);
seedRoutes.use('*', requireRole('admin'));

// Comprehensive seed data for ML testing
seedRoutes.post('/ml-data', async (c) => {
  try {
    const db = getD1Client(c);
    const companyId = 'comp-metro-001';
    const now = new Date();
    
    // Generate dates for historical data
    const getDate = (daysAgo) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString();
    };
    
    const getDateStr = (daysAgo) => getDate(daysAgo).split('T')[0];
    
    // Get actual customer and product IDs from the database
    const existingCustomers = await db.find('customers', { company_id: companyId }, { limit: 10 });
    const existingProducts = await db.find('products', { company_id: companyId }, { limit: 10 });
    
    // Use actual IDs or fallback to null (no foreign key constraint)
    const customers = existingCustomers.length > 0 
      ? existingCustomers.map(c => c.id || c._id)
      : [null];
    const products = existingProducts.length > 0 
      ? existingProducts.map(p => p.id || p._id)
      : [null];
    
    // Seed 50+ promotions with varied outcomes
    const promotionTypes = ['Discount', 'BOGO', 'Bundle', 'Rebate', 'Display', 'Sampling'];
    const promotionStatuses = ['completed', 'completed', 'completed', 'active', 'draft'];
    
    const promotions = [];
    for (let i = 1; i <= 60; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const duration = Math.floor(Math.random() * 30) + 7;
      const discount = Math.floor(Math.random() * 25) + 5;
      const budget = Math.floor(Math.random() * 50000) + 10000;
      const roi = (Math.random() * 3 + 0.5).toFixed(2);
      const uplift = (Math.random() * 30 + 5).toFixed(1);
      const status = promotionStatuses[Math.floor(Math.random() * promotionStatuses.length)];
      
      promotions.push({
        company_id: companyId,
        name: `Promotion ${i} - ${promotionTypes[i % promotionTypes.length]}`,
        description: `Historical promotion for ML training data`,
        promotion_type: promotionTypes[i % promotionTypes.length],
        status: status,
        start_date: getDateStr(daysAgo),
        end_date: getDateStr(daysAgo - duration),
        data: JSON.stringify({
          discount: discount,
          budget: budget,
          actualSpend: budget * (0.8 + Math.random() * 0.3),
          customerId: customers[i % customers.length],
          productId: products[i % products.length],
          performance: {
            roi: parseFloat(roi),
            uplift: parseFloat(uplift),
            incrementalRevenue: budget * parseFloat(roi),
            baselineRevenue: budget * 2,
            cannibalization: Math.floor(Math.random() * 10),
            haloEffect: Math.floor(Math.random() * 15)
          },
          mechanics: {
            type: promotionTypes[i % promotionTypes.length],
            discountPercent: discount,
            minPurchase: Math.floor(Math.random() * 500) + 100
          }
        })
      });
    }
    
    // Insert promotions
    for (const promo of promotions) {
      await db.insertOne('promotions', promo);
    }
    
    // Seed 30+ budgets across different years and categories
    const budgetCategories = ['Trade Promotions', 'Customer Rebates', 'Marketing Events', 'Product Launch', 'Contingency'];
    const years = [2024, 2025, 2026];
    
    const budgets = [];
    for (let i = 1; i <= 36; i++) {
      const year = years[i % years.length];
      const category = budgetCategories[i % budgetCategories.length];
      const amount = Math.floor(Math.random() * 500000) + 100000;
      const utilized = amount * (0.3 + Math.random() * 0.6);
      
      budgets.push({
        company_id: companyId,
        name: `${year} ${category} Budget`,
        year: year,
        amount: amount,
        utilized: utilized,
        budget_type: category,
        status: year < 2026 ? 'completed' : 'active',
        data: JSON.stringify({
          category: category,
          allocations: {
            q1: amount * 0.25,
            q2: amount * 0.25,
            q3: amount * 0.25,
            q4: amount * 0.25
          },
          performance: {
            roi: (1.5 + Math.random() * 2).toFixed(2),
            efficiency: (70 + Math.random() * 25).toFixed(1)
          }
        })
      });
    }
    
    for (const budget of budgets) {
      await db.insertOne('budgets', budget);
    }
    
    // Seed 100+ trade spends with different types and results
    const spendTypes = ['Display', 'Co-op Advertising', 'Slotting Fee', 'Volume Rebate', 'Promotion Support', 'Sampling', 'Demo'];
    const spendStatuses = ['approved', 'approved', 'approved', 'pending', 'completed'];
    
    const tradeSpends = [];
    for (let i = 1; i <= 120; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      const amount = Math.floor(Math.random() * 30000) + 5000;
      const spendType = spendTypes[i % spendTypes.length];
      const status = spendStatuses[Math.floor(Math.random() * spendStatuses.length)];
      
      tradeSpends.push({
        company_id: companyId,
        customer_id: customers[i % customers.length],
        amount: amount,
        spend_type: spendType,
        status: status,
        description: `Trade spend for ${spendType}`,
        data: JSON.stringify({
          productId: products[i % products.length],
          startDate: getDateStr(daysAgo),
          endDate: getDateStr(daysAgo - 30),
          actualROI: (1.5 + Math.random() * 2.5).toFixed(2),
          expectedROI: (2 + Math.random() * 1.5).toFixed(2),
          performance: {
            incrementalSales: amount * (1.5 + Math.random() * 2),
            compliance: (80 + Math.random() * 20).toFixed(1)
          }
        })
      });
    }
    
    for (const spend of tradeSpends) {
      await db.insertOne('trade_spends', spend);
    }
    
    // Seed 40+ claims with different statuses (using correct schema)
    const claimStatuses = ['submitted', 'approved', 'rejected', 'paid', 'pending'];
    const claimTypes = ['promotion', 'rebate', 'damage', 'shortage', 'marketing'];
    
    for (let i = 1; i <= 45; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const claimedAmount = Math.floor(Math.random() * 15000) + 2000;
      const status = claimStatuses[Math.floor(Math.random() * claimStatuses.length)];
      const approvedAmount = status === 'approved' || status === 'paid' ? claimedAmount * (0.8 + Math.random() * 0.2) : 0;
      const settledAmount = status === 'paid' ? approvedAmount : 0;
      
      await db.insertOne('claims', {
        company_id: companyId,
        customer_id: customers[i % customers.length],
        claim_number: `CLM-ML-${String(i).padStart(4, '0')}`,
        claim_type: claimTypes[i % claimTypes.length],
        status: status,
        claimed_amount: claimedAmount,
        approved_amount: Math.round(approvedAmount),
        settled_amount: Math.round(settledAmount),
        claim_date: getDate(daysAgo),
        reason: `ML Training Claim - ${claimTypes[i % claimTypes.length]}`,
        supporting_documents: JSON.stringify(['invoice.pdf', 'proof.jpg']),
        data: JSON.stringify({
          description: `Claim for ${claimTypes[i % claimTypes.length]}`,
          processingTime: Math.floor(Math.random() * 14) + 1
        })
      });
    }
    
    // Seed 40+ deductions with aging data (using correct schema)
    const deductionStatuses = ['open', 'matched', 'disputed', 'written_off', 'resolved'];
    const deductionTypes = ['pricing', 'shortage', 'damage', 'promotion', 'unauthorized'];
    
    for (let i = 1; i <= 45; i++) {
      const daysAgo = Math.floor(Math.random() * 120);
      const deductionAmount = Math.floor(Math.random() * 8000) + 1000;
      const status = deductionStatuses[Math.floor(Math.random() * deductionStatuses.length)];
      const matchedAmount = status === 'matched' || status === 'resolved' ? deductionAmount : 0;
      
      await db.insertOne('deductions', {
        company_id: companyId,
        customer_id: customers[i % customers.length],
        deduction_number: `DED-ML-${String(i).padStart(4, '0')}`,
        deduction_type: deductionTypes[i % deductionTypes.length],
        status: status,
        invoice_number: `INV-ML-${Math.floor(Math.random() * 10000)}`,
        deduction_amount: deductionAmount,
        matched_amount: matchedAmount,
        remaining_amount: deductionAmount - matchedAmount,
        deduction_date: getDate(daysAgo),
        reason_description: `ML Training Deduction - ${deductionTypes[i % deductionTypes.length]}`,
        data: JSON.stringify({
          agingBucket: daysAgo <= 30 ? '0-30' : daysAgo <= 60 ? '31-60' : daysAgo <= 90 ? '61-90' : '90+',
          matchedClaimId: status === 'matched' ? `CLM-ML-${String(Math.floor(Math.random() * 45) + 1).padStart(4, '0')}` : null
        })
      });
    }
    
    // Seed 25+ rebates with calculations (using correct schema)
    const rebateTypes = ['volume', 'growth', 'loyalty', 'promotional', 'tiered'];
    const rebateStatuses = ['active', 'draft', 'calculated', 'settled'];
    
    for (let i = 1; i <= 28; i++) {
      const accruedAmount = Math.floor(Math.random() * 25000) + 5000;
      const rate = (Math.random() * 5 + 1).toFixed(2);
      const status = rebateStatuses[Math.floor(Math.random() * rebateStatuses.length)];
      const settledAmount = status === 'settled' ? accruedAmount : 0;
      const threshold = Math.floor(Math.random() * 50000) + 10000;
      
      await db.insertOne('rebates', {
        company_id: companyId,
        customer_id: customers[i % customers.length],
        name: `ML Training Rebate ${i} - ${rebateTypes[i % rebateTypes.length]}`,
        description: `Historical rebate for ML training`,
        rebate_type: rebateTypes[i % rebateTypes.length],
        status: status,
        rate: parseFloat(rate),
        rate_type: 'percentage',
        threshold: threshold,
        accrued_amount: accruedAmount,
        settled_amount: settledAmount,
        calculation_basis: 'volume',
        settlement_frequency: 'quarterly',
        start_date: getDateStr(90),
        end_date: getDateStr(0),
        data: JSON.stringify({
          targetVolume: Math.floor(Math.random() * 100000) + 50000,
          actualVolume: Math.floor(Math.random() * 120000) + 40000,
          tiers: [
            { threshold: 50000, rate: 1 },
            { threshold: 75000, rate: 2 },
            { threshold: 100000, rate: 3 }
          ]
        })
      });
    }
    
    return c.json({
      success: true,
      message: 'ML training data seeded successfully',
      counts: {
        promotions: promotions.length,
        budgets: budgets.length,
        tradeSpends: tradeSpends.length,
        claims: 45,
        deductions: 45,
        rebates: 28
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get ML statistics from seeded data
seedRoutes.get('/ml-stats', async (c) => {
  try {
    const db = getD1Client(c);
    const companyId = 'comp-metro-001';
    
    // Get promotion statistics
    const promotions = await db.find('promotions', { company_id: companyId });
    const completedPromos = promotions.filter(p => p.status === 'completed');
    
    // Calculate average ROI by promotion type
    const roiByType = {};
    const upliftByType = {};
    const countByType = {};
    
    completedPromos.forEach(p => {
      const type = p.promotion_type || 'Other';
      const perf = p.performance || {};
      
      if (!roiByType[type]) {
        roiByType[type] = 0;
        upliftByType[type] = 0;
        countByType[type] = 0;
      }
      
      roiByType[type] += perf.roi || 0;
      upliftByType[type] += perf.uplift || 0;
      countByType[type]++;
    });
    
    const avgRoiByType = {};
    const avgUpliftByType = {};
    Object.keys(roiByType).forEach(type => {
      avgRoiByType[type] = (roiByType[type] / countByType[type]).toFixed(2);
      avgUpliftByType[type] = (upliftByType[type] / countByType[type]).toFixed(1);
    });
    
    // Get budget statistics
    const budgets = await db.find('budgets', { company_id: companyId });
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalUtilized = budgets.reduce((sum, b) => sum + (b.utilized || 0), 0);
    
    // Get trade spend statistics
    const tradeSpends = await db.find('trade_spends', { company_id: companyId });
    const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const avgSpendROI = tradeSpends.reduce((sum, ts) => sum + (parseFloat(ts.actualROI) || 0), 0) / tradeSpends.length;
    
    return c.json({
      success: true,
      stats: {
        promotions: {
          total: promotions.length,
          completed: completedPromos.length,
          avgRoiByType,
          avgUpliftByType,
          overallAvgROI: (completedPromos.reduce((sum, p) => sum + (p.performance?.roi || 0), 0) / completedPromos.length).toFixed(2)
        },
        budgets: {
          total: budgets.length,
          totalAmount: totalBudget,
          totalUtilized: totalUtilized,
          utilizationRate: ((totalUtilized / totalBudget) * 100).toFixed(1)
        },
        tradeSpends: {
          total: tradeSpends.length,
          totalAmount: totalSpend,
          avgROI: avgSpendROI.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

seedRoutes.post('/phase5-6', async (c) => {
  try {
    const db = getD1Client(c);
    const companyId = 'comp-metro-001';
    const now = new Date().toISOString();
    const counts = {};

    const notifTypes = ['info', 'warning', 'success', 'error', 'action_required'];
    const notifCategories = ['promotion', 'budget', 'claim', 'deduction', 'approval', 'system'];
    const priorities = ['low', 'normal', 'high', 'urgent'];
    const notifStatuses = ['unread', 'unread', 'unread', 'read', 'dismissed'];
    const channels = ['in_app', 'email', 'sms'];

    for (let i = 1; i <= 40; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      const cat = notifCategories[i % notifCategories.length];
      const status = notifStatuses[i % notifStatuses.length];
      await db.insertOne('notifications', {
        company_id: companyId,
        user_id: 'user-admin-001',
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} ${notifTypes[i % notifTypes.length] === 'action_required' ? 'requires action' : 'update'} #${i}`,
        message: `${cat} notification — ${['Budget utilization at 85%', 'Promotion approved by Finance', 'Claim CLM-2025-0042 settled', 'Deduction matched automatically', 'New approval request pending', 'System maintenance scheduled'][i % 6]}`,
        notification_type: notifTypes[i % notifTypes.length],
        category: cat,
        priority: priorities[i % priorities.length],
        status: status,
        source_entity_type: cat,
        source_entity_id: `${cat}-${String(i).padStart(4, '0')}`,
        source_entity_name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Record ${i}`,
        action_url: `/${cat}s`,
        action_label: 'View Details',
        read_at: status === 'read' ? d.toISOString() : null,
        dismissed_at: status === 'dismissed' ? d.toISOString() : null,
        channel: channels[i % channels.length],
        sent_via_email: i % 3 === 0 ? 1 : 0,
        sent_via_sms: i % 7 === 0 ? 1 : 0,
        data: JSON.stringify({ source: 'seed', batch: 'phase5-6' }),
        created_at: d.toISOString()
      });
    }
    counts.notifications = 40;

    const severities = ['low', 'medium', 'high', 'critical'];
    const ruleTypes = ['threshold', 'trend', 'anomaly', 'schedule'];
    const operators = ['>', '<', '>=', '<=', '=='];
    const entityTypes = ['promotion', 'budget', 'claim', 'deduction', 'customer'];
    const metrics = ['utilization_pct', 'roi', 'amount', 'count', 'aging_days'];

    for (let i = 1; i <= 12; i++) {
      await db.insertOne('alert_rules', {
        company_id: companyId,
        name: `Alert Rule ${i} — ${entityTypes[i % entityTypes.length]} ${metrics[i % metrics.length]}`,
        description: `Triggers when ${entityTypes[i % entityTypes.length]} ${metrics[i % metrics.length]} ${operators[i % operators.length]} threshold`,
        rule_type: ruleTypes[i % ruleTypes.length],
        category: entityTypes[i % entityTypes.length],
        entity_type: entityTypes[i % entityTypes.length],
        metric: metrics[i % metrics.length],
        operator: operators[i % operators.length],
        threshold_value: (Math.random() * 100).toFixed(0),
        threshold_unit: i % 2 === 0 ? 'percent' : 'currency',
        severity: severities[i % severities.length],
        is_active: i <= 10 ? 1 : 0,
        frequency: ['realtime', 'hourly', 'daily', 'weekly'][i % 4],
        cooldown_minutes: [15, 30, 60, 120][i % 4],
        trigger_count: Math.floor(Math.random() * 20),
        recipients: JSON.stringify(['admin@sunrisefoods.co.za']),
        channels: JSON.stringify(['in_app', 'email']),
        conditions: JSON.stringify({ field: metrics[i % metrics.length], op: operators[i % operators.length] }),
        created_by: 'user-admin-001',
        created_at: now, updated_at: now
      });
    }
    counts.alert_rules = 12;

    const alertStatuses = ['triggered', 'acknowledged', 'resolved', 'escalated'];
    for (let i = 1; i <= 25; i++) {
      const daysAgo = Math.floor(Math.random() * 45);
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      const st = alertStatuses[i % alertStatuses.length];
      await db.insertOne('alert_history', {
        company_id: companyId,
        rule_id: `rule-${(i % 12) + 1}`,
        rule_name: `Alert Rule ${(i % 12) + 1}`,
        alert_type: ruleTypes[i % ruleTypes.length],
        severity: severities[i % severities.length],
        title: `Alert: ${entityTypes[i % entityTypes.length]} ${metrics[i % metrics.length]} breached`,
        message: `${entityTypes[i % entityTypes.length]} ${metrics[i % metrics.length]} value ${(Math.random() * 100).toFixed(1)} exceeded threshold`,
        entity_type: entityTypes[i % entityTypes.length],
        entity_id: `entity-${i}`,
        entity_name: `${entityTypes[i % entityTypes.length]} Record ${i}`,
        metric_value: (Math.random() * 100).toFixed(2),
        threshold_value: (Math.random() * 80).toFixed(2),
        status: st,
        acknowledged_by: st !== 'triggered' ? 'user-admin-001' : null,
        acknowledged_at: st !== 'triggered' ? d.toISOString() : null,
        resolved_by: st === 'resolved' ? 'user-admin-001' : null,
        resolved_at: st === 'resolved' ? d.toISOString() : null,
        data: JSON.stringify({ source: 'seed' }),
        created_at: d.toISOString()
      });
    }
    counts.alert_history = 25;

    const docTypes = ['contract', 'invoice', 'report', 'policy', 'agreement', 'presentation'];
    const docCategories = ['trade', 'finance', 'legal', 'marketing', 'operations'];
    const docStatuses = ['active', 'draft', 'archived', 'pending_approval', 'expired'];

    for (let i = 1; i <= 20; i++) {
      const daysAgo = Math.floor(Math.random() * 120);
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      const docType = docTypes[i % docTypes.length];
      await db.insertOne('documents', {
        company_id: companyId,
        name: `${docType.charAt(0).toUpperCase() + docType.slice(1)} — ${['Retailer Agreement Q1', 'Trade Spend Report', 'Promo Policy 2025', 'Customer Terms', 'Budget Presentation', 'Settlement Invoice'][i % 6]}`,
        description: `${docType} document for ${docCategories[i % docCategories.length]} department`,
        document_type: docType,
        category: docCategories[i % docCategories.length],
        file_name: `${docType}_${i}.pdf`,
        file_url: `/documents/${docType}_${i}.pdf`,
        file_size: Math.floor(Math.random() * 5000000) + 50000,
        mime_type: 'application/pdf',
        version: Math.ceil(i / 5),
        status: docStatuses[i % docStatuses.length],
        entity_type: ['promotion', 'budget', 'claim', 'customer'][i % 4],
        entity_id: `entity-${i}`,
        entity_name: `Related Record ${i}`,
        tags: JSON.stringify([docType, docCategories[i % docCategories.length], '2025']),
        uploaded_by: 'user-admin-001',
        approved_by: i % 3 === 0 ? 'user-admin-001' : null,
        approved_at: i % 3 === 0 ? d.toISOString() : null,
        expires_at: i % 4 === 0 ? new Date(2026, 0, 1).toISOString() : null,
        data: JSON.stringify({ source: 'seed' }),
        created_at: d.toISOString(), updated_at: d.toISOString()
      });
    }
    counts.documents = 20;

    for (let i = 1; i <= 8; i++) {
      await db.insertOne('document_versions', {
        company_id: companyId,
        document_id: `doc-${(i % 5) + 1}`,
        version_number: Math.ceil(i / 2),
        file_name: `document_v${Math.ceil(i / 2)}.pdf`,
        file_url: `/documents/versions/v${i}.pdf`,
        file_size: Math.floor(Math.random() * 3000000) + 100000,
        mime_type: 'application/pdf',
        change_summary: ['Initial upload', 'Updated terms', 'Added appendix', 'Minor corrections', 'Final version', 'Legal review changes', 'Finance sign-off', 'Client revision'][i - 1],
        uploaded_by: 'user-admin-001',
        created_at: now
      });
    }
    counts.document_versions = 8;

    const intTypes = ['erp', 'crm', 'pos', 'edw', 'file_transfer'];
    const providers = ['SAP S/4HANA', 'Salesforce', 'Oracle Retail', 'Azure Data Factory', 'SFTP'];
    const intCategories = ['data_import', 'data_export', 'bidirectional', 'webhook'];
    const intStatuses = ['active', 'active', 'active', 'inactive', 'error'];
    const syncFreqs = ['realtime', 'hourly', 'daily', 'weekly'];

    for (let i = 1; i <= 8; i++) {
      const lastSync = new Date(); lastSync.setHours(lastSync.getHours() - Math.floor(Math.random() * 48));
      const nextSync = new Date(lastSync); nextSync.setHours(nextSync.getHours() + 24);
      await db.insertOne('integrations', {
        company_id: companyId,
        name: `${providers[i % providers.length]} Integration`,
        description: `${intTypes[i % intTypes.length].toUpperCase()} integration with ${providers[i % providers.length]}`,
        integration_type: intTypes[i % intTypes.length],
        provider: providers[i % providers.length],
        category: intCategories[i % intCategories.length],
        status: intStatuses[i % intStatuses.length],
        config: JSON.stringify({ host: `${providers[i % providers.length].toLowerCase().replace(/[^a-z]/g, '')}.example.com`, port: 443 }),
        endpoint_url: `https://api.${providers[i % providers.length].toLowerCase().replace(/[^a-z]/g, '')}.com/v1`,
        auth_type: ['oauth2', 'api_key', 'basic', 'certificate'][i % 4],
        sync_frequency: syncFreqs[i % syncFreqs.length],
        last_sync_at: lastSync.toISOString(),
        next_sync_at: nextSync.toISOString(),
        sync_status: intStatuses[i % intStatuses.length] === 'error' ? 'failed' : 'success',
        record_count: Math.floor(Math.random() * 50000) + 1000,
        error_count: intStatuses[i % intStatuses.length] === 'error' ? Math.floor(Math.random() * 50) : 0,
        last_error: intStatuses[i % intStatuses.length] === 'error' ? 'Connection timeout after 30s' : null,
        created_by: 'user-admin-001',
        data: JSON.stringify({ source: 'seed' }),
        created_at: now, updated_at: now
      });
    }
    counts.integrations = 8;

    const logActions = ['sync_customers', 'sync_products', 'import_sales', 'export_claims', 'sync_inventory'];
    const logStatuses = ['success', 'success', 'success', 'partial', 'failed'];
    for (let i = 1; i <= 15; i++) {
      const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 14));
      await db.insertOne('integration_logs', {
        company_id: companyId,
        integration_id: `int-${(i % 8) + 1}`,
        log_type: i % 3 === 0 ? 'error' : 'info',
        action: logActions[i % logActions.length],
        status: logStatuses[i % logStatuses.length],
        records_processed: Math.floor(Math.random() * 5000) + 100,
        records_failed: logStatuses[i % logStatuses.length] === 'failed' ? Math.floor(Math.random() * 100) : 0,
        duration_ms: Math.floor(Math.random() * 30000) + 500,
        error_message: logStatuses[i % logStatuses.length] === 'failed' ? 'Timeout waiting for response' : null,
        created_at: d.toISOString()
      });
    }
    counts.integration_logs = 15;

    const roleNames = ['Super Admin', 'Finance Manager', 'Trade Marketing Manager', 'Key Account Manager', 'Analyst', 'Auditor', 'Regional Manager', 'Category Manager'];
    const roleTypes = ['system', 'custom', 'custom', 'custom', 'custom', 'custom', 'custom', 'custom'];
    const permSets = [
      ['*'],
      ['budgets.*', 'claims.*', 'settlements.*', 'accruals.*', 'pnl.read'],
      ['promotions.*', 'budgets.read', 'campaigns.*', 'trade_spends.*'],
      ['promotions.read', 'promotions.create', 'customers.read', 'trade_spends.read'],
      ['analytics.read', 'reports.*', 'dashboards.read'],
      ['audit.*', 'compliance.*', 'documents.read'],
      ['promotions.*', 'budgets.*', 'customers.*', 'approvals.*'],
      ['products.*', 'promotions.read', 'analytics.read']
    ];

    for (let i = 0; i < 8; i++) {
      await db.insertOne('roles', {
        company_id: companyId,
        name: roleNames[i],
        description: `${roleNames[i]} role with ${i === 0 ? 'full' : 'module-specific'} access`,
        role_type: roleTypes[i],
        is_system: i === 0 ? 1 : 0,
        is_active: 1,
        permissions: JSON.stringify(permSets[i]),
        level: i === 0 ? 1 : i <= 2 ? 2 : i <= 5 ? 3 : 4,
        max_approval_amount: [10000000, 5000000, 2000000, 500000, 0, 0, 3000000, 1000000][i],
        created_by: 'user-admin-001',
        data: JSON.stringify({ source: 'seed' }),
        created_at: now, updated_at: now
      });
    }
    counts.roles = 8;

    const userIds = ['user-admin-001', 'user-finance-001', 'user-tm-001', 'user-kam-001', 'user-analyst-001'];
    for (let i = 0; i < 5; i++) {
      await db.insertOne('user_roles', {
        company_id: companyId,
        user_id: userIds[i],
        role_id: `role-${i + 1}`,
        role_name: roleNames[i],
        assigned_by: 'user-admin-001',
        valid_from: '2025-01-01T00:00:00.000Z',
        status: 'active',
        created_at: now
      });
    }
    counts.user_roles = 5;

    const modules = ['promotions', 'budgets', 'claims', 'deductions', 'analytics', 'customers', 'products', 'approvals'];
    for (let i = 0; i < 8; i++) {
      await db.insertOne('permission_groups', {
        company_id: companyId,
        name: `${modules[i].charAt(0).toUpperCase() + modules[i].slice(1)} Full Access`,
        description: `Full read/write/delete access to ${modules[i]} module`,
        module: modules[i],
        permissions: JSON.stringify([`${modules[i]}.read`, `${modules[i]}.create`, `${modules[i]}.update`, `${modules[i]}.delete`]),
        is_system: 1,
        created_by: 'user-admin-001',
        created_at: now, updated_at: now
      });
    }
    counts.permission_groups = 8;

    const configItems = [
      { key: 'company.name', value: 'Sunrise Foods (Pty) Ltd', type: 'string', cat: 'general', mod: 'system' },
      { key: 'company.currency', value: 'ZAR', type: 'string', cat: 'general', mod: 'system' },
      { key: 'company.timezone', value: 'Africa/Johannesburg', type: 'string', cat: 'general', mod: 'system' },
      { key: 'company.fiscal_year_start', value: '01', type: 'string', cat: 'general', mod: 'system' },
      { key: 'approval.auto_approve_below', value: '50000', type: 'number', cat: 'approvals', mod: 'approvals' },
      { key: 'approval.max_levels', value: '3', type: 'number', cat: 'approvals', mod: 'approvals' },
      { key: 'notification.email_enabled', value: 'true', type: 'boolean', cat: 'notifications', mod: 'notifications' },
      { key: 'notification.sms_enabled', value: 'false', type: 'boolean', cat: 'notifications', mod: 'notifications' },
      { key: 'promotion.default_currency', value: 'ZAR', type: 'string', cat: 'promotions', mod: 'promotions' },
      { key: 'promotion.require_approval', value: 'true', type: 'boolean', cat: 'promotions', mod: 'promotions' },
      { key: 'budget.fiscal_year', value: '2025', type: 'string', cat: 'budgets', mod: 'budgets' },
      { key: 'budget.allocation_method', value: 'proportional', type: 'string', cat: 'budgets', mod: 'budgets' },
      { key: 'claim.auto_match', value: 'true', type: 'boolean', cat: 'claims', mod: 'claims' },
      { key: 'deduction.aging_threshold_days', value: '90', type: 'number', cat: 'deductions', mod: 'deductions' },
      { key: 'integration.sync_interval_hours', value: '24', type: 'number', cat: 'integrations', mod: 'integrations' },
      { key: 'security.session_timeout_minutes', value: '60', type: 'number', cat: 'security', mod: 'system' },
    ];

    for (const cfg of configItems) {
      await db.insertOne('system_config', {
        company_id: companyId,
        config_key: cfg.key,
        config_value: cfg.value,
        config_type: cfg.type,
        category: cfg.cat,
        module: cfg.mod,
        description: `${cfg.key} configuration setting`,
        is_sensitive: cfg.key.includes('password') || cfg.key.includes('secret') ? 1 : 0,
        is_readonly: cfg.key.startsWith('company.') ? 1 : 0,
        default_value: cfg.value,
        updated_by: 'user-admin-001',
        created_at: now, updated_at: now
      });
    }
    counts.system_config = configItems.length;

    await db.insertOne('tenants', {
      name: 'Sunrise Foods',
      code: 'SUNRISE',
      domain: 'sunrise.tradeai.co.za',
      status: 'active',
      plan: 'enterprise',
      max_users: 100,
      max_storage_gb: 50,
      features: JSON.stringify(['promotions', 'budgets', 'claims', 'deductions', 'analytics', 'ai', 'workflows', 'integrations']),
      branding: JSON.stringify({ primary_color: '#7C3AED', logo_url: '/logos/sunrise.png' }),
      contact_name: 'Reshigan Admin',
      contact_email: 'admin@sunrisefoods.co.za',
      contact_phone: '+27 11 555 1234',
      billing_email: 'billing@sunrisefoods.co.za',
      country: 'ZA',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      subscription_starts_at: '2025-01-01T00:00:00.000Z',
      subscription_ends_at: '2026-12-31T23:59:59.000Z',
      data: JSON.stringify({ source: 'seed' }),
      created_at: now, updated_at: now
    });
    counts.tenants = 1;

    const wfTypes = ['approval', 'review', 'escalation', 'onboarding'];
    const wfEntities = ['promotion', 'budget', 'claim', 'settlement', 'deduction'];
    const wfTriggers = ['on_create', 'on_submit', 'on_threshold', 'on_schedule'];

    for (let i = 1; i <= 6; i++) {
      await db.insertOne('workflow_templates', {
        company_id: companyId,
        name: `${wfEntities[i % wfEntities.length].charAt(0).toUpperCase() + wfEntities[i % wfEntities.length].slice(1)} ${wfTypes[i % wfTypes.length].charAt(0).toUpperCase() + wfTypes[i % wfTypes.length].slice(1)} Workflow`,
        description: `Standard ${wfTypes[i % wfTypes.length]} workflow for ${wfEntities[i % wfEntities.length]}s`,
        workflow_type: wfTypes[i % wfTypes.length],
        entity_type: wfEntities[i % wfEntities.length],
        trigger_event: wfTriggers[i % wfTriggers.length],
        status: 'active',
        is_system: i <= 2 ? 1 : 0,
        version: 1,
        steps: JSON.stringify([
          { step: 1, name: 'Manager Review', type: 'approval', assignee_role: 'manager' },
          { step: 2, name: 'Finance Review', type: 'approval', assignee_role: 'finance' },
          { step: 3, name: 'Final Approval', type: 'approval', assignee_role: 'director' }
        ]),
        conditions: JSON.stringify({ min_amount: i * 50000 }),
        escalation_rules: JSON.stringify({ after_hours: 48, escalate_to: 'director' }),
        sla_hours: [24, 48, 72, 96][i % 4],
        auto_approve_below: [10000, 25000, 50000, 100000][i % 4],
        requires_all_approvers: i % 2 === 0 ? 1 : 0,
        created_by: 'user-admin-001',
        data: JSON.stringify({ source: 'seed' }),
        created_at: now, updated_at: now
      });
    }
    counts.workflow_templates = 6;

    const wfInstStatuses = ['completed', 'in_progress', 'pending', 'rejected', 'escalated'];
    for (let i = 1; i <= 15; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      const st = wfInstStatuses[i % wfInstStatuses.length];
      const totalSteps = 3;
      const currentStep = st === 'completed' ? 3 : st === 'rejected' ? Math.ceil(Math.random() * 2) : Math.ceil(Math.random() * 3);
      await db.insertOne('workflow_instances', {
        company_id: companyId,
        template_id: `wf-tmpl-${(i % 6) + 1}`,
        template_name: `${wfEntities[i % wfEntities.length]} Workflow`,
        entity_type: wfEntities[i % wfEntities.length],
        entity_id: `entity-${i}`,
        entity_name: `${wfEntities[i % wfEntities.length]} #${1000 + i}`,
        status: st,
        current_step: currentStep,
        total_steps: totalSteps,
        initiated_by: 'user-kam-001',
        initiated_at: d.toISOString(),
        completed_at: st === 'completed' ? now : null,
        completed_by: st === 'completed' ? 'user-admin-001' : null,
        outcome: st === 'completed' ? 'approved' : st === 'rejected' ? 'rejected' : null,
        duration_hours: st === 'completed' ? Math.floor(Math.random() * 72) + 2 : null,
        escalated: st === 'escalated' ? 1 : 0,
        escalated_to: st === 'escalated' ? 'user-admin-001' : null,
        escalated_at: st === 'escalated' ? now : null,
        data: JSON.stringify({ source: 'seed' }),
        created_at: d.toISOString(), updated_at: now
      });
    }
    counts.workflow_instances = 15;

    const stepStatuses = ['completed', 'in_progress', 'pending', 'rejected', 'skipped'];
    const stepTypes = ['approval', 'review', 'notification', 'condition'];
    for (let i = 1; i <= 30; i++) {
      const instId = (i % 15) + 1;
      const stepNum = ((i - 1) % 3) + 1;
      const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 30));
      const st = stepStatuses[i % stepStatuses.length];
      await db.insertOne('workflow_steps', {
        company_id: companyId,
        instance_id: `wf-inst-${instId}`,
        step_number: stepNum,
        step_name: ['Manager Review', 'Finance Review', 'Final Approval'][stepNum - 1],
        step_type: stepTypes[i % stepTypes.length],
        assignee_id: ['user-tm-001', 'user-finance-001', 'user-admin-001'][stepNum - 1],
        assignee_name: ['Trade Marketing Mgr', 'Finance Manager', 'Admin'][stepNum - 1],
        status: st,
        action: st === 'completed' ? 'approved' : st === 'rejected' ? 'rejected' : null,
        comments: st === 'completed' ? 'Approved — meets criteria' : st === 'rejected' ? 'Rejected — needs revision' : null,
        started_at: d.toISOString(),
        completed_at: st === 'completed' || st === 'rejected' ? now : null,
        due_at: new Date(d.getTime() + 48 * 3600000).toISOString(),
        sla_hours: 48,
        is_overdue: st === 'in_progress' && Math.random() > 0.7 ? 1 : 0,
        created_at: d.toISOString()
      });
    }
    counts.workflow_steps = 30;

    return c.json({ success: true, message: 'Phase 5-6 seed data created', counts });
  } catch (error) {
    console.error('Seed phase5-6 error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { seedRoutes };
