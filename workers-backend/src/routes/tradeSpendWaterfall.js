import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const tradeSpendWaterfallRoutes = new Hono();
tradeSpendWaterfallRoutes.use('*', authMiddleware);

function mapAnalysisRow(r) {
  return {
    id: r.id, companyId: r.company_id, name: r.name, description: r.description,
    analysisType: r.analysis_type, period: r.period, periodStart: r.period_start,
    periodEnd: r.period_end, dimension: r.dimension, dimensionId: r.dimension_id,
    dimensionName: r.dimension_name, baseRevenue: r.base_revenue, grossRevenue: r.gross_revenue,
    netRevenue: r.net_revenue, totalTradeSpend: r.total_trade_spend, tradeSpendPct: r.trade_spend_pct,
    totalSteps: r.total_steps, currency: r.currency, status: r.status, tags: r.tags,
    notes: r.notes, data: r.data, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at
  };
}

function mapStepRow(r) {
  return {
    id: r.id, companyId: r.company_id, analysisId: r.analysis_id, stepOrder: r.step_order,
    stepType: r.step_type, label: r.label, description: r.description, amount: r.amount,
    percentage: r.percentage, cumulativeAmount: r.cumulative_amount, cumulativePct: r.cumulative_pct,
    startValue: r.start_value, endValue: r.end_value, color: r.color, category: r.category,
    subCategory: r.sub_category, source: r.source, isSubtotal: r.is_subtotal, notes: r.notes,
    data: r.data, createdAt: r.created_at, updatedAt: r.updated_at
  };
}

function mapDecompRow(r) {
  return {
    id: r.id, companyId: r.company_id, analysisId: r.analysis_id, name: r.name,
    period: r.period, periodStart: r.period_start, periodEnd: r.period_end,
    spendType: r.spend_type, category: r.category, subCategory: r.sub_category,
    customerId: r.customer_id, customerName: r.customer_name, productId: r.product_id,
    productName: r.product_name, channel: r.channel, region: r.region,
    grossAmount: r.gross_amount, netAmount: r.net_amount, pctOfTotal: r.pct_of_total,
    pctOfRevenue: r.pct_of_revenue, roi: r.roi, volumeImpact: r.volume_impact,
    incrementalRevenue: r.incremental_revenue, effectivenessScore: r.effectiveness_score,
    benchmark: r.benchmark, varianceToBenchmark: r.variance_to_benchmark,
    trendDirection: r.trend_direction, priorPeriodAmount: r.prior_period_amount,
    yoyChangePct: r.yoy_change_pct, notes: r.notes, data: r.data,
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at
  };
}

tradeSpendWaterfallRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      analysisTypes: ['trade_spend', 'promotion_roi', 'customer_profitability', 'channel_effectiveness'],
      dimensions: ['overall', 'customer', 'product', 'channel', 'region', 'brand', 'category'],
      stepTypes: ['addition', 'deduction', 'subtotal', 'net'],
      spendTypes: ['trade_promotion', 'off_invoice', 'billback', 'rebate', 'scan_allowance', 'display_allowance', 'slotting_fee', 'coop_advertising', 'other'],
      statuses: ['draft', 'in_progress', 'completed', 'archived']
    }
  });
});

tradeSpendWaterfallRoutes.get('/summary', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  try {
    const analyses = await db.rawQuery('SELECT COUNT(*) as count FROM waterfall_analyses WHERE company_id = ?', [companyId]);
    const completed = await db.rawQuery('SELECT COUNT(*) as count FROM waterfall_analyses WHERE company_id = ? AND status = ?', [companyId, 'completed']);
    const decomps = await db.rawQuery('SELECT COUNT(*) as count FROM spend_decompositions WHERE company_id = ?', [companyId]);
    const totalSpend = await db.rawQuery('SELECT COALESCE(SUM(total_trade_spend), 0) as total FROM waterfall_analyses WHERE company_id = ?', [companyId]);
    return c.json({
      success: true,
      data: {
        totalAnalyses: analyses.results?.[0]?.count || 0,
        completedAnalyses: completed.results?.[0]?.count || 0,
        totalDecompositions: decomps.results?.[0]?.count || 0,
        totalTradeSpend: totalSpend.results?.[0]?.total || 0
      }
    });
  } catch (e) {
    return c.json({ success: true, data: { totalAnalyses: 0, completedAnalyses: 0, totalDecompositions: 0, totalTradeSpend: 0 } });
  }
});

tradeSpendWaterfallRoutes.get('/analyses', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { status, dimension, limit = '50', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM waterfall_analyses WHERE company_id = ?';
  const params = [companyId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (dimension) { sql += ' AND dimension = ?'; params.push(dimension); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapAnalysisRow) });
});

tradeSpendWaterfallRoutes.post('/analyses', async (c) => {
  const companyId = c.get('user')?.companyId;
  const userId = c.get('user')?.userId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const tradeSpendPct = body.grossRevenue ? ((body.totalTradeSpend || 0) / body.grossRevenue * 100) : 0;
  await db.rawExecute(
    `INSERT INTO waterfall_analyses (id, company_id, name, description, analysis_type, period, period_start, period_end, dimension, dimension_id, dimension_name, base_revenue, gross_revenue, net_revenue, total_trade_spend, trade_spend_pct, total_steps, currency, status, tags, notes, data, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.name, body.description || null, body.analysisType || 'trade_spend', body.period || null, body.periodStart, body.periodEnd, body.dimension || 'overall', body.dimensionId || null, body.dimensionName || null, body.baseRevenue || 0, body.grossRevenue || 0, body.netRevenue || 0, body.totalTradeSpend || 0, tradeSpendPct, body.totalSteps || 0, body.currency || 'ZAR', body.status || 'draft', JSON.stringify(body.tags || []), body.notes || null, JSON.stringify(body.data || {}), userId]
  );
  return c.json({ success: true, data: { id, ...body, companyId, tradeSpendPct } }, 201);
});

tradeSpendWaterfallRoutes.put('/analyses/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  const body = await c.req.json();
  const tradeSpendPct = body.grossRevenue ? ((body.totalTradeSpend || 0) / body.grossRevenue * 100) : 0;
  await db.rawExecute(
    `UPDATE waterfall_analyses SET name = ?, description = ?, analysis_type = ?, period = ?, period_start = ?, period_end = ?, dimension = ?, dimension_id = ?, dimension_name = ?, base_revenue = ?, gross_revenue = ?, net_revenue = ?, total_trade_spend = ?, trade_spend_pct = ?, total_steps = ?, currency = ?, status = ?, tags = ?, notes = ?, data = ?, updated_at = datetime('now') WHERE id = ? AND company_id = ?`,
    [body.name, body.description || null, body.analysisType || 'trade_spend', body.period || null, body.periodStart, body.periodEnd, body.dimension || 'overall', body.dimensionId || null, body.dimensionName || null, body.baseRevenue || 0, body.grossRevenue || 0, body.netRevenue || 0, body.totalTradeSpend || 0, tradeSpendPct, body.totalSteps || 0, body.currency || 'ZAR', body.status || 'draft', JSON.stringify(body.tags || []), body.notes || null, JSON.stringify(body.data || {}), id, companyId]
  );
  return c.json({ success: true, data: { id, ...body, tradeSpendPct } });
});

tradeSpendWaterfallRoutes.delete('/analyses/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM waterfall_steps WHERE analysis_id = ? AND company_id = ?', [id, companyId]);
  await db.rawExecute('DELETE FROM spend_decompositions WHERE analysis_id = ? AND company_id = ?', [id, companyId]);
  await db.rawExecute('DELETE FROM waterfall_analyses WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

tradeSpendWaterfallRoutes.get('/steps', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { analysisId, limit = '100', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM waterfall_steps WHERE company_id = ?';
  const params = [companyId];
  if (analysisId) { sql += ' AND analysis_id = ?'; params.push(analysisId); }
  sql += ' ORDER BY step_order ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapStepRow) });
});

tradeSpendWaterfallRoutes.post('/steps', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO waterfall_steps (id, company_id, analysis_id, step_order, step_type, label, description, amount, percentage, cumulative_amount, cumulative_pct, start_value, end_value, color, category, sub_category, source, is_subtotal, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.analysisId, body.stepOrder || 0, body.stepType || 'deduction', body.label, body.description || null, body.amount || 0, body.percentage || 0, body.cumulativeAmount || 0, body.cumulativePct || 0, body.startValue || 0, body.endValue || 0, body.color || '#3B82F6', body.category || null, body.subCategory || null, body.source || null, body.isSubtotal ? 1 : 0, body.notes || null, JSON.stringify(body.data || {})]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

tradeSpendWaterfallRoutes.delete('/steps/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM waterfall_steps WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

tradeSpendWaterfallRoutes.get('/decompositions', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { analysisId, spendType, channel, limit = '100', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM spend_decompositions WHERE company_id = ?';
  const params = [companyId];
  if (analysisId) { sql += ' AND analysis_id = ?'; params.push(analysisId); }
  if (spendType) { sql += ' AND spend_type = ?'; params.push(spendType); }
  if (channel) { sql += ' AND channel = ?'; params.push(channel); }
  sql += ' ORDER BY gross_amount DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapDecompRow) });
});

tradeSpendWaterfallRoutes.post('/decompositions', async (c) => {
  const companyId = c.get('user')?.companyId;
  const userId = c.get('user')?.userId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO spend_decompositions (id, company_id, analysis_id, name, period, period_start, period_end, spend_type, category, sub_category, customer_id, customer_name, product_id, product_name, channel, region, gross_amount, net_amount, pct_of_total, pct_of_revenue, roi, volume_impact, incremental_revenue, effectiveness_score, benchmark, variance_to_benchmark, trend_direction, prior_period_amount, yoy_change_pct, notes, data, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.analysisId || null, body.name, body.period || null, body.periodStart || null, body.periodEnd || null, body.spendType || 'trade_promotion', body.category || null, body.subCategory || null, body.customerId || null, body.customerName || null, body.productId || null, body.productName || null, body.channel || null, body.region || null, body.grossAmount || 0, body.netAmount || 0, body.pctOfTotal || 0, body.pctOfRevenue || 0, body.roi || 0, body.volumeImpact || 0, body.incrementalRevenue || 0, body.effectivenessScore || 0, body.benchmark || 0, body.varianceToBenchmark || 0, body.trendDirection || 'flat', body.priorPeriodAmount || 0, body.yoyChangePct || 0, body.notes || null, JSON.stringify(body.data || {}), userId]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

tradeSpendWaterfallRoutes.delete('/decompositions/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM spend_decompositions WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

export { tradeSpendWaterfallRoutes };
