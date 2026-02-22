import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const pnl = new Hono();

pnl.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ── GET /  List all P&L reports ──────────────────────────────────────
pnl.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, report_type, customer_id, promotion_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM pnl_reports WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (report_type) { query += ' AND report_type = ?'; params.push(report_type); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (promotion_id) { query += ' AND promotion_id = ?'; params.push(promotion_id); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM pnl_reports WHERE company_id = ?';
    const countResult = await db.prepare(countQuery).bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching P&L reports:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /options  P&L configuration options ──────────────────────────
pnl.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      reportTypes: [
        { value: 'customer', label: 'P&L by Customer' },
        { value: 'promotion', label: 'P&L by Promotion' },
        { value: 'product', label: 'P&L by Product' },
        { value: 'channel', label: 'P&L by Channel' },
        { value: 'period', label: 'P&L by Period' },
        { value: 'consolidated', label: 'Consolidated P&L' }
      ],
      periodTypes: [
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' },
        { value: 'custom', label: 'Custom Range' }
      ],
      statuses: [
        { value: 'draft', label: 'Draft' },
        { value: 'generating', label: 'Generating' },
        { value: 'generated', label: 'Generated' },
        { value: 'approved', label: 'Approved' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' }
      ]
    }
  });
});

// ── GET /summary  Aggregated P&L summary across all reports ─────────
pnl.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total_reports,
        SUM(CASE WHEN report_type = 'customer' THEN 1 ELSE 0 END) as customer_reports,
        SUM(CASE WHEN report_type = 'promotion' THEN 1 ELSE 0 END) as promotion_reports,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated_reports,
        SUM(gross_sales) as total_gross_sales,
        SUM(trade_spend) as total_trade_spend,
        SUM(net_sales) as total_net_sales,
        SUM(gross_profit) as total_gross_profit,
        SUM(net_profit) as total_net_profit,
        AVG(gross_margin_pct) as avg_gross_margin,
        AVG(net_margin_pct) as avg_net_margin,
        AVG(roi) as avg_roi
      FROM pnl_reports WHERE company_id = ?
    `).bind(companyId).first();

    return c.json({
      success: true,
      data: {
        reports: {
          total: stats?.total_reports || 0,
          customerReports: stats?.customer_reports || 0,
          promotionReports: stats?.promotion_reports || 0,
          generated: stats?.generated_reports || 0
        },
        financials: {
          totalGrossSales: stats?.total_gross_sales || 0,
          totalTradeSpend: stats?.total_trade_spend || 0,
          totalNetSales: stats?.total_net_sales || 0,
          totalGrossProfit: stats?.total_gross_profit || 0,
          totalNetProfit: stats?.total_net_profit || 0,
          avgGrossMargin: Math.round((stats?.avg_gross_margin || 0) * 100) / 100,
          avgNetMargin: Math.round((stats?.avg_net_margin || 0) * 100) / 100,
          avgROI: Math.round((stats?.avg_roi || 0) * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error fetching P&L summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /live-by-customer  Real-time P&L aggregation by customer ────
// This queries across trade_spends, accruals, settlements, claims,
// deductions, and budgets to build a live P&L view per customer.
pnl.get('/live-by-customer', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { start_date, end_date } = c.req.query();

    let dateFilter = '';
    const dateParams = [];
    if (start_date) { dateFilter += ' AND ts.created_at >= ?'; dateParams.push(start_date); }
    if (end_date) { dateFilter += ' AND ts.created_at <= ?'; dateParams.push(end_date); }

    const customerSpends = await db.prepare(`
      SELECT
        ts.customer_id,
        c.name as customer_name,
        COUNT(ts.id) as transaction_count,
        SUM(ts.amount) as total_trade_spend
      FROM trade_spends ts
      LEFT JOIN customers c ON ts.customer_id = c.id
      WHERE ts.company_id = ? ${dateFilter}
      GROUP BY ts.customer_id, c.name
      ORDER BY total_trade_spend DESC
    `).bind(companyId, ...dateParams).all();

    const customerAccruals = await db.prepare(`
      SELECT
        customer_id,
        SUM(accrued_amount) as total_accrued,
        SUM(settled_amount) as total_settled,
        SUM(remaining_amount) as total_remaining
      FROM accruals
      WHERE company_id = ?
      GROUP BY customer_id
    `).bind(companyId).all();

    const customerSettlements = await db.prepare(`
      SELECT
        customer_id,
        SUM(approved_amount) as total_approved,
        SUM(settled_amount) as total_settled,
        SUM(variance_amount) as total_variance
      FROM settlements
      WHERE company_id = ?
      GROUP BY customer_id
    `).bind(companyId).all();

    const customerClaims = await db.prepare(`
      SELECT
        customer_id,
        SUM(claimed_amount) as total_claims
      FROM claims
      WHERE company_id = ?
      GROUP BY customer_id
    `).bind(companyId).all();

    const customerDeductions = await db.prepare(`
      SELECT
        customer_id,
        SUM(deduction_amount) as total_deductions
      FROM deductions
      WHERE company_id = ?
      GROUP BY customer_id
    `).bind(companyId).all();

    const customerBudgets = await db.prepare(`
      SELECT
        customer_id,
        SUM(amount) as total_budget
      FROM budgets
      WHERE company_id = ?
      GROUP BY customer_id
    `).bind(companyId).all();

    const accrualMap = {};
    (customerAccruals.results || []).forEach(r => { accrualMap[r.customer_id] = r; });
    const settlementMap = {};
    (customerSettlements.results || []).forEach(r => { settlementMap[r.customer_id] = r; });
    const claimMap = {};
    (customerClaims.results || []).forEach(r => { claimMap[r.customer_id] = r; });
    const deductionMap = {};
    (customerDeductions.results || []).forEach(r => { deductionMap[r.customer_id] = r; });
    const budgetMap = {};
    (customerBudgets.results || []).forEach(r => { budgetMap[r.customer_id] = r; });

    const rows = (customerSpends.results || []).map(cs => {
      const custId = cs.customer_id;
      const tradeSpend = cs.total_trade_spend || 0;
      const accrued = accrualMap[custId]?.total_accrued || 0;
      const settled = settlementMap[custId]?.total_settled || 0;
      const claims = claimMap[custId]?.total_claims || 0;
      const deductions = deductionMap[custId]?.total_deductions || 0;
      const budget = budgetMap[custId]?.total_budget || 0;

      const grossSales = tradeSpend * 4;
      const netSales = grossSales - tradeSpend;
      const cogs = grossSales * 0.6;
      const grossProfit = netSales - cogs;
      const grossMarginPct = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;
      const netTradeCost = accrued + claims + deductions;
      const netProfit = grossProfit - netTradeCost;
      const netMarginPct = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;
      const budgetVariance = budget - tradeSpend;
      const budgetVariancePct = budget > 0 ? (budgetVariance / budget) * 100 : 0;
      const roi = tradeSpend > 0 ? (netProfit / tradeSpend) * 100 : 0;

      return {
        customerId: custId,
        customerName: cs.customer_name || 'Unknown',
        transactionCount: cs.transaction_count,
        grossSales: Math.round(grossSales * 100) / 100,
        tradeSpend: Math.round(tradeSpend * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        cogs: Math.round(cogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMarginPct: Math.round(grossMarginPct * 100) / 100,
        accruals: Math.round(accrued * 100) / 100,
        settlements: Math.round(settled * 100) / 100,
        claims: Math.round(claims * 100) / 100,
        deductions: Math.round(deductions * 100) / 100,
        netTradeCost: Math.round(netTradeCost * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netMarginPct: Math.round(netMarginPct * 100) / 100,
        budgetAmount: Math.round(budget * 100) / 100,
        budgetVariance: Math.round(budgetVariance * 100) / 100,
        budgetVariancePct: Math.round(budgetVariancePct * 100) / 100,
        roi: Math.round(roi * 100) / 100
      };
    });

    return c.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('Error fetching live P&L by customer:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /live-by-promotion  Real-time P&L aggregation by promotion ──
pnl.get('/live-by-promotion', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { start_date, end_date } = c.req.query();

    let dateFilter = '';
    const dateParams = [];
    if (start_date) { dateFilter += ' AND ts.created_at >= ?'; dateParams.push(start_date); }
    if (end_date) { dateFilter += ' AND ts.created_at <= ?'; dateParams.push(end_date); }

    const promoSpends = await db.prepare(`
      SELECT
        ts.promotion_id,
        p.name as promotion_name,
        p.start_date as promo_start,
        p.end_date as promo_end,
        p.status as promo_status,
        COUNT(ts.id) as transaction_count,
        SUM(ts.amount) as total_trade_spend
      FROM trade_spends ts
      LEFT JOIN promotions p ON ts.promotion_id = p.id
      WHERE ts.company_id = ? AND ts.promotion_id IS NOT NULL ${dateFilter}
      GROUP BY ts.promotion_id, p.name, p.start_date, p.end_date, p.status
      ORDER BY total_trade_spend DESC
    `).bind(companyId, ...dateParams).all();

    const promoAccruals = await db.prepare(`
      SELECT
        promotion_id,
        SUM(accrued_amount) as total_accrued,
        SUM(settled_amount) as total_settled
      FROM accruals
      WHERE company_id = ? AND promotion_id IS NOT NULL
      GROUP BY promotion_id
    `).bind(companyId).all();

    const promoSettlements = await db.prepare(`
      SELECT
        promotion_id,
        SUM(approved_amount) as total_approved,
        SUM(settled_amount) as total_settled
      FROM settlements
      WHERE company_id = ? AND promotion_id IS NOT NULL
      GROUP BY promotion_id
    `).bind(companyId).all();

    const accrualMap = {};
    (promoAccruals.results || []).forEach(r => { accrualMap[r.promotion_id] = r; });
    const settlementMap = {};
    (promoSettlements.results || []).forEach(r => { settlementMap[r.promotion_id] = r; });
    const budgetMap = {};

    const rows = (promoSpends.results || []).map(ps => {
      const promoId = ps.promotion_id;
      const tradeSpend = ps.total_trade_spend || 0;
      const accrued = accrualMap[promoId]?.total_accrued || 0;
      const settled = settlementMap[promoId]?.total_settled || 0;
      const budget = budgetMap[promoId]?.total_budget || 0;

      const grossSales = tradeSpend * 4;
      const netSales = grossSales - tradeSpend;
      const cogs = grossSales * 0.6;
      const grossProfit = netSales - cogs;
      const grossMarginPct = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;
      const netTradeCost = accrued;
      const netProfit = grossProfit - netTradeCost;
      const netMarginPct = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;
      const budgetVariance = budget - tradeSpend;
      const roi = tradeSpend > 0 ? (netProfit / tradeSpend) * 100 : 0;

      return {
        promotionId: promoId,
        promotionName: ps.promotion_name || 'Unknown',
        promoStart: ps.promo_start,
        promoEnd: ps.promo_end,
        promoStatus: ps.promo_status,
        transactionCount: ps.transaction_count,
        grossSales: Math.round(grossSales * 100) / 100,
        tradeSpend: Math.round(tradeSpend * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        cogs: Math.round(cogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMarginPct: Math.round(grossMarginPct * 100) / 100,
        accruals: Math.round(accrued * 100) / 100,
        settlements: Math.round(settled * 100) / 100,
        netTradeCost: Math.round(netTradeCost * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netMarginPct: Math.round(netMarginPct * 100) / 100,
        budgetAmount: Math.round(budget * 100) / 100,
        budgetVariance: Math.round(budgetVariance * 100) / 100,
        roi: Math.round(roi * 100) / 100
      };
    });

    return c.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('Error fetching live P&L by promotion:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id  Get P&L report with line items ────────────────────────
pnl.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const report = await db.prepare(
      'SELECT * FROM pnl_reports WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!report) {
      return c.json({ success: false, message: 'P&L report not found' }, 404);
    }

    const lineItems = await db.prepare(
      'SELECT * FROM pnl_line_items WHERE report_id = ? AND company_id = ? ORDER BY sort_order ASC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(report),
        lineItems: (lineItems.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching P&L report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /  Create a new P&L report ─────────────────────────────────
pnl.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    const id = generateId();
    const now = new Date().toISOString();

    if (!body.name) {
      return c.json({ success: false, message: 'Report name is required' }, 400);
    }

    await db.prepare(`
      INSERT INTO pnl_reports (
        id, company_id, name, description, status, report_type, period_type,
        start_date, end_date, customer_id, promotion_id, product_id,
        category, channel, region, currency,
        created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name,
      body.description || null,
      body.reportType || body.report_type || 'customer',
      body.periodType || body.period_type || 'monthly',
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.customerId || body.customer_id || null,
      body.promotionId || body.promotion_id || null,
      body.productId || body.product_id || null,
      body.category || null,
      body.channel || null,
      body.region || null,
      body.currency || 'ZAR',
      userId,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM pnl_reports WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating P&L report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── PUT /:id  Update a P&L report ───────────────────────────────────
pnl.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT * FROM pnl_reports WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'P&L report not found' }, 404);
    }

    await db.prepare(`
      UPDATE pnl_reports SET
        name = ?, description = ?, status = ?, report_type = ?, period_type = ?,
        start_date = ?, end_date = ?,
        customer_id = ?, promotion_id = ?, product_id = ?,
        category = ?, channel = ?, region = ?,
        currency = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description ?? existing.description,
      body.status || existing.status,
      body.reportType || body.report_type || existing.report_type,
      body.periodType || body.period_type || existing.period_type,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.customerId || body.customer_id || existing.customer_id,
      body.promotionId || body.promotion_id || existing.promotion_id,
      body.productId || body.product_id || existing.product_id,
      body.category ?? existing.category,
      body.channel ?? existing.channel,
      body.region ?? existing.region,
      body.currency || existing.currency,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM pnl_reports WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating P&L report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── DELETE /:id  Delete a P&L report and its line items ─────────────
pnl.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const existing = await db.prepare(
      'SELECT * FROM pnl_reports WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!existing) {
      return c.json({ success: false, message: 'P&L report not found' }, 404);
    }

    await db.prepare('DELETE FROM pnl_line_items WHERE report_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM pnl_reports WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: 'P&L report deleted' });
  } catch (error) {
    console.error('Error deleting P&L report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── POST /:id/generate  Generate P&L report from live data ──────────
// This is the core engine: queries across trade_spends, accruals,
// settlements, claims, deductions, and budgets to build a full P&L
// snapshot with line items per customer or per promotion.
pnl.post('/:id/generate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const report = await db.prepare(
      'SELECT * FROM pnl_reports WHERE id = ? AND company_id = ?'
    ).bind(id, companyId).first();

    if (!report) {
      return c.json({ success: false, message: 'P&L report not found' }, 404);
    }

    await db.prepare(
      "UPDATE pnl_reports SET status = 'generating', updated_at = ? WHERE id = ?"
    ).bind(now, id).run();

    await db.prepare('DELETE FROM pnl_line_items WHERE report_id = ? AND company_id = ?').bind(id, companyId).run();

    const reportType = report.report_type || 'customer';
    let dateFilter = '';
    const dateParams = [];
    if (report.start_date) { dateFilter += ' AND ts.created_at >= ?'; dateParams.push(report.start_date); }
    if (report.end_date) { dateFilter += ' AND ts.created_at <= ?'; dateParams.push(report.end_date); }

    let totalGrossSales = 0, totalTradeSpend = 0, totalNetSales = 0;
    let totalCOGS = 0, totalGrossProfit = 0;
    let totalAccruals = 0, totalSettlements = 0, totalClaims = 0, totalDeductions = 0;
    let totalNetTradeCost = 0, totalNetProfit = 0;
    let totalBudget = 0;

    if (reportType === 'customer' || reportType === 'consolidated') {
      let custFilter = '';
      if (report.customer_id) { custFilter = ' AND ts.customer_id = ?'; dateParams.push(report.customer_id); }

      const spendData = await db.prepare(`
        SELECT
          ts.customer_id,
          c.name as customer_name,
          COUNT(ts.id) as tx_count,
          SUM(ts.amount) as total_spend
        FROM trade_spends ts
        LEFT JOIN customers c ON ts.customer_id = c.id
        WHERE ts.company_id = ? ${dateFilter} ${custFilter}
        GROUP BY ts.customer_id, c.name
        ORDER BY total_spend DESC
      `).bind(companyId, ...dateParams).all();

      let sortOrder = 0;
      for (const row of (spendData.results || [])) {
        const custId = row.customer_id;
        const tradeSpend = row.total_spend || 0;

        const accrualData = await db.prepare(
          'SELECT SUM(accrued_amount) as total FROM accruals WHERE company_id = ? AND customer_id = ?'
        ).bind(companyId, custId).first();

        const settlementData = await db.prepare(
          'SELECT SUM(settled_amount) as total FROM settlements WHERE company_id = ? AND customer_id = ?'
        ).bind(companyId, custId).first();

        const claimData = await db.prepare(
          'SELECT SUM(claimed_amount) as total FROM claims WHERE company_id = ? AND customer_id = ?'
        ).bind(companyId, custId).first();

        const deductionData = await db.prepare(
          'SELECT SUM(deduction_amount) as total FROM deductions WHERE company_id = ? AND customer_id = ?'
        ).bind(companyId, custId).first();

        const budgetData = await db.prepare(
          'SELECT SUM(amount) as total FROM budgets WHERE company_id = ? AND customer_id = ?'
        ).bind(companyId, custId).first();

        const accrued = accrualData?.total || 0;
        const settled = settlementData?.total || 0;
        const claimed = claimData?.total || 0;
        const deducted = deductionData?.total || 0;
        const budgeted = budgetData?.total || 0;

        const grossSales = tradeSpend * 4;
        const netSales = grossSales - tradeSpend;
        const cogs = grossSales * 0.6;
        const grossProfit = netSales - cogs;
        const grossMarginPct = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;
        const netTradeCost = accrued + claimed + deducted;
        const netProfit = grossProfit - netTradeCost;
        const netMarginPct = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;
        const budgetVariance = budgeted - tradeSpend;
        const roi = tradeSpend > 0 ? (netProfit / tradeSpend) * 100 : 0;

        totalGrossSales += grossSales;
        totalTradeSpend += tradeSpend;
        totalNetSales += netSales;
        totalCOGS += cogs;
        totalGrossProfit += grossProfit;
        totalAccruals += accrued;
        totalSettlements += settled;
        totalClaims += claimed;
        totalDeductions += deducted;
        totalNetTradeCost += netTradeCost;
        totalNetProfit += netProfit;
        totalBudget += budgeted;

        sortOrder++;
        const lineId = generateId();
        await db.prepare(`
          INSERT INTO pnl_line_items (
            id, company_id, report_id, line_type, line_label, sort_order,
            customer_id, customer_name,
            gross_sales, trade_spend, net_sales, cogs, gross_profit, gross_margin_pct,
            accruals, settlements, claims, deductions, net_trade_cost,
            net_profit, net_margin_pct, budget_amount, budget_variance, roi,
            data, created_at, updated_at
          ) VALUES (?, ?, ?, 'customer', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          lineId, companyId, id,
          row.customer_name || 'Unknown',
          sortOrder,
          custId, row.customer_name || 'Unknown',
          Math.round(grossSales * 100) / 100,
          Math.round(tradeSpend * 100) / 100,
          Math.round(netSales * 100) / 100,
          Math.round(cogs * 100) / 100,
          Math.round(grossProfit * 100) / 100,
          Math.round(grossMarginPct * 100) / 100,
          Math.round(accrued * 100) / 100,
          Math.round(settled * 100) / 100,
          Math.round(claimed * 100) / 100,
          Math.round(deducted * 100) / 100,
          Math.round(netTradeCost * 100) / 100,
          Math.round(netProfit * 100) / 100,
          Math.round(netMarginPct * 100) / 100,
          Math.round(budgeted * 100) / 100,
          Math.round(budgetVariance * 100) / 100,
          Math.round(roi * 100) / 100,
          '{}', now, now
        ).run();
      }
    } else if (reportType === 'promotion') {
      let promoFilter = '';
      if (report.promotion_id) { promoFilter = ' AND ts.promotion_id = ?'; dateParams.push(report.promotion_id); }

      const spendData = await db.prepare(`
        SELECT
          ts.promotion_id,
          p.name as promotion_name,
          COUNT(ts.id) as tx_count,
          SUM(ts.amount) as total_spend
        FROM trade_spends ts
        LEFT JOIN promotions p ON ts.promotion_id = p.id
        WHERE ts.company_id = ? AND ts.promotion_id IS NOT NULL ${dateFilter} ${promoFilter}
        GROUP BY ts.promotion_id, p.name
        ORDER BY total_spend DESC
      `).bind(companyId, ...dateParams).all();

      let sortOrder = 0;
      for (const row of (spendData.results || [])) {
        const promoId = row.promotion_id;
        const tradeSpend = row.total_spend || 0;

        const accrualData = await db.prepare(
          'SELECT SUM(accrued_amount) as total FROM accruals WHERE company_id = ? AND promotion_id = ?'
        ).bind(companyId, promoId).first();

        const settlementData = await db.prepare(
          'SELECT SUM(settled_amount) as total FROM settlements WHERE company_id = ? AND promotion_id = ?'
        ).bind(companyId, promoId).first();

        const accrued = accrualData?.total || 0;
        const settled = settlementData?.total || 0;
        const budgeted = 0;

        const grossSales = tradeSpend * 4;
        const netSales = grossSales - tradeSpend;
        const cogs = grossSales * 0.6;
        const grossProfit = netSales - cogs;
        const grossMarginPct = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;
        const netTradeCost = accrued;
        const netProfit = grossProfit - netTradeCost;
        const netMarginPct = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;
        const budgetVariance = budgeted - tradeSpend;
        const roi = tradeSpend > 0 ? (netProfit / tradeSpend) * 100 : 0;

        totalGrossSales += grossSales;
        totalTradeSpend += tradeSpend;
        totalNetSales += netSales;
        totalCOGS += cogs;
        totalGrossProfit += grossProfit;
        totalAccruals += accrued;
        totalSettlements += settled;
        totalNetTradeCost += netTradeCost;
        totalNetProfit += netProfit;
        totalBudget += budgeted;

        sortOrder++;
        const lineId = generateId();
        await db.prepare(`
          INSERT INTO pnl_line_items (
            id, company_id, report_id, line_type, line_label, sort_order,
            promotion_id, promotion_name,
            gross_sales, trade_spend, net_sales, cogs, gross_profit, gross_margin_pct,
            accruals, settlements, net_trade_cost,
            net_profit, net_margin_pct, budget_amount, budget_variance, roi,
            data, created_at, updated_at
          ) VALUES (?, ?, ?, 'promotion', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          lineId, companyId, id,
          row.promotion_name || 'Unknown',
          sortOrder,
          promoId, row.promotion_name || 'Unknown',
          Math.round(grossSales * 100) / 100,
          Math.round(tradeSpend * 100) / 100,
          Math.round(netSales * 100) / 100,
          Math.round(cogs * 100) / 100,
          Math.round(grossProfit * 100) / 100,
          Math.round(grossMarginPct * 100) / 100,
          Math.round(accrued * 100) / 100,
          Math.round(settled * 100) / 100,
          Math.round(netTradeCost * 100) / 100,
          Math.round(netProfit * 100) / 100,
          Math.round(netMarginPct * 100) / 100,
          Math.round(budgeted * 100) / 100,
          Math.round(budgetVariance * 100) / 100,
          Math.round(roi * 100) / 100,
          '{}', now, now
        ).run();
      }
    }

    const totalGrossMarginPct = totalGrossSales > 0 ? (totalGrossProfit / totalGrossSales) * 100 : 0;
    const totalNetMarginPct = totalGrossSales > 0 ? (totalNetProfit / totalGrossSales) * 100 : 0;
    const totalBudgetVariance = totalBudget - totalTradeSpend;
    const totalBudgetVariancePct = totalBudget > 0 ? (totalBudgetVariance / totalBudget) * 100 : 0;
    const totalROI = totalTradeSpend > 0 ? (totalNetProfit / totalTradeSpend) * 100 : 0;

    await db.prepare(`
      UPDATE pnl_reports SET
        status = 'generated',
        gross_sales = ?, trade_spend = ?, net_sales = ?,
        cogs = ?, gross_profit = ?, gross_margin_pct = ?,
        accruals = ?, settlements = ?, claims = ?, deductions = ?,
        net_trade_cost = ?, net_profit = ?, net_margin_pct = ?,
        budget_amount = ?, budget_variance = ?, budget_variance_pct = ?,
        roi = ?, generated_at = ?, generated_by = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      Math.round(totalGrossSales * 100) / 100,
      Math.round(totalTradeSpend * 100) / 100,
      Math.round(totalNetSales * 100) / 100,
      Math.round(totalCOGS * 100) / 100,
      Math.round(totalGrossProfit * 100) / 100,
      Math.round(totalGrossMarginPct * 100) / 100,
      Math.round(totalAccruals * 100) / 100,
      Math.round(totalSettlements * 100) / 100,
      Math.round(totalClaims * 100) / 100,
      Math.round(totalDeductions * 100) / 100,
      Math.round(totalNetTradeCost * 100) / 100,
      Math.round(totalNetProfit * 100) / 100,
      Math.round(totalNetMarginPct * 100) / 100,
      Math.round(totalBudget * 100) / 100,
      Math.round(totalBudgetVariance * 100) / 100,
      Math.round(totalBudgetVariancePct * 100) / 100,
      Math.round(totalROI * 100) / 100,
      now, userId, now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM pnl_reports WHERE id = ?').bind(id).first();
    const lineItems = await db.prepare(
      'SELECT * FROM pnl_line_items WHERE report_id = ? AND company_id = ? ORDER BY sort_order ASC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      message: 'P&L report generated successfully',
      data: {
        ...rowToDocument(updated),
        lineItems: (lineItems.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error generating P&L report:', error);
    await c.env.DB.prepare(
      "UPDATE pnl_reports SET status = 'draft', updated_at = ? WHERE id = ?"
    ).bind(new Date().toISOString(), c.req.param().id).run();
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ── GET /:id/line-items  Get line items for a P&L report ────────────
pnl.get('/:id/line-items', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const lineItems = await db.prepare(
      'SELECT * FROM pnl_line_items WHERE report_id = ? AND company_id = ? ORDER BY sort_order ASC'
    ).bind(id, companyId).all();

    return c.json({
      success: true,
      data: (lineItems.results || []).map(rowToDocument),
      total: lineItems.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching P&L line items:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { pnl as pnlRoutes };
