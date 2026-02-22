import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const pricingMargin = new Hono();

pricingMargin.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

pricingMargin.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      modelTypes: [
        { value: 'cost_plus', label: 'Cost Plus' },
        { value: 'value_based', label: 'Value Based' },
        { value: 'competitive', label: 'Competitive' },
        { value: 'dynamic', label: 'Dynamic' },
        { value: 'penetration', label: 'Penetration' },
        { value: 'premium', label: 'Premium' },
        { value: 'bundle', label: 'Bundle Pricing' }
      ],
      analysisTypes: [
        { value: 'product_margin', label: 'Product Margin' },
        { value: 'customer_margin', label: 'Customer Margin' },
        { value: 'channel_margin', label: 'Channel Margin' },
        { value: 'category_margin', label: 'Category Margin' },
        { value: 'brand_margin', label: 'Brand Margin' },
        { value: 'trade_waterfall', label: 'Trade Waterfall' }
      ],
      recommendationTypes: [
        { value: 'price_increase', label: 'Price Increase' },
        { value: 'price_decrease', label: 'Price Decrease' },
        { value: 'margin_improvement', label: 'Margin Improvement' },
        { value: 'trade_spend_optimization', label: 'Trade Spend Optimization' },
        { value: 'mix_optimization', label: 'Mix Optimization' }
      ],
      priorities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    }
  });
});

pricingMargin.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const models = await db.prepare('SELECT COUNT(*) as total FROM pricing_models WHERE company_id = ?').bind(companyId).first();
    const activeModels = await db.prepare("SELECT COUNT(*) as total FROM pricing_models WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const analyses = await db.prepare('SELECT COUNT(*) as total FROM margin_analyses WHERE company_id = ?').bind(companyId).first();
    const avgMargin = await db.prepare('SELECT AVG(gross_margin_pct) as avg_margin FROM margin_analyses WHERE company_id = ?').bind(companyId).first();
    const recommendations = await db.prepare("SELECT COUNT(*) as total FROM pricing_recommendations WHERE company_id = ? AND status = 'pending'").bind(companyId).first();
    const totalImpact = await db.prepare("SELECT COALESCE(SUM(revenue_impact), 0) as total FROM pricing_recommendations WHERE company_id = ? AND status = 'pending'").bind(companyId).first();

    return c.json({
      success: true,
      data: {
        models: { total: models?.total || 0, active: activeModels?.total || 0 },
        analyses: analyses?.total || 0,
        avgGrossMargin: avgMargin?.avg_margin || 0,
        pendingRecommendations: recommendations?.total || 0,
        totalRevenueImpact: totalImpact?.total || 0
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.get('/models', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, model_type, search, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM pricing_models WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (model_type) { query += ' AND model_type = ?'; params.push(model_type); }
    if (search) { query += ' AND (name LIKE ? OR product_name LIKE ? OR customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM pricing_models WHERE company_id = ?').bind(companyId).first();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: countResult?.total || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.get('/models/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const model = await db.prepare('SELECT * FROM pricing_models WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!model) return c.json({ success: false, message: 'Pricing model not found' }, 404);

    const waterfall = await db.prepare('SELECT * FROM price_waterfall_items WHERE pricing_model_id = ? AND company_id = ? ORDER BY step_order').bind(id, companyId).all();
    const recommendations = await db.prepare('SELECT * FROM pricing_recommendations WHERE model_id = ? AND company_id = ? ORDER BY created_at DESC').bind(id, companyId).all();

    const doc = rowToDocument(model);
    doc.waterfall = (waterfall.results || []).map(rowToDocument);
    doc.recommendations = (recommendations.results || []).map(rowToDocument);

    return c.json({ success: true, data: doc });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.post('/models', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO pricing_models (id, company_id, name, description, model_type, status, product_id, product_name, category, brand, customer_id, customer_name, channel, region, base_cost, target_margin_pct, list_price, net_price, floor_price, ceiling_price, current_price, recommended_price, price_elasticity, volume_sensitivity, competitor_avg_price, market_position, currency, effective_date, end_date, owner, created_by, tags, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.name || '',
      body.description || '',
      body.modelType || body.model_type || 'cost_plus',
      body.status || 'draft',
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.category || null,
      body.brand || null,
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.channel || null,
      body.region || null,
      body.baseCost || body.base_cost || 0,
      body.targetMarginPct || body.target_margin_pct || 0,
      body.listPrice || body.list_price || 0,
      body.netPrice || body.net_price || 0,
      body.floorPrice || body.floor_price || 0,
      body.ceilingPrice || body.ceiling_price || 0,
      body.currentPrice || body.current_price || 0,
      body.recommendedPrice || body.recommended_price || 0,
      body.priceElasticity || body.price_elasticity || 0,
      body.volumeSensitivity || body.volume_sensitivity || 0,
      body.competitorAvgPrice || body.competitor_avg_price || 0,
      body.marketPosition || body.market_position || 'parity',
      body.currency || 'ZAR',
      body.effectiveDate || body.effective_date || null,
      body.endDate || body.end_date || null,
      body.owner || null,
      getUserId(c),
      JSON.stringify(body.tags || []),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM pricing_models WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.put('/models/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM pricing_models WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Pricing model not found' }, 404);

    const fields = [];
    const params = [];
    const fieldMap = {
      name: 'name', description: 'description', modelType: 'model_type',
      status: 'status', productName: 'product_name', customerName: 'customer_name',
      channel: 'channel', region: 'region', baseCost: 'base_cost',
      targetMarginPct: 'target_margin_pct', listPrice: 'list_price',
      netPrice: 'net_price', floorPrice: 'floor_price', ceilingPrice: 'ceiling_price',
      currentPrice: 'current_price', recommendedPrice: 'recommended_price',
      priceElasticity: 'price_elasticity', volumeSensitivity: 'volume_sensitivity',
      competitorAvgPrice: 'competitor_avg_price', marketPosition: 'market_position',
      effectiveDate: 'effective_date', endDate: 'end_date', owner: 'owner', notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(body.tags)); }
    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }
    fields.push('updated_at = ?');
    params.push(now, id, companyId);

    await db.prepare(`UPDATE pricing_models SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM pricing_models WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.delete('/models/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM pricing_recommendations WHERE model_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM price_waterfall_items WHERE pricing_model_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM pricing_models WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Pricing model and related data deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.get('/analyses', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { analysis_type, dimension, search, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM margin_analyses WHERE company_id = ?';
    const params = [companyId];

    if (analysis_type) { query += ' AND analysis_type = ?'; params.push(analysis_type); }
    if (dimension) { query += ' AND dimension = ?'; params.push(dimension); }
    if (search) { query += ' AND (name LIKE ? OR product_name LIKE ? OR customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.post('/analyses', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO margin_analyses (id, company_id, name, description, analysis_type, status, dimension, product_id, product_name, category, brand, customer_id, customer_name, channel, region, period_start, period_end, gross_sales, trade_spend, net_sales, cogs, gross_profit, gross_margin_pct, trade_margin_pct, net_margin_pct, contribution_margin, contribution_margin_pct, volume, avg_selling_price, avg_cost, target_margin_pct, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.name || '',
      body.description || '',
      body.analysisType || body.analysis_type || 'product_margin',
      body.status || 'active',
      body.dimension || 'product',
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.category || null,
      body.brand || null,
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.channel || null,
      body.region || null,
      body.periodStart || body.period_start || null,
      body.periodEnd || body.period_end || null,
      body.grossSales || body.gross_sales || 0,
      body.tradeSpend || body.trade_spend || 0,
      body.netSales || body.net_sales || 0,
      body.cogs || 0,
      body.grossProfit || body.gross_profit || 0,
      body.grossMarginPct || body.gross_margin_pct || 0,
      body.tradeMarginPct || body.trade_margin_pct || 0,
      body.netMarginPct || body.net_margin_pct || 0,
      body.contributionMargin || body.contribution_margin || 0,
      body.contributionMarginPct || body.contribution_margin_pct || 0,
      body.volume || 0,
      body.avgSellingPrice || body.avg_selling_price || 0,
      body.avgCost || body.avg_cost || 0,
      body.targetMarginPct || body.target_margin_pct || 0,
      getUserId(c),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM margin_analyses WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.delete('/analyses/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM price_waterfall_items WHERE analysis_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM margin_analyses WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Analysis deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.get('/waterfall', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { analysis_id, pricing_model_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM price_waterfall_items WHERE company_id = ?';
    const params = [companyId];

    if (analysis_id) { query += ' AND analysis_id = ?'; params.push(analysis_id); }
    if (pricing_model_id) { query += ' AND pricing_model_id = ?'; params.push(pricing_model_id); }

    query += ' ORDER BY step_order ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.post('/waterfall', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO price_waterfall_items (id, company_id, analysis_id, pricing_model_id, product_id, product_name, customer_id, customer_name, period, step_order, step_name, step_type, amount, pct_of_list, running_total, running_margin_pct, benchmark_amount, variance, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.analysisId || body.analysis_id || null,
      body.pricingModelId || body.pricing_model_id || null,
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.period || null,
      body.stepOrder || body.step_order || 0,
      body.stepName || body.step_name || '',
      body.stepType || body.step_type || 'deduction',
      body.amount || 0,
      body.pctOfList || body.pct_of_list || 0,
      body.runningTotal || body.running_total || 0,
      body.runningMarginPct || body.running_margin_pct || 0,
      body.benchmarkAmount || body.benchmark_amount || 0,
      body.variance || 0,
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM price_waterfall_items WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.delete('/waterfall/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM price_waterfall_items WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Waterfall item deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.get('/recommendations', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { model_id, status, recommendation_type, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM pricing_recommendations WHERE company_id = ?';
    const params = [companyId];

    if (model_id) { query += ' AND model_id = ?'; params.push(model_id); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (recommendation_type) { query += ' AND recommendation_type = ?'; params.push(recommendation_type); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.post('/recommendations', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO pricing_recommendations (id, company_id, model_id, recommendation_type, priority, status, product_id, product_name, customer_id, customer_name, channel, current_price, recommended_price, price_change_pct, current_margin_pct, projected_margin_pct, revenue_impact, margin_impact, volume_impact_pct, confidence_score, risk_level, rationale, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.modelId || body.model_id || null,
      body.recommendationType || body.recommendation_type || 'price_increase',
      body.priority || 'medium',
      body.status || 'pending',
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.channel || null,
      body.currentPrice || body.current_price || 0,
      body.recommendedPrice || body.recommended_price || 0,
      body.priceChangePct || body.price_change_pct || 0,
      body.currentMarginPct || body.current_margin_pct || 0,
      body.projectedMarginPct || body.projected_margin_pct || 0,
      body.revenueImpact || body.revenue_impact || 0,
      body.marginImpact || body.margin_impact || 0,
      body.volumeImpactPct || body.volume_impact_pct || 0,
      body.confidenceScore || body.confidence_score || 0,
      body.riskLevel || body.risk_level || 'low',
      body.rationale || null,
      getUserId(c),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM pricing_recommendations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

pricingMargin.delete('/recommendations/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM pricing_recommendations WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Recommendation deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { pricingMargin as pricingMarginRoutes };
