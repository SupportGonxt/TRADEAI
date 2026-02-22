import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const executiveKpiRoutes = new Hono();
executiveKpiRoutes.use('*', authMiddleware);

const getClient = (c) => getD1Client(c.env.DB);

executiveKpiRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      kpiTypes: [
        { value: 'financial', label: 'Financial' },
        { value: 'operational', label: 'Operational' },
        { value: 'customer', label: 'Customer' },
        { value: 'growth', label: 'Growth' },
        { value: 'trade', label: 'Trade Effectiveness' },
      ],
      categories: [
        { value: 'revenue', label: 'Revenue' },
        { value: 'margin', label: 'Margin' },
        { value: 'spend', label: 'Trade Spend' },
        { value: 'roi', label: 'ROI' },
        { value: 'volume', label: 'Volume' },
        { value: 'compliance', label: 'Compliance' },
        { value: 'satisfaction', label: 'Satisfaction' },
      ],
      frequencies: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annual', label: 'Annual' },
      ],
      directions: [
        { value: 'higher_is_better', label: 'Higher is Better' },
        { value: 'lower_is_better', label: 'Lower is Better' },
        { value: 'target_is_best', label: 'Closer to Target' },
      ],
      ragStatuses: [
        { value: 'green', label: 'Green (On Track)' },
        { value: 'amber', label: 'Amber (At Risk)' },
        { value: 'red', label: 'Red (Off Track)' },
      ],
      scorecardTypes: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annual', label: 'Annual' },
      ],
    },
  });
});

executiveKpiRoutes.get('/summary', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  try {
    const [kpis, targets, actuals, scorecards] = await Promise.all([
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM kpi_definitions WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total FROM kpi_targets WHERE company_id = ? AND status = \'active\'', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, AVG(achievement_pct) as avgAchievement, SUM(CASE WHEN rag_status = \'green\' THEN 1 ELSE 0 END) as greenCount, SUM(CASE WHEN rag_status = \'amber\' THEN 1 ELSE 0 END) as amberCount, SUM(CASE WHEN rag_status = \'red\' THEN 1 ELSE 0 END) as redCount FROM kpi_actuals WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'published\' THEN 1 ELSE 0 END) as published, AVG(overall_score) as avgScore FROM executive_scorecards WHERE company_id = ?', [companyId]),
    ]);
    return c.json({
      success: true,
      data: {
        kpis: kpis.results?.[0] || {},
        targets: targets.results?.[0] || {},
        actuals: actuals.results?.[0] || {},
        scorecards: scorecards.results?.[0] || {},
      },
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// --- KPI Definitions CRUD ---
executiveKpiRoutes.get('/definitions', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', kpiType, category, search } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (kpiType) { where += ' AND kpi_type = ?'; params.push(kpiType); }
    if (category) { where += ' AND category = ?'; params.push(category); }
    if (search) { where += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM kpi_definitions WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM kpi_definitions WHERE ${where} ORDER BY sort_order ASC, name ASC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapDefinitionRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.post('/definitions', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO kpi_definitions (id, company_id, name, description, kpi_type, category, unit, format, calculation_method, data_source, source_table, source_column, aggregation, frequency, direction, threshold_red, threshold_amber, threshold_green, weight, sort_order, is_active, owner, tags, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.name, body.description || null, body.kpiType || 'financial', body.category || 'revenue', body.unit || 'currency', body.format || '#,##0.00', body.calculationMethod || 'sum', body.dataSource || 'manual', body.sourceTable || null, body.sourceColumn || null, body.aggregation || 'sum', body.frequency || 'monthly', body.direction || 'higher_is_better', body.thresholdRed || 0, body.thresholdAmber || 0, body.thresholdGreen || 0, body.weight || 1, body.sortOrder || 0, body.isActive !== false ? 1 : 0, body.owner || null, JSON.stringify(body.tags || []), body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.put('/definitions/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    const fieldMap = { name: 'name', description: 'description', kpiType: 'kpi_type', category: 'category', unit: 'unit', format: 'format', calculationMethod: 'calculation_method', dataSource: 'data_source', sourceTable: 'source_table', sourceColumn: 'source_column', aggregation: 'aggregation', frequency: 'frequency', direction: 'direction', thresholdRed: 'threshold_red', thresholdAmber: 'threshold_amber', thresholdGreen: 'threshold_green', weight: 'weight', sortOrder: 'sort_order', owner: 'owner', notes: 'notes' };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (body[k] !== undefined) { sets.push(`${col} = ?`); params.push(body[k]); }
    }
    if (body.isActive !== undefined) { sets.push('is_active = ?'); params.push(body.isActive ? 1 : 0); }
    if (body.tags) { sets.push('tags = ?'); params.push(JSON.stringify(body.tags)); }
    if (body.data) { sets.push('data = ?'); params.push(JSON.stringify(body.data)); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE kpi_definitions SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.delete('/definitions/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM kpi_definitions WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- KPI Targets CRUD ---
executiveKpiRoutes.get('/targets', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', kpiId, period } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (kpiId) { where += ' AND kpi_id = ?'; params.push(kpiId); }
    if (period) { where += ' AND period = ?'; params.push(period); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM kpi_targets WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM kpi_targets WHERE ${where} ORDER BY period DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapTargetRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.post('/targets', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO kpi_targets (id, company_id, kpi_id, kpi_name, period, period_start, period_end, target_value, stretch_target, floor_value, prior_year_value, budget_value, status, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.kpiId, body.kpiName || null, body.period, body.periodStart || null, body.periodEnd || null, body.targetValue || 0, body.stretchTarget || 0, body.floorValue || 0, body.priorYearValue || 0, body.budgetValue || 0, body.status || 'active', body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.delete('/targets/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM kpi_targets WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- KPI Actuals CRUD ---
executiveKpiRoutes.get('/actuals', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', kpiId, period, ragStatus } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (kpiId) { where += ' AND kpi_id = ?'; params.push(kpiId); }
    if (period) { where += ' AND period = ?'; params.push(period); }
    if (ragStatus) { where += ' AND rag_status = ?'; params.push(ragStatus); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM kpi_actuals WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM kpi_actuals WHERE ${where} ORDER BY period DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapActualRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.post('/actuals', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const variance = (body.actualValue || 0) - (body.targetValue || 0);
    const variancePct = (body.targetValue || 0) !== 0 ? (variance / body.targetValue) * 100 : 0;
    const achievementPct = (body.targetValue || 0) !== 0 ? ((body.actualValue || 0) / body.targetValue) * 100 : 0;
    const ragStatus = achievementPct >= 95 ? 'green' : achievementPct >= 80 ? 'amber' : 'red';
    await db.rawExecute(
      `INSERT INTO kpi_actuals (id, company_id, kpi_id, kpi_name, period, period_start, period_end, actual_value, target_value, variance, variance_pct, achievement_pct, trend_direction, prior_period_value, prior_year_value, yoy_growth_pct, mom_growth_pct, ytd_actual, ytd_target, ytd_achievement_pct, rag_status, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.kpiId, body.kpiName || null, body.period, body.periodStart || null, body.periodEnd || null, body.actualValue || 0, body.targetValue || 0, variance, variancePct, achievementPct, body.trendDirection || 'flat', body.priorPeriodValue || 0, body.priorYearValue || 0, body.yoyGrowthPct || 0, body.momGrowthPct || 0, body.ytdActual || 0, body.ytdTarget || 0, body.ytdAchievementPct || 0, body.ragStatus || ragStatus, body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, variance, variancePct, achievementPct, ragStatus, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.delete('/actuals/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM kpi_actuals WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Executive Scorecards CRUD ---
executiveKpiRoutes.get('/scorecards', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', status, period } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (period) { where += ' AND period = ?'; params.push(period); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM executive_scorecards WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM executive_scorecards WHERE ${where} ORDER BY period DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapScorecardRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.get('/scorecards/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    const result = await db.rawQuery('SELECT * FROM executive_scorecards WHERE id = ? AND company_id = ?', [id, companyId]);
    if (!result.results?.length) return c.json({ success: false, message: 'Not found' }, 404);
    const scorecard = mapScorecardRow(result.results[0]);
    const actuals = await db.rawQuery('SELECT * FROM kpi_actuals WHERE company_id = ? AND period = ? ORDER BY kpi_name ASC', [companyId, scorecard.period]);
    scorecard.kpiActuals = (actuals.results || []).map(mapActualRow);
    return c.json({ success: true, data: scorecard });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.post('/scorecards', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO executive_scorecards (id, company_id, name, description, scorecard_type, status, period, period_start, period_end, overall_score, overall_rag, financial_score, operational_score, customer_score, growth_score, total_kpis, green_count, amber_count, red_count, highlights, lowlights, actions, commentary, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.name, body.description || null, body.scorecardType || 'monthly', body.status || 'draft', body.period, body.periodStart || null, body.periodEnd || null, body.overallScore || 0, body.overallRag || 'green', body.financialScore || 0, body.operationalScore || 0, body.customerScore || 0, body.growthScore || 0, body.totalKpis || 0, body.greenCount || 0, body.amberCount || 0, body.redCount || 0, JSON.stringify(body.highlights || []), JSON.stringify(body.lowlights || []), JSON.stringify(body.actions || []), body.commentary || null, body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.put('/scorecards/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    const fieldMap = { name: 'name', description: 'description', scorecardType: 'scorecard_type', status: 'status', period: 'period', periodStart: 'period_start', periodEnd: 'period_end', overallScore: 'overall_score', overallRag: 'overall_rag', financialScore: 'financial_score', operationalScore: 'operational_score', customerScore: 'customer_score', growthScore: 'growth_score', totalKpis: 'total_kpis', greenCount: 'green_count', amberCount: 'amber_count', redCount: 'red_count', commentary: 'commentary', notes: 'notes' };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (body[k] !== undefined) { sets.push(`${col} = ?`); params.push(body[k]); }
    }
    if (body.highlights) { sets.push('highlights = ?'); params.push(JSON.stringify(body.highlights)); }
    if (body.lowlights) { sets.push('lowlights = ?'); params.push(JSON.stringify(body.lowlights)); }
    if (body.actions) { sets.push('actions = ?'); params.push(JSON.stringify(body.actions)); }
    if (body.data) { sets.push('data = ?'); params.push(JSON.stringify(body.data)); }
    if (body.status === 'published') { sets.push('published_at = ?'); params.push(now); sets.push('published_by = ?'); params.push(c.get('userId') || null); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE executive_scorecards SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

executiveKpiRoutes.delete('/scorecards/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM executive_scorecards WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Row mappers
function mapDefinitionRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, name: r.name, description: r.description,
    kpiType: r.kpi_type, category: r.category, unit: r.unit, format: r.format,
    calculationMethod: r.calculation_method, dataSource: r.data_source,
    sourceTable: r.source_table, sourceColumn: r.source_column, aggregation: r.aggregation,
    frequency: r.frequency, direction: r.direction, thresholdRed: r.threshold_red,
    thresholdAmber: r.threshold_amber, thresholdGreen: r.threshold_green,
    weight: r.weight, sortOrder: r.sort_order, isActive: r.is_active === 1,
    owner: r.owner, tags: JSON.parse(r.tags || '[]'), notes: r.notes,
    data: JSON.parse(r.data || '{}'), createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapTargetRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, kpiId: r.kpi_id, kpiName: r.kpi_name,
    period: r.period, periodStart: r.period_start, periodEnd: r.period_end,
    targetValue: r.target_value, stretchTarget: r.stretch_target,
    floorValue: r.floor_value, priorYearValue: r.prior_year_value,
    budgetValue: r.budget_value, status: r.status, approvedBy: r.approved_by,
    approvedAt: r.approved_at, notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapActualRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, kpiId: r.kpi_id, kpiName: r.kpi_name,
    period: r.period, periodStart: r.period_start, periodEnd: r.period_end,
    actualValue: r.actual_value, targetValue: r.target_value,
    variance: r.variance, variancePct: r.variance_pct,
    achievementPct: r.achievement_pct, trendDirection: r.trend_direction,
    priorPeriodValue: r.prior_period_value, priorYearValue: r.prior_year_value,
    yoyGrowthPct: r.yoy_growth_pct, momGrowthPct: r.mom_growth_pct,
    ytdActual: r.ytd_actual, ytdTarget: r.ytd_target,
    ytdAchievementPct: r.ytd_achievement_pct, ragStatus: r.rag_status,
    notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapScorecardRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, name: r.name, description: r.description,
    scorecardType: r.scorecard_type, status: r.status, period: r.period,
    periodStart: r.period_start, periodEnd: r.period_end,
    overallScore: r.overall_score, overallRag: r.overall_rag,
    financialScore: r.financial_score, operationalScore: r.operational_score,
    customerScore: r.customer_score, growthScore: r.growth_score,
    totalKpis: r.total_kpis, greenCount: r.green_count,
    amberCount: r.amber_count, redCount: r.red_count,
    highlights: JSON.parse(r.highlights || '[]'), lowlights: JSON.parse(r.lowlights || '[]'),
    actions: JSON.parse(r.actions || '[]'), commentary: r.commentary,
    publishedAt: r.published_at, publishedBy: r.published_by,
    notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export { executiveKpiRoutes };
