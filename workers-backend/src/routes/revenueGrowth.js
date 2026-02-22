import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const revenueGrowth = new Hono();

revenueGrowth.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

revenueGrowth.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      initiativeTypes: [
        { value: 'pricing', label: 'Pricing Strategy' },
        { value: 'mix_optimization', label: 'Mix Optimization' },
        { value: 'trade_investment', label: 'Trade Investment' },
        { value: 'distribution', label: 'Distribution Expansion' },
        { value: 'innovation', label: 'Product Innovation' },
        { value: 'pack_price', label: 'Pack-Price Architecture' },
        { value: 'promotion_efficiency', label: 'Promotion Efficiency' },
        { value: 'white_space', label: 'White Space Opportunity' }
      ],
      strategyTypes: [
        { value: 'regular', label: 'Regular Price Change' },
        { value: 'promotional', label: 'Promotional Pricing' },
        { value: 'pack_size', label: 'Pack Size Strategy' },
        { value: 'tiered', label: 'Tiered Pricing' },
        { value: 'value_based', label: 'Value-Based Pricing' },
        { value: 'competitive', label: 'Competitive Response' }
      ],
      analysisTypes: [
        { value: 'product', label: 'Product Mix' },
        { value: 'channel', label: 'Channel Mix' },
        { value: 'customer', label: 'Customer Mix' },
        { value: 'pack_size', label: 'Pack Size Mix' },
        { value: 'brand', label: 'Brand Mix' },
        { value: 'region', label: 'Regional Mix' }
      ],
      priorities: [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ],
      riskLevels: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ],
      metricTypes: [
        { value: 'revenue', label: 'Revenue' },
        { value: 'margin', label: 'Margin' },
        { value: 'volume', label: 'Volume' },
        { value: 'roi', label: 'ROI' },
        { value: 'market_share', label: 'Market Share' }
      ]
    }
  });
});

revenueGrowth.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const initTotal = await db.prepare('SELECT COUNT(*) as total FROM rgm_initiatives WHERE company_id = ?').bind(companyId).first();
    const initActive = await db.prepare("SELECT COUNT(*) as total FROM rgm_initiatives WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const initRevenue = await db.prepare("SELECT SUM(target_revenue) as target, SUM(actual_revenue) as actual FROM rgm_initiatives WHERE company_id = ? AND status IN ('active','completed')").bind(companyId).first();
    const pricingTotal = await db.prepare('SELECT COUNT(*) as total FROM rgm_pricing_strategies WHERE company_id = ?').bind(companyId).first();
    const pricingActive = await db.prepare("SELECT COUNT(*) as total FROM rgm_pricing_strategies WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const mixTotal = await db.prepare('SELECT COUNT(*) as total FROM rgm_mix_analyses WHERE company_id = ?').bind(companyId).first();
    const avgRoi = await db.prepare("SELECT AVG(roi) as avg_roi FROM rgm_initiatives WHERE company_id = ? AND roi > 0").bind(companyId).first();
    const byType = await db.prepare('SELECT initiative_type, COUNT(*) as count FROM rgm_initiatives WHERE company_id = ? GROUP BY initiative_type').bind(companyId).all();

    return c.json({
      success: true,
      data: {
        initiatives: { total: initTotal?.total || 0, active: initActive?.total || 0 },
        revenue: { target: initRevenue?.target || 0, actual: initRevenue?.actual || 0, achievement: initRevenue?.target > 0 ? Math.round((initRevenue.actual / initRevenue.target) * 10000) / 100 : 0 },
        pricing: { total: pricingTotal?.total || 0, active: pricingActive?.total || 0 },
        mixAnalyses: { total: mixTotal?.total || 0 },
        avgRoi: Math.round((avgRoi?.avg_roi || 0) * 100) / 100,
        byType: (byType.results || []).map(r => ({ type: r.initiative_type, count: r.count }))
      }
    });
  } catch (error) {
    console.error('Error fetching RGM summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.get('/initiatives', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { initiative_type, status, priority, search, sort_by = 'created_at', sort_order = 'desc', limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM rgm_initiatives WHERE company_id = ?';
    const params = [companyId];

    if (initiative_type) { query += ' AND initiative_type = ?'; params.push(initiative_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const allowedSorts = ['name', 'initiative_type', 'status', 'priority', 'target_revenue', 'actual_revenue', 'roi', 'start_date', 'created_at'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM rgm_initiatives WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching RGM initiatives:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.get('/initiatives/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const initiative = await db.prepare('SELECT * FROM rgm_initiatives WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!initiative) return c.json({ success: false, message: 'Initiative not found' }, 404);

    const pricingStrategies = await db.prepare('SELECT * FROM rgm_pricing_strategies WHERE initiative_id = ? AND company_id = ? ORDER BY created_at DESC').bind(id, companyId).all();
    const mixAnalyses = await db.prepare('SELECT * FROM rgm_mix_analyses WHERE initiative_id = ? AND company_id = ? ORDER BY created_at DESC').bind(id, companyId).all();
    const growthTrackers = await db.prepare('SELECT * FROM rgm_growth_trackers WHERE initiative_id = ? AND company_id = ? ORDER BY period DESC LIMIT 12').bind(id, companyId).all();

    const doc = rowToDocument(initiative);
    doc.pricingStrategies = (pricingStrategies.results || []).map(rowToDocument);
    doc.mixAnalyses = (mixAnalyses.results || []).map(rowToDocument);
    doc.growthTrackers = (growthTrackers.results || []).map(rowToDocument);

    return c.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error fetching RGM initiative:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.post('/initiatives', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO rgm_initiatives (id, company_id, name, description, initiative_type, status, priority, category, customer_id, customer_name, product_id, product_name, channel, region, brand, start_date, end_date, target_revenue, target_margin_pct, target_growth_pct, baseline_revenue, baseline_margin_pct, investment_amount, confidence_score, risk_level, owner, created_by, tags, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.name || '',
      body.description || '',
      body.initiativeType || body.initiative_type || 'pricing',
      body.status || 'draft',
      body.priority || 'medium',
      body.category || 'general',
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.channel || null,
      body.region || null,
      body.brand || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.targetRevenue || body.target_revenue || 0,
      body.targetMarginPct || body.target_margin_pct || 0,
      body.targetGrowthPct || body.target_growth_pct || 0,
      body.baselineRevenue || body.baseline_revenue || 0,
      body.baselineMarginPct || body.baseline_margin_pct || 0,
      body.investmentAmount || body.investment_amount || 0,
      body.confidenceScore || body.confidence_score || 0,
      body.riskLevel || body.risk_level || 'low',
      body.owner || null,
      getUserId(c),
      JSON.stringify(body.tags || []),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM rgm_initiatives WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating RGM initiative:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.put('/initiatives/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM rgm_initiatives WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Initiative not found' }, 404);

    const fields = [];
    const params = [];

    const fieldMap = {
      name: 'name', description: 'description', initiativeType: 'initiative_type',
      status: 'status', priority: 'priority', category: 'category',
      customerId: 'customer_id', customerName: 'customer_name',
      productId: 'product_id', productName: 'product_name',
      channel: 'channel', region: 'region', brand: 'brand',
      startDate: 'start_date', endDate: 'end_date',
      targetRevenue: 'target_revenue', targetMarginPct: 'target_margin_pct',
      targetGrowthPct: 'target_growth_pct', actualRevenue: 'actual_revenue',
      actualMarginPct: 'actual_margin_pct', actualGrowthPct: 'actual_growth_pct',
      baselineRevenue: 'baseline_revenue', baselineMarginPct: 'baseline_margin_pct',
      investmentAmount: 'investment_amount', roi: 'roi',
      confidenceScore: 'confidence_score', riskLevel: 'risk_level',
      owner: 'owner', approvedBy: 'approved_by', approvedAt: 'approved_at',
      notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(body.tags)); }
    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }

    fields.push('updated_at = ?');
    params.push(now);
    params.push(id, companyId);

    await db.prepare(`UPDATE rgm_initiatives SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();

    const updated = await db.prepare('SELECT * FROM rgm_initiatives WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating RGM initiative:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.delete('/initiatives/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM rgm_growth_trackers WHERE initiative_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM rgm_mix_analyses WHERE initiative_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM rgm_pricing_strategies WHERE initiative_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM rgm_initiatives WHERE id = ? AND company_id = ?').bind(id, companyId).run();

    return c.json({ success: true, message: 'Initiative and associated data deleted' });
  } catch (error) {
    console.error('Error deleting RGM initiative:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.get('/pricing', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { initiative_id, strategy_type, status, sort_by = 'created_at', sort_order = 'desc', limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM rgm_pricing_strategies WHERE company_id = ?';
    const params = [companyId];

    if (initiative_id) { query += ' AND initiative_id = ?'; params.push(initiative_id); }
    if (strategy_type) { query += ' AND strategy_type = ?'; params.push(strategy_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    const allowedSorts = ['name', 'strategy_type', 'current_price', 'recommended_price', 'price_change_pct', 'revenue_impact', 'created_at'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    query += ` ORDER BY ${sortCol} ${sort_order === 'asc' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM rgm_pricing_strategies WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    console.error('Error fetching pricing strategies:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.get('/pricing/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const strategy = await db.prepare('SELECT * FROM rgm_pricing_strategies WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!strategy) return c.json({ success: false, message: 'Pricing strategy not found' }, 404);

    return c.json({ success: true, data: rowToDocument(strategy) });
  } catch (error) {
    console.error('Error fetching pricing strategy:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.post('/pricing', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO rgm_pricing_strategies (id, company_id, initiative_id, name, description, strategy_type, status, product_id, product_name, category, brand, customer_id, customer_name, channel, current_price, recommended_price, price_change_pct, current_margin_pct, projected_margin_pct, price_elasticity, volume_impact_pct, revenue_impact, margin_impact, competitor_price, price_index, effective_date, end_date, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.initiativeId || body.initiative_id || null,
      body.name || '',
      body.description || '',
      body.strategyType || body.strategy_type || 'regular',
      body.status || 'draft',
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.category || null,
      body.brand || null,
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.channel || null,
      body.currentPrice || body.current_price || 0,
      body.recommendedPrice || body.recommended_price || 0,
      body.priceChangePct || body.price_change_pct || 0,
      body.currentMarginPct || body.current_margin_pct || 0,
      body.projectedMarginPct || body.projected_margin_pct || 0,
      body.priceElasticity || body.price_elasticity || 0,
      body.volumeImpactPct || body.volume_impact_pct || 0,
      body.revenueImpact || body.revenue_impact || 0,
      body.marginImpact || body.margin_impact || 0,
      body.competitorPrice || body.competitor_price || 0,
      body.priceIndex || body.price_index || 0,
      body.effectiveDate || body.effective_date || null,
      body.endDate || body.end_date || null,
      getUserId(c),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM rgm_pricing_strategies WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating pricing strategy:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.put('/pricing/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM rgm_pricing_strategies WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Pricing strategy not found' }, 404);

    const fields = [];
    const params = [];

    const fieldMap = {
      name: 'name', description: 'description', strategyType: 'strategy_type',
      status: 'status', productId: 'product_id', productName: 'product_name',
      category: 'category', brand: 'brand', customerId: 'customer_id',
      customerName: 'customer_name', channel: 'channel',
      currentPrice: 'current_price', recommendedPrice: 'recommended_price',
      priceChangePct: 'price_change_pct', currentMarginPct: 'current_margin_pct',
      projectedMarginPct: 'projected_margin_pct', priceElasticity: 'price_elasticity',
      volumeImpactPct: 'volume_impact_pct', revenueImpact: 'revenue_impact',
      marginImpact: 'margin_impact', competitorPrice: 'competitor_price',
      priceIndex: 'price_index', effectiveDate: 'effective_date',
      endDate: 'end_date', approvedBy: 'approved_by', approvedAt: 'approved_at',
      notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }
    fields.push('updated_at = ?');
    params.push(now);
    params.push(id, companyId);

    await db.prepare(`UPDATE rgm_pricing_strategies SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();

    const updated = await db.prepare('SELECT * FROM rgm_pricing_strategies WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating pricing strategy:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.delete('/pricing/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM rgm_pricing_strategies WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Pricing strategy deleted' });
  } catch (error) {
    console.error('Error deleting pricing strategy:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.get('/mix', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { initiative_id, analysis_type, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM rgm_mix_analyses WHERE company_id = ?';
    const params = [companyId];

    if (initiative_id) { query += ' AND initiative_id = ?'; params.push(initiative_id); }
    if (analysis_type) { query += ' AND analysis_type = ?'; params.push(analysis_type); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM rgm_mix_analyses WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    console.error('Error fetching mix analyses:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.post('/mix', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO rgm_mix_analyses (id, company_id, initiative_id, name, description, analysis_type, status, dimension, period_start, period_end, total_revenue, total_volume, total_margin, avg_margin_pct, mix_score, opportunity_value, items, recommendations, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.initiativeId || body.initiative_id || null,
      body.name || '',
      body.description || '',
      body.analysisType || body.analysis_type || 'product',
      body.status || 'completed',
      body.dimension || 'product',
      body.periodStart || body.period_start || null,
      body.periodEnd || body.period_end || null,
      body.totalRevenue || body.total_revenue || 0,
      body.totalVolume || body.total_volume || 0,
      body.totalMargin || body.total_margin || 0,
      body.avgMarginPct || body.avg_margin_pct || 0,
      body.mixScore || body.mix_score || 0,
      body.opportunityValue || body.opportunity_value || 0,
      JSON.stringify(body.items || []),
      JSON.stringify(body.recommendations || []),
      getUserId(c),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM rgm_mix_analyses WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating mix analysis:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.delete('/mix/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM rgm_mix_analyses WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Mix analysis deleted' });
  } catch (error) {
    console.error('Error deleting mix analysis:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.get('/growth-tracking', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { initiative_id, metric_type, dimension, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM rgm_growth_trackers WHERE company_id = ?';
    const params = [companyId];

    if (initiative_id) { query += ' AND initiative_id = ?'; params.push(initiative_id); }
    if (metric_type) { query += ' AND metric_type = ?'; params.push(metric_type); }
    if (dimension) { query += ' AND dimension = ?'; params.push(dimension); }

    query += ' ORDER BY period DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument)
    });
  } catch (error) {
    console.error('Error fetching growth tracking:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.post('/growth-tracking', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    const variance = (body.actualValue || body.actual_value || 0) - (body.targetValue || body.target_value || 0);
    const variancePct = (body.targetValue || body.target_value) > 0 ? Math.round((variance / (body.targetValue || body.target_value)) * 10000) / 100 : 0;
    const priorVal = body.priorValue || body.prior_value || 0;
    const actualVal = body.actualValue || body.actual_value || 0;
    const growthPct = priorVal > 0 ? Math.round(((actualVal - priorVal) / priorVal) * 10000) / 100 : 0;

    await db.prepare(`INSERT INTO rgm_growth_trackers (id, company_id, initiative_id, period, period_start, period_end, metric_type, dimension, dimension_id, dimension_name, target_value, actual_value, prior_value, variance, variance_pct, growth_pct, contribution_pct, trend_direction, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.initiativeId || body.initiative_id || null,
      body.period || '',
      body.periodStart || body.period_start || null,
      body.periodEnd || body.period_end || null,
      body.metricType || body.metric_type || 'revenue',
      body.dimension || 'total',
      body.dimensionId || body.dimension_id || null,
      body.dimensionName || body.dimension_name || null,
      body.targetValue || body.target_value || 0,
      actualVal,
      priorVal,
      variance,
      variancePct,
      growthPct,
      body.contributionPct || body.contribution_pct || 0,
      body.trendDirection || body.trend_direction || 'flat',
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM rgm_growth_trackers WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating growth tracker:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

revenueGrowth.delete('/growth-tracking/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM rgm_growth_trackers WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Growth tracker deleted' });
  } catch (error) {
    console.error('Error deleting growth tracker:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { revenueGrowth as revenueGrowthRoutes };
