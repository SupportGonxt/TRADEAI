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

seedRoutes.post('/comprehensive', async (c) => {
  try {
    const db = getD1Client(c);
    const user = c.get('user');
    const companyId = user.companyId;
    const now = new Date().toISOString();
    const counts = {};

    const dateStr = (daysAgo) => {
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };
    const dateISO = (daysAgo) => {
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      return d.toISOString();
    };

    const existingCustomers = await db.find('customers', { company_id: companyId }, { limit: 20 });
    const existingProducts = await db.find('products', { company_id: companyId }, { limit: 20 });
    const existingUsers = await db.find('users', { company_id: companyId }, { limit: 10 });
    const custIds = existingCustomers.map(r => r.id);
    const prodIds = existingProducts.map(r => r.id);
    const userIds = existingUsers.map(r => r.id);
    const custNames = existingCustomers.map(r => r.name);
    const prodNames = existingProducts.map(r => r.name);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)] || null;
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randF = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const promoTypes = ['price_discount','volume_discount','bogo','bundle','display','sampling'];
    const promoStatuses = ['completed','completed','completed','active','active','draft'];
    for (let i = 1; i <= 80; i++) {
      const daysAgo = rand(7, 365);
      const duration = rand(7, 42);
      const plannedSpend = rand(50000, 800000);
      const actualSpend = Math.round(plannedSpend * randF(0.7, 1.15));
      const baselineRevenue = rand(200000, 3000000);
      const incrementalRevenue = Math.round(baselineRevenue * randF(0.05, 0.45));
      const actualRevenue = baselineRevenue + incrementalRevenue;
      const roi = +(incrementalRevenue / actualSpend).toFixed(2);
      const uplift = +((incrementalRevenue / baselineRevenue) * 100).toFixed(1);
      const status = promoStatuses[i % promoStatuses.length];
      const cid = pick(custIds);
      const pid = pick(prodIds);
      await db.insertOne('promotions', {
        company_id: companyId,
        name: `${months[i % 12]} ${['National','Regional','Holiday','Flash','Seasonal','Launch'][i % 6]} Promo ${i}`,
        description: `${promoTypes[i % promoTypes.length]} promotion for ${pick(custNames) || 'All Customers'}`,
        promotion_type: promoTypes[i % promoTypes.length],
        status,
        start_date: dateStr(daysAgo),
        end_date: dateStr(Math.max(0, daysAgo - duration)),
        created_by: pick(userIds),
        data: JSON.stringify({
          customerId: cid, productId: pid, customerName: pick(custNames), productName: pick(prodNames),
          mechanics: { type: promoTypes[i % promoTypes.length], discountPercent: rand(5, 30), minPurchase: rand(100, 5000) },
          financial: { plannedSpend, actualSpend, plannedRevenue: baselineRevenue + rand(50000, 500000), actualRevenue },
          performance: { roi, uplift, incrementalRevenue, baselineRevenue, actualRevenue, cannibalization: randF(0, 12), haloEffect: randF(0, 18), compliance: randF(70, 100) },
          ml: { predictedROI: +(roi * randF(0.85, 1.15)).toFixed(2), predictedUplift: +(uplift * randF(0.85, 1.15)).toFixed(1), confidence: randF(0.72, 0.96), riskScore: rand(5, 85), optimizationScore: rand(55, 98) },
          prePromo: { baseVolume: rand(5000, 50000), baseRevenue: baselineRevenue, avgPrice: randF(15, 250) },
          postPromo: { actualVolume: rand(6000, 65000), actualRevenue, avgPrice: randF(12, 230), incrementalVolume: rand(500, 15000) }
        })
      });
    }
    counts.promotions = 80;

    for (let i = 1; i <= 24; i++) {
      const yr = i <= 12 ? 2025 : 2026;
      const mo = ((i - 1) % 12) + 1;
      const amount = rand(800000, 2500000);
      const utilized = yr === 2025 ? Math.round(amount * randF(0.75, 1.02)) : Math.round(amount * randF(0.15, 0.55));
      await db.insertOne('budgets', {
        company_id: companyId,
        name: `${yr} ${months[mo-1]} Trade Budget`,
        year: yr,
        amount,
        utilized,
        budget_type: ['annual','promotional','listing','rebate','contingency'][i % 5],
        status: yr === 2025 ? 'completed' : 'active',
        created_by: pick(userIds),
        data: JSON.stringify({
          category: ['Trade Promotions','Customer Rebates','Listing Fees','Marketing Events','Contingency'][i % 5],
          month: mo,
          allocations: { q1: Math.round(amount * 0.25), q2: Math.round(amount * 0.25), q3: Math.round(amount * 0.25), q4: Math.round(amount * 0.25) },
          performance: { roi: randF(1.2, 3.5), efficiency: randF(65, 95) },
          actual: { spend: utilized, variance: amount - utilized, variancePct: +(((amount - utilized) / amount) * 100).toFixed(1) }
        })
      });
    }
    counts.budgets = 24;

    for (let i = 1; i <= 120; i++) {
      const amount = rand(8000, 350000);
      const daysAgo = rand(1, 300);
      const status = ['approved','approved','completed','completed','pending','rejected'][i % 6];
      await db.insertOne('trade_spends', {
        company_id: companyId,
        customer_id: pick(custIds),
        amount,
        spend_type: ['cash_coop','off_invoice','scan_rebate','volume_rebate','slotting_fee','display','sampling'][i % 7],
        status,
        description: `Trade spend #${i} — ${['Display allowance','Coop advertising','Slotting fee','Volume rebate','Promo support','Sampling program','Demo costs'][i % 7]}`,
        created_by: pick(userIds),
        data: JSON.stringify({
          productId: pick(prodIds), startDate: dateStr(daysAgo), endDate: dateStr(Math.max(0, daysAgo - 30)),
          actualROI: randF(0.8, 3.8), expectedROI: randF(1.5, 3.0),
          performance: { incrementalSales: Math.round(amount * randF(1.2, 3.5)), compliance: randF(75, 100), effectiveness: randF(60, 98) },
          actual: { salesLift: randF(5, 35), volumeLift: randF(3, 28), marginImpact: randF(-5, 15) }
        })
      });
    }
    counts.trade_spends = 120;

    for (let i = 1; i <= 60; i++) {
      const claimedAmt = rand(5000, 250000);
      const status = ['submitted','approved','rejected','settled','pending','under_review'][i % 6];
      const approvedAmt = (status === 'approved' || status === 'settled') ? Math.round(claimedAmt * randF(0.7, 1.0)) : 0;
      const settledAmt = status === 'settled' ? approvedAmt : 0;
      await db.insertOne('claims', {
        company_id: companyId,
        customer_id: pick(custIds),
        claim_number: `CLM-2025-${String(i).padStart(4, '0')}`,
        claim_type: ['promotion','rebate','damage','shortage','pricing'][i % 5],
        status,
        claimed_amount: claimedAmt,
        approved_amount: approvedAmt,
        settled_amount: settledAmt,
        claim_date: dateISO(rand(1, 180)),
        due_date: dateISO(-rand(1, 60)),
        reason: `${['Promotional discount not applied','Volume rebate shortfall','Damaged goods credit','Shortage on delivery','Pricing discrepancy'][i % 5]} — Ref #${rand(10000, 99999)}`,
        created_by: pick(userIds),
        data: JSON.stringify({
          processingTime: rand(1, 21),
          lineItems: [{ product: pick(prodNames), qty: rand(50, 5000), unitAmount: randF(5, 200) }],
          audit: { submittedBy: pick(userIds), submittedAt: dateISO(rand(5, 180)) }
        })
      });
    }
    counts.claims = 60;

    for (let i = 1; i <= 60; i++) {
      const dedAmt = rand(3000, 180000);
      const status = ['open','matched','disputed','resolved','written_off','under_review'][i % 6];
      const matchedAmt = (status === 'matched' || status === 'resolved') ? dedAmt : 0;
      await db.insertOne('deductions', {
        company_id: companyId,
        customer_id: pick(custIds),
        deduction_number: `DED-2025-${String(i).padStart(4, '0')}`,
        deduction_type: ['promotion','rebate','damage','shortage','pricing','unauthorized'][i % 6],
        status,
        invoice_number: `INV-${rand(100000, 999999)}`,
        deduction_amount: dedAmt,
        matched_amount: matchedAmt,
        remaining_amount: dedAmt - matchedAmt,
        deduction_date: dateISO(rand(1, 200)),
        reason_description: `${['Promo deduction','Rebate offset','Damage claim','Short shipment','Price adjustment','Unauthorized deduction'][i % 6]}`,
        created_by: pick(userIds),
        data: JSON.stringify({
          agingBucket: rand(1, 30) <= 30 ? '0-30' : rand(31, 60) <= 60 ? '31-60' : '61-90',
          matchConfidence: status === 'matched' ? randF(0.75, 0.99) : null,
          suggestedMatch: status === 'open' ? `CLM-2025-${String(rand(1, 60)).padStart(4, '0')}` : null
        })
      });
    }
    counts.deductions = 60;

    for (let i = 1; i <= 30; i++) {
      const accruedAmt = rand(15000, 400000);
      const status = ['active','calculated','settled','draft'][i % 4];
      const settledAmt = status === 'settled' ? accruedAmt : 0;
      await db.insertOne('accruals', {
        company_id: companyId,
        name: `${months[i % 12]} 2025 Accrual ${i}`,
        status,
        accrual_type: ['promotion','rebate','listing','coop'][i % 4],
        calculation_method: ['percentage_of_sales','fixed_amount','tiered'][i % 3],
        frequency: ['monthly','quarterly'][i % 2],
        customer_id: pick(custIds),
        product_id: pick(prodIds),
        gl_account: `4${rand(100, 999)}`,
        cost_center: `CC-${rand(100, 999)}`,
        start_date: dateStr(rand(30, 365)),
        end_date: dateStr(0),
        rate: randF(1, 8),
        rate_type: 'percentage',
        base_amount: rand(200000, 3000000),
        accrued_amount: accruedAmt,
        posted_amount: status !== 'draft' ? accruedAmt : 0,
        reversed_amount: 0,
        settled_amount: settledAmt,
        variance_amount: rand(-20000, 20000),
        data: JSON.stringify({ source: 'seed', periods: 12, lastCalculated: now })
      });
    }
    counts.accruals = 30;

    for (let i = 1; i <= 25; i++) {
      const accruedAmt = rand(10000, 350000);
      const claimedAmt = Math.round(accruedAmt * randF(0.85, 1.1));
      const settledAmt = Math.round(claimedAmt * randF(0.8, 1.0));
      const status = ['completed','completed','in_progress','pending','draft'][i % 5];
      await db.insertOne('settlements', {
        company_id: companyId,
        settlement_number: `SET-2025-${String(i).padStart(4, '0')}`,
        name: `Settlement #${i} — ${pick(custNames) || 'Customer'}`,
        status,
        settlement_type: ['claim','deduction','rebate','accrual'][i % 4],
        customer_id: pick(custIds),
        gl_account: `4${rand(100, 999)}`,
        cost_center: `CC-${rand(100, 999)}`,
        settlement_date: status === 'completed' ? dateStr(rand(1, 90)) : null,
        accrued_amount: accruedAmt,
        claimed_amount: claimedAmt,
        approved_amount: settledAmt,
        settled_amount: status === 'completed' ? settledAmt : 0,
        variance_amount: accruedAmt - settledAmt,
        variance_pct: +(((accruedAmt - settledAmt) / accruedAmt) * 100).toFixed(1),
        payment_method: ['credit_note','bank_transfer','offset'][i % 3],
        data: JSON.stringify({ source: 'seed' })
      });
    }
    counts.settlements = 25;

    for (let i = 1; i <= 20; i++) {
      const grossSales = rand(500000, 8000000);
      const tradeSpendAmt = Math.round(grossSales * randF(0.08, 0.18));
      const netSales = grossSales - tradeSpendAmt;
      const cogs = Math.round(grossSales * randF(0.45, 0.65));
      const grossProfit = netSales - cogs;
      await db.insertOne('pnl_reports', {
        company_id: companyId,
        name: `${months[i % 12]} 2025 P&L — ${pick(custNames) || 'All'}`,
        status: 'published',
        report_type: i % 2 === 0 ? 'customer' : 'promotion',
        period_type: 'monthly',
        start_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-01`,
        end_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-28`,
        customer_id: i % 2 === 0 ? pick(custIds) : null,
        gross_sales: grossSales,
        trade_spend: tradeSpendAmt,
        net_sales: netSales,
        cogs,
        gross_profit: grossProfit,
        gross_margin_pct: +((grossProfit / netSales) * 100).toFixed(1),
        accruals: Math.round(tradeSpendAmt * 0.3),
        settlements: Math.round(tradeSpendAmt * 0.25),
        claims: Math.round(tradeSpendAmt * 0.15),
        deductions: Math.round(tradeSpendAmt * 0.1),
        net_trade_cost: tradeSpendAmt,
        net_margin: grossProfit - tradeSpendAmt,
        net_margin_pct: +(((grossProfit - tradeSpendAmt) / netSales) * 100).toFixed(1),
        data: JSON.stringify({ actual: true, source: 'seed' })
      });
    }
    counts.pnl_reports = 20;

    for (let i = 1; i <= 15; i++) {
      const sourceAmt = rand(500000, 3000000);
      const allocatedAmt = Math.round(sourceAmt * randF(0.7, 1.0));
      const utilizedAmt = Math.round(allocatedAmt * randF(0.3, 0.9));
      await db.insertOne('budget_allocations', {
        company_id: companyId,
        name: `2025 Allocation — ${['Customer','Channel','Product','Region'][i % 4]} ${i}`,
        status: ['approved','active','draft'][i % 3],
        allocation_method: 'top_down',
        source_amount: sourceAmt,
        allocated_amount: allocatedAmt,
        remaining_amount: sourceAmt - allocatedAmt,
        utilized_amount: utilizedAmt,
        utilization_pct: +((utilizedAmt / allocatedAmt) * 100).toFixed(1),
        fiscal_year: 2025,
        dimension: ['customer','channel','product','region'][i % 4],
        currency: 'ZAR',
        data: JSON.stringify({ source: 'seed' })
      });
    }
    counts.budget_allocations = 15;

    for (let i = 1; i <= 30; i++) {
      const daysAgo = rand(0, 365);
      const plannedSpend = rand(20000, 500000);
      const actualSpend = Math.round(plannedSpend * randF(0.6, 1.2));
      const plannedVol = rand(1000, 50000);
      const actualVol = Math.round(plannedVol * randF(0.7, 1.3));
      await db.insertOne('trade_calendar_events', {
        company_id: companyId,
        name: `${['Easter','Summer','Back to School','Black Friday','Christmas','New Year','Mothers Day','Fathers Day','Heritage Day','Valentines'][i % 10]} Event ${Math.ceil(i / 10)}`,
        description: `Planned event for ${pick(custNames) || 'All'}`,
        event_type: ['promotion','campaign','seasonal','holiday','trade_show'][i % 5],
        status: daysAgo > 30 ? 'completed' : daysAgo > 0 ? 'active' : 'planned',
        start_date: dateStr(daysAgo),
        end_date: dateStr(Math.max(0, daysAgo - rand(7, 28))),
        all_day: 1,
        customer_id: pick(custIds),
        customer_name: pick(custNames),
        product_id: pick(prodIds),
        product_name: pick(prodNames),
        planned_spend: plannedSpend,
        actual_spend: actualSpend,
        planned_volume: plannedVol,
        actual_volume: actualVol,
        planned_revenue: rand(100000, 2000000),
        actual_revenue: rand(80000, 2200000),
        color: ['#7C3AED','#2563EB','#DC2626','#059669','#D97706'][i % 5],
        data: JSON.stringify({ source: 'seed' })
      });
    }
    counts.trade_calendar_events = 30;

    try {
      await db.insertOne('demand_signal_sources', {
        company_id: companyId,
        name: 'POS Data Feed — National Retailers',
        source_type: 'pos',
        provider: 'Nielsen IQ',
        frequency: 'weekly',
        status: 'active',
        record_count: 15000,
        last_sync_at: now,
        data: JSON.stringify({ source: 'seed' })
      });
    } catch(e) { }
    for (let i = 1; i <= 40; i++) {
      const wk = rand(1, 52);
      await db.insertOne('demand_signals', {
        company_id: companyId,
        source_name: 'Nielsen IQ',
        signal_type: ['pos_sales','inventory','price_change','promotion_scan','weather'][i % 5],
        customer_id: pick(custIds),
        customer_name: pick(custNames),
        product_id: pick(prodIds),
        product_name: pick(prodNames),
        period_start: `2025-W${String(wk).padStart(2, '0')}`,
        period_end: `2025-W${String(wk + 1).padStart(2, '0')}`,
        units_sold: rand(200, 25000),
        revenue: rand(10000, 800000),
        avg_price: randF(15, 250),
        volume_change_pct: randF(-20, 40),
        price_change_pct: randF(-10, 15),
        data: JSON.stringify({ actual: true, source: 'seed' })
      });
    }
    counts.demand_signals = 40;

    for (let i = 1; i <= 12; i++) {
      const baseRev = rand(300000, 2000000);
      const projRev = Math.round(baseRev * randF(0.9, 1.4));
      await db.insertOne('scenarios', {
        company_id: companyId,
        name: `${['Aggressive Growth','Conservative','Base Case','Price War','Premium Push','Volume Drive'][i % 6]} Scenario ${Math.ceil(i / 6)}`,
        scenario_type: ['promotion','budget','pricing','mix'][i % 4],
        status: ['completed','completed','active','draft'][i % 4],
        customer_id: pick(custIds),
        customer_name: pick(custNames),
        product_id: pick(prodIds),
        product_name: pick(prodNames),
        baseline_revenue: baseRev,
        baseline_units: rand(5000, 50000),
        projected_revenue: projRev,
        projected_units: rand(5500, 60000),
        projected_roi: randF(1.0, 4.0),
        projected_margin_pct: randF(15, 45),
        total_investment: rand(50000, 500000),
        incremental_revenue: projRev - baseRev,
        data: JSON.stringify({ actual: true, source: 'seed', variables: [{ name: 'discount', min: 5, max: 30, value: rand(10, 25) }] })
      });
    }
    counts.scenarios = 12;

    for (let i = 1; i <= 8; i++) {
      await db.insertOne('promotion_optimizations', {
        company_id: companyId,
        name: `${['ROI Maximizer','Spend Optimizer','Volume Optimizer','Margin Protector'][i % 4]} Run ${Math.ceil(i / 4)}`,
        optimization_type: ['roi_maximize','spend_minimize','volume_maximize','margin_protect'][i % 4],
        status: ['completed','completed','running','draft'][i % 4],
        objective: ['maximize_roi','minimize_spend','maximize_volume','maximize_margin'][i % 4],
        customer_id: pick(custIds),
        customer_name: pick(custNames),
        budget_limit: rand(200000, 2000000),
        baseline_revenue: rand(500000, 3000000),
        optimized_spend: rand(100000, 800000),
        optimized_roi: randF(1.5, 4.5),
        optimized_revenue: rand(600000, 3500000),
        improvement_pct: randF(5, 35),
        data: JSON.stringify({ source: 'seed', recommendations: rand(3, 8) })
      });
    }
    counts.promotion_optimizations = 8;

    for (let i = 1; i <= 20; i++) {
      const baseVol = rand(3000, 40000);
      await db.insertOne('baselines', {
        company_id: companyId,
        name: `Baseline — ${pick(prodNames) || 'Product'} @ ${pick(custNames) || 'Customer'}`,
        status: 'active',
        baseline_type: 'volume',
        calculation_method: ['historical_average','moving_average','regression'][i % 3],
        granularity: 'weekly',
        customer_id: pick(custIds),
        product_id: pick(prodIds),
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        base_year: 2024,
        periods_used: 52,
        seasonality_enabled: 1,
        trend_enabled: 1,
        confidence_level: randF(0.78, 0.96),
        total_base_volume: baseVol,
        total_base_revenue: Math.round(baseVol * randF(20, 200)),
        avg_weekly_volume: Math.round(baseVol / 52),
        data: JSON.stringify({ source: 'seed', weeklyData: Array.from({ length: 52 }, (_, w) => ({ week: w + 1, volume: Math.round(baseVol / 52 * randF(0.7, 1.4)) })) })
      });
    }
    counts.baselines = 20;

    for (let i = 1; i <= 30; i++) {
      const accruedAmt = rand(10000, 300000);
      const status = ['active','calculated','settled','draft'][i % 4];
      await db.insertOne('rebates', {
        company_id: companyId,
        customer_id: pick(custIds),
        name: `${['Volume','Growth','Loyalty','Promotional','Tiered'][i % 5]} Rebate ${i}`,
        rebate_type: ['volume','growth','loyalty','promotional','tiered'][i % 5],
        status,
        rate: randF(1, 6),
        rate_type: 'percentage',
        threshold: rand(50000, 500000),
        accrued_amount: accruedAmt,
        settled_amount: status === 'settled' ? accruedAmt : 0,
        calculation_basis: ['revenue','volume','margin'][i % 3],
        settlement_frequency: ['monthly','quarterly','annually'][i % 3],
        start_date: dateStr(rand(90, 365)),
        end_date: dateStr(0),
        data: JSON.stringify({
          targetVolume: rand(50000, 500000), actualVolume: rand(40000, 550000),
          tiers: [{ threshold: 50000, rate: 1.5 }, { threshold: 100000, rate: 2.5 }, { threshold: 200000, rate: 4.0 }]
        })
      });
    }
    counts.rebates = 30;

    for (let i = 1; i <= 20; i++) {
      await db.insertOne('trading_terms', {
        company_id: companyId,
        name: `${pick(custNames) || 'Customer'} — ${['Volume Rebate','Growth Rebate','Listing Fee','Marketing Contribution','Payment Terms'][i % 5]}`,
        term_type: ['volume_rebate','growth_rebate','listing_fee','marketing_contribution','payment_terms'][i % 5],
        status: ['active','active','active','expired','draft'][i % 5],
        customer_id: pick(custIds),
        start_date: dateStr(rand(30, 365)),
        end_date: dateStr(-rand(0, 180)),
        rate: randF(1, 8),
        rate_type: 'percentage',
        threshold: rand(100000, 1000000),
        payment_frequency: ['monthly','quarterly','annually'][i % 3],
        calculation_basis: ['revenue','volume'][i % 2],
        created_by: pick(userIds),
        data: JSON.stringify({ source: 'seed' })
      });
    }
    counts.trading_terms = 20;

    for (let i = 1; i <= 40; i++) {
      const status = ['pending','approved','rejected','cancelled','escalated'][i % 5];
      await db.insertOne('approvals', {
        company_id: companyId,
        entity_type: ['promotion','budget','trade_spend','claim','rebate'][i % 5],
        entity_id: `entity-seed-${i}`,
        entity_name: `${['Promotion','Budget','Trade Spend','Claim','Rebate'][i % 5]} #${rand(1000, 9999)}`,
        amount: rand(10000, 500000),
        status,
        priority: ['normal','normal','high','urgent','low'][i % 5],
        requested_by: pick(userIds),
        requested_at: dateISO(rand(1, 60)),
        assigned_to: pick(userIds),
        approved_by: status === 'approved' ? pick(userIds) : null,
        approved_at: status === 'approved' ? dateISO(rand(0, 30)) : null,
        sla_hours: [24, 48, 72][i % 3],
        data: JSON.stringify({ source: 'seed' })
      });
    }
    counts.approvals = 40;

    for (let i = 1; i <= 12; i++) {
      await db.insertOne('forecasts', {
        company_id: companyId,
        name: `${months[i - 1]} 2025 ${['Revenue','Volume','Demand','Budget'][i % 4]} Forecast`,
        forecast_type: ['revenue','volume','demand','budget'][i % 4],
        status: i <= 10 ? 'active' : 'draft',
        period_type: 'monthly',
        base_year: 2024,
        forecast_year: 2025,
        total_forecast: rand(2000000, 12000000),
        total_actual: rand(1800000, 13000000),
        variance: rand(-500000, 800000),
        variance_percent: randF(-8, 12),
        method: ['historical','growth_rate','ml_predicted'][i % 3],
        confidence_level: randF(0.75, 0.95),
        created_by: pick(userIds),
        data: JSON.stringify({
          monthlyBreakdown: Array.from({ length: 12 }, (_, m) => ({
            month: months[m], forecast: rand(150000, 1200000), actual: rand(140000, 1300000)
          }))
        })
      });
    }
    counts.forecasts = 12;

    for (let i = 1; i <= 50; i++) {
      const amt = rand(5000, 500000);
      const status = ['completed','completed','pending','approved','rejected','processing'][i % 6];
      await db.insertOne('transactions', {
        company_id: companyId,
        transaction_number: `TXN-2025-${String(i).padStart(5, '0')}`,
        transaction_type: ['accrual','settlement','payment','credit_note','debit_note','journal'][i % 6],
        status,
        customer_id: pick(custIds),
        product_id: pick(prodIds),
        amount: amt,
        description: `${['Accrual posting','Settlement payment','Credit note','Debit adjustment','Journal entry','Payment processing'][i % 6]} — ${pick(custNames) || ''}`,
        reference: `REF-${rand(100000, 999999)}`,
        payment_reference: status === 'completed' ? `PAY-${rand(100000, 999999)}` : null,
        created_by: pick(userIds),
        created_at: dateISO(rand(1, 300)),
        data: JSON.stringify({ source: 'seed', glAccount: `4${rand(100, 999)}`, costCenter: `CC-${rand(100, 999)}` })
      });
    }
    counts.transactions = 50;

    for (let i = 1; i <= 10; i++) {
      await db.insertOne('campaigns', {
        company_id: companyId,
        name: `${['Summer Blast','Back to School','Winter Warmers','Holiday Special','Easter Treats','Heritage Month','Black Friday','Christmas Rush','New Year','Valentines'][i % 10]} 2025`,
        campaign_type: ['seasonal','tactical','brand','trade'][i % 4],
        status: i <= 6 ? 'completed' : 'active',
        start_date: dateStr(rand(30, 300)),
        end_date: dateStr(Math.max(0, rand(0, 270))),
        budget_amount: rand(200000, 2000000),
        spent_amount: rand(150000, 1800000),
        target_revenue: rand(1000000, 8000000),
        actual_revenue: rand(900000, 9000000),
        target_volume: rand(10000, 100000),
        actual_volume: rand(9000, 110000),
        created_by: pick(userIds),
        data: JSON.stringify({ source: 'seed', promotionCount: rand(2, 8) })
      });
    }
    counts.campaigns = 10;

    for (let idx = 0; idx < Math.min(custIds.length, 10); idx++) {
      const cid = custIds[idx];
      const totalRev = rand(5000000, 80000000);
      const totalSpendAmt = Math.round(totalRev * randF(0.08, 0.16));
      await db.insertOne('customer_360_profiles', {
        company_id: companyId,
        customer_id: cid,
        customer_name: custNames[idx] || `Customer ${idx}`,
        channel: ['modern_trade','traditional_trade','wholesale','premium'][idx % 4],
        tier: ['platinum','gold','silver','bronze'][idx % 4],
        status: 'active',
        total_revenue: totalRev,
        total_spend: totalSpendAmt,
        total_claims: Math.round(totalSpendAmt * randF(0.05, 0.15)),
        total_deductions: Math.round(totalSpendAmt * randF(0.03, 0.10)),
        net_revenue: totalRev - totalSpendAmt,
        gross_margin_pct: randF(25, 45),
        trade_spend_pct: +((totalSpendAmt / totalRev) * 100).toFixed(1),
        avg_deal_size: rand(50000, 500000),
        promotion_count: rand(5, 25),
        avg_promotion_roi: randF(1.2, 3.8),
        claim_rate_pct: randF(2, 12),
        compliance_score: randF(70, 98),
        growth_rate_pct: randF(-5, 25),
        lifetime_value: totalRev * 3,
        risk_score: rand(5, 85),
        health_score: rand(55, 98),
        ai_segment: ['high_value_growing','high_value_stable','medium_value','at_risk','new'][idx % 5],
        data: JSON.stringify({ source: 'seed', lastUpdated: now })
      });
    }
    counts.customer_360_profiles = Math.min(custIds.length, 10);

    for (let i = 1; i <= 6; i++) {
      await db.insertOne('rgm_initiatives', {
        company_id: companyId,
        name: `${['Price Optimization','Mix Improvement','Volume Growth','Margin Recovery','Trade Spend Efficiency','Channel Expansion'][i - 1]}`,
        initiative_type: ['pricing','mix','volume','margin','efficiency','channel'][i - 1],
        status: ['active','active','completed','planned','active','draft'][i - 1],
        priority: ['high','high','medium','medium','high','low'][i - 1],
        target_revenue: rand(5000000, 30000000),
        actual_revenue: rand(4000000, 32000000),
        target_margin_pct: randF(25, 40),
        actual_margin_pct: randF(22, 42),
        target_growth_pct: randF(5, 20),
        actual_growth_pct: randF(3, 22),
        start_date: dateStr(rand(30, 180)),
        end_date: dateStr(-rand(0, 180)),
        data: JSON.stringify({ source: 'seed' })
      });
    }
    counts.rgm_initiatives = 6;

    const kpis = [
      { name: 'Total Revenue', kpi_type: 'financial', category: 'revenue', unit: 'currency', target: 5000000000, actual: 4850000000 },
      { name: 'Trade Spend %', kpi_type: 'financial', category: 'efficiency', unit: 'percentage', target: 12, actual: 11.5 },
      { name: 'Promotion ROI', kpi_type: 'performance', category: 'roi', unit: 'ratio', target: 2.5, actual: 2.3 },
      { name: 'Budget Utilization', kpi_type: 'financial', category: 'budget', unit: 'percentage', target: 95, actual: 87 },
      { name: 'Claim Settlement Rate', kpi_type: 'operational', category: 'claims', unit: 'percentage', target: 90, actual: 82 },
      { name: 'Deduction Match Rate', kpi_type: 'operational', category: 'deductions', unit: 'percentage', target: 85, actual: 78 },
      { name: 'Customer Retention', kpi_type: 'customer', category: 'retention', unit: 'percentage', target: 95, actual: 93 },
      { name: 'Volume Growth', kpi_type: 'performance', category: 'growth', unit: 'percentage', target: 8, actual: 6.5 },
      { name: 'Gross Margin', kpi_type: 'financial', category: 'margin', unit: 'percentage', target: 35, actual: 33.2 },
      { name: 'Net Trade Cost', kpi_type: 'financial', category: 'cost', unit: 'currency', target: 600000000, actual: 575000000 },
    ];
    for (const kpi of kpis) {
      await db.insertOne('kpi_definitions', {
        company_id: companyId,
        name: kpi.name,
        kpi_type: kpi.kpi_type,
        category: kpi.category,
        unit: kpi.unit,
        direction: 'higher_is_better',
        frequency: 'monthly',
        status: 'active',
        data: JSON.stringify({ source: 'seed' })
      });
    }
    for (let mo = 1; mo <= 12; mo++) {
      for (const kpi of kpis) {
        const moTarget = kpi.unit === 'currency' ? Math.round(kpi.target / 12) : kpi.target;
        const moActual = kpi.unit === 'currency' ? Math.round(kpi.actual / 12 * randF(0.9, 1.1)) : +(kpi.actual * randF(0.92, 1.08)).toFixed(1);
        await db.insertOne('kpi_actuals', {
          company_id: companyId,
          kpi_name: kpi.name,
          period: `2025-${String(mo).padStart(2, '0')}`,
          period_type: 'monthly',
          target_value: moTarget,
          actual_value: moActual,
          variance: moActual - moTarget,
          variance_pct: +(((moActual - moTarget) / moTarget) * 100).toFixed(1),
          status: mo <= 10 ? 'actual' : 'forecast',
          data: JSON.stringify({ source: 'seed' })
        });
      }
    }
    counts.kpi_definitions = kpis.length;
    counts.kpi_actuals = kpis.length * 12;

    for (let i = 1; i <= 8; i++) {
      await db.insertOne('kam_wallets', {
        company_id: companyId,
        user_id: pick(userIds),
        year: 2025,
        quarter: ((i - 1) % 4) + 1,
        allocated_amount: rand(200000, 1500000),
        utilized_amount: rand(100000, 1200000),
        committed_amount: rand(50000, 500000),
        available_amount: rand(10000, 300000),
        status: 'active',
        data: JSON.stringify({ source: 'seed' })
      });
    }
    counts.kam_wallets = 8;

    for (let i = 1; i <= 20; i++) {
      const cat = ['promotion','budget','claim','deduction','approval','system'][i % 6];
      await db.insertOne('notifications', {
        company_id: companyId,
        user_id: pick(userIds),
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} ${['update','alert','reminder','action required','completed'][i % 5]} #${i}`,
        message: `${['Budget utilization at 85%','Promotion approved by Finance','Claim settled successfully','Deduction matched automatically','New approval request','System maintenance'][i % 6]}`,
        notification_type: ['info','warning','success','error','info'][i % 5],
        category: cat,
        priority: ['normal','normal','high','urgent','low'][i % 5],
        status: i <= 12 ? 'unread' : 'read',
        channel: 'in_app',
        data: JSON.stringify({ source: 'seed' }),
        created_at: dateISO(rand(0, 30))
      });
    }
    counts.notifications = 20;

    for (let i = 1; i <= 50; i++) {
      await db.insertOne('activities', {
        company_id: companyId,
        activity_type: ['promotion_created','budget_approved','claim_submitted','settlement_completed','approval_pending','deduction_matched'][i % 6],
        entity_type: ['promotion','budget','claim','settlement','approval','deduction'][i % 6],
        entity_id: `entity-${rand(1, 100)}`,
        description: `${['Created new promotion','Budget approved by Finance','Customer claim submitted','Settlement completed','Approval request pending','Deduction auto-matched'][i % 6]}`,
        user_id: pick(userIds),
        data: JSON.stringify({ source: 'seed' }),
        created_at: dateISO(rand(0, 90))
      });
    }
    counts.activities = 50;

    return c.json({
      success: true,
      message: `Comprehensive seed data created for company ${companyId}`,
      counts,
      totalRecords: Object.values(counts).reduce((s, v) => s + v, 0)
    });
  } catch (error) {
    console.error('Comprehensive seed error:', error);
    return c.json({ success: false, message: error.message, stack: error.stack }, 500);
  }
});

export { seedRoutes };
