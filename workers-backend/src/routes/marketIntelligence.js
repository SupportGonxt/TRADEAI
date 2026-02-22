import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const marketIntelligence = new Hono();

marketIntelligence.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
const getUserId = (c) => c.get('userId') || null;

marketIntelligence.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      competitorTypes: [
        { value: 'direct', label: 'Direct Competitor' },
        { value: 'indirect', label: 'Indirect Competitor' },
        { value: 'potential', label: 'Potential Entrant' },
        { value: 'substitute', label: 'Substitute Provider' }
      ],
      threatLevels: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ],
      trendTypes: [
        { value: 'market', label: 'Market Trend' },
        { value: 'consumer', label: 'Consumer Trend' },
        { value: 'pricing', label: 'Pricing Trend' },
        { value: 'channel', label: 'Channel Trend' },
        { value: 'regulatory', label: 'Regulatory Trend' },
        { value: 'technology', label: 'Technology Trend' }
      ],
      directions: [
        { value: 'growing', label: 'Growing' },
        { value: 'stable', label: 'Stable' },
        { value: 'declining', label: 'Declining' },
        { value: 'volatile', label: 'Volatile' }
      ]
    }
  });
});

marketIntelligence.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const competitors = await db.prepare('SELECT COUNT(*) as total FROM competitors WHERE company_id = ?').bind(companyId).first();
    const activeCompetitors = await db.prepare("SELECT COUNT(*) as total FROM competitors WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const marketData = await db.prepare('SELECT COUNT(*) as total FROM market_share_data WHERE company_id = ?').bind(companyId).first();
    const avgShare = await db.prepare('SELECT AVG(company_share_pct) as avg_share FROM market_share_data WHERE company_id = ?').bind(companyId).first();
    const pricePoints = await db.prepare('SELECT COUNT(*) as total FROM competitive_prices WHERE company_id = ?').bind(companyId).first();
    const avgPriceIndex = await db.prepare('SELECT AVG(price_index) as avg_index FROM competitive_prices WHERE company_id = ?').bind(companyId).first();
    const activeTrends = await db.prepare("SELECT COUNT(*) as total FROM market_trends WHERE company_id = ? AND status = 'active'").bind(companyId).first();

    return c.json({
      success: true,
      data: {
        competitors: { total: competitors?.total || 0, active: activeCompetitors?.total || 0 },
        marketShareEntries: marketData?.total || 0,
        avgMarketShare: avgShare?.avg_share || 0,
        pricePoints: pricePoints?.total || 0,
        avgPriceIndex: avgPriceIndex?.avg_index || 100,
        activeTrends: activeTrends?.total || 0
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.get('/competitors', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, threat_level, search, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM competitors WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (threat_level) { query += ' AND threat_level = ?'; params.push(threat_level); }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM competitors WHERE company_id = ?').bind(companyId).first();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: countResult?.total || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.get('/competitors/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const competitor = await db.prepare('SELECT * FROM competitors WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!competitor) return c.json({ success: false, message: 'Competitor not found' }, 404);

    const prices = await db.prepare('SELECT * FROM competitive_prices WHERE competitor_id = ? AND company_id = ? ORDER BY observed_date DESC LIMIT 50').bind(id, companyId).all();
    const shares = await db.prepare('SELECT * FROM market_share_data WHERE competitor_id = ? AND company_id = ? ORDER BY period DESC LIMIT 50').bind(id, companyId).all();

    const doc = rowToDocument(competitor);
    doc.prices = (prices.results || []).map(rowToDocument);
    doc.marketShares = (shares.results || []).map(rowToDocument);

    return c.json({ success: true, data: doc });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.post('/competitors', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO competitors (id, company_id, name, description, competitor_type, status, website, headquarters, annual_revenue, market_share_pct, employee_count, strengths, weaknesses, key_brands, key_categories, key_channels, threat_level, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.name || '', body.description || '',
      body.competitorType || body.competitor_type || 'direct',
      body.status || 'active',
      body.website || null, body.headquarters || null,
      body.annualRevenue || body.annual_revenue || 0,
      body.marketSharePct || body.market_share_pct || 0,
      body.employeeCount || body.employee_count || 0,
      JSON.stringify(body.strengths || []),
      JSON.stringify(body.weaknesses || []),
      JSON.stringify(body.keyBrands || body.key_brands || []),
      JSON.stringify(body.keyCategories || body.key_categories || []),
      JSON.stringify(body.keyChannels || body.key_channels || []),
      body.threatLevel || body.threat_level || 'medium',
      getUserId(c), body.notes || '',
      JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM competitors WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.put('/competitors/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM competitors WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Competitor not found' }, 404);

    const fields = [];
    const params = [];
    const fieldMap = {
      name: 'name', description: 'description', competitorType: 'competitor_type',
      status: 'status', website: 'website', headquarters: 'headquarters',
      annualRevenue: 'annual_revenue', marketSharePct: 'market_share_pct',
      employeeCount: 'employee_count', threatLevel: 'threat_level', notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    const jsonFields = ['strengths', 'weaknesses', 'keyBrands', 'keyCategories', 'keyChannels'];
    const jsonCols = ['strengths', 'weaknesses', 'key_brands', 'key_categories', 'key_channels'];
    jsonFields.forEach((f, i) => {
      if (body[f] !== undefined) { fields.push(`${jsonCols[i]} = ?`); params.push(JSON.stringify(body[f])); }
    });

    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }
    fields.push('updated_at = ?');
    params.push(now, id, companyId);

    await db.prepare(`UPDATE competitors SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM competitors WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.delete('/competitors/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM competitive_prices WHERE competitor_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM market_share_data WHERE competitor_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM competitors WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Competitor and related data deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.get('/market-share', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { category, channel, period, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM market_share_data WHERE company_id = ?';
    const params = [companyId];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (channel) { query += ' AND channel = ?'; params.push(channel); }
    if (period) { query += ' AND period = ?'; params.push(period); }

    query += ' ORDER BY period DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.post('/market-share', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO market_share_data (id, company_id, competitor_id, competitor_name, period, period_start, period_end, category, brand, channel, region, market_size, company_share_pct, company_revenue, competitor_share_pct, competitor_revenue, share_change_pct, volume_share_pct, value_share_pct, growth_rate_pct, market_rank, source, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.competitorId || body.competitor_id || null,
      body.competitorName || body.competitor_name || null,
      body.period || '', body.periodStart || body.period_start || null,
      body.periodEnd || body.period_end || null,
      body.category || null, body.brand || null,
      body.channel || null, body.region || null,
      body.marketSize || body.market_size || 0,
      body.companySharePct || body.company_share_pct || 0,
      body.companyRevenue || body.company_revenue || 0,
      body.competitorSharePct || body.competitor_share_pct || 0,
      body.competitorRevenue || body.competitor_revenue || 0,
      body.shareChangePct || body.share_change_pct || 0,
      body.volumeSharePct || body.volume_share_pct || 0,
      body.valueSharePct || body.value_share_pct || 0,
      body.growthRatePct || body.growth_rate_pct || 0,
      body.marketRank || body.market_rank || null,
      body.source || null, body.notes || '',
      JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM market_share_data WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.delete('/market-share/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM market_share_data WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Market share data deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.get('/prices', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { competitor_id, category, channel, search, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM competitive_prices WHERE company_id = ?';
    const params = [companyId];

    if (competitor_id) { query += ' AND competitor_id = ?'; params.push(competitor_id); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (channel) { query += ' AND channel = ?'; params.push(channel); }
    if (search) { query += ' AND (product_name LIKE ? OR competitor_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY observed_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.post('/prices', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO competitive_prices (id, company_id, competitor_id, competitor_name, product_id, product_name, category, brand, channel, region, our_price, competitor_price, price_index, price_gap_pct, promo_price, promo_depth_pct, shelf_price, observed_date, source, confidence_score, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.competitorId || body.competitor_id || null,
      body.competitorName || body.competitor_name || null,
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.category || null, body.brand || null,
      body.channel || null, body.region || null,
      body.ourPrice || body.our_price || 0,
      body.competitorPrice || body.competitor_price || 0,
      body.priceIndex || body.price_index || 100,
      body.priceGapPct || body.price_gap_pct || 0,
      body.promoPrice || body.promo_price || null,
      body.promoDepthPct || body.promo_depth_pct || 0,
      body.shelfPrice || body.shelf_price || null,
      body.observedDate || body.observed_date || null,
      body.source || null,
      body.confidenceScore || body.confidence_score || 0,
      body.notes || '',
      JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM competitive_prices WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.delete('/prices/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM competitive_prices WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Price data deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.get('/trends', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { trend_type, direction, status, search, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM market_trends WHERE company_id = ?';
    const params = [companyId];

    if (trend_type) { query += ' AND trend_type = ?'; params.push(trend_type); }
    if (direction) { query += ' AND direction = ?'; params.push(direction); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.post('/trends', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO market_trends (id, company_id, name, description, trend_type, category, channel, region, period, period_start, period_end, direction, magnitude, impact_score, confidence_score, affected_categories, affected_brands, opportunities, risks, recommended_actions, source, status, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.name || '', body.description || '',
      body.trendType || body.trend_type || 'market',
      body.category || null, body.channel || null, body.region || null,
      body.period || null, body.periodStart || body.period_start || null,
      body.periodEnd || body.period_end || null,
      body.direction || 'stable', body.magnitude || 'moderate',
      body.impactScore || body.impact_score || 0,
      body.confidenceScore || body.confidence_score || 0,
      JSON.stringify(body.affectedCategories || body.affected_categories || []),
      JSON.stringify(body.affectedBrands || body.affected_brands || []),
      JSON.stringify(body.opportunities || []),
      JSON.stringify(body.risks || []),
      JSON.stringify(body.recommendedActions || body.recommended_actions || []),
      body.source || null, body.status || 'active',
      getUserId(c), body.notes || '',
      JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM market_trends WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

marketIntelligence.delete('/trends/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM market_trends WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Trend deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { marketIntelligence as marketIntelligenceRoutes };
