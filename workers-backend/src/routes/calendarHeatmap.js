import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const calendarHeatmapRoutes = new Hono();
calendarHeatmapRoutes.use('*', authMiddleware);

const getClient = (c) => getD1Client(c.env.DB);

calendarHeatmapRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      eventTypes: [
        { value: 'promotion', label: 'Promotion' },
        { value: 'campaign', label: 'Campaign' },
        { value: 'seasonal', label: 'Seasonal' },
        { value: 'holiday', label: 'Holiday' },
        { value: 'new_product', label: 'New Product Launch' },
        { value: 'price_change', label: 'Price Change' },
      ],
      priorities: [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
      conflictTypes: [
        { value: 'overlap', label: 'Time Overlap' },
        { value: 'same_customer', label: 'Same Customer' },
        { value: 'same_product', label: 'Same Product' },
        { value: 'budget_exceeded', label: 'Budget Exceeded' },
        { value: 'cannibalization', label: 'Cannibalization Risk' },
      ],
      severities: [
        { value: 'critical', label: 'Critical' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Info' },
      ],
      mechanics: [
        { value: 'bogo', label: 'BOGO' },
        { value: 'percent_off', label: '% Off' },
        { value: 'fixed_discount', label: 'Fixed Discount' },
        { value: 'bundle', label: 'Bundle' },
        { value: 'loyalty', label: 'Loyalty Points' },
        { value: 'display', label: 'Display' },
        { value: 'feature', label: 'Feature/Ad' },
      ],
    },
  });
});

calendarHeatmapRoutes.get('/summary', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  try {
    const [events, conflicts, coverage] = await Promise.all([
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'active\' THEN 1 ELSE 0 END) as active, SUM(budget) as totalBudget, AVG(expected_lift) as avgLift FROM calendar_events WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'open\' THEN 1 ELSE 0 END) as openCount, SUM(CASE WHEN severity = \'critical\' THEN 1 ELSE 0 END) as criticalCount FROM calendar_conflicts WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, AVG(coverage_pct) as avgCoverage, SUM(gap_days) as totalGapDays FROM calendar_coverage WHERE company_id = ?', [companyId]),
    ]);
    return c.json({
      success: true,
      data: {
        events: events.results?.[0] || {},
        conflicts: conflicts.results?.[0] || {},
        coverage: coverage.results?.[0] || {},
      },
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// --- Calendar Events CRUD ---
calendarHeatmapRoutes.get('/events', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '100', offset = '0', startDate, endDate, status, customerId, productId, channel, search } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (startDate) { where += ' AND end_date >= ?'; params.push(startDate); }
    if (endDate) { where += ' AND start_date <= ?'; params.push(endDate); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (customerId) { where += ' AND customer_id = ?'; params.push(customerId); }
    if (productId) { where += ' AND product_id = ?'; params.push(productId); }
    if (channel) { where += ' AND channel = ?'; params.push(channel); }
    if (search) { where += ' AND (title LIKE ? OR customer_name LIKE ? OR product_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM calendar_events WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM calendar_events WHERE ${where} ORDER BY start_date ASC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapEventRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.post('/events', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const startDate = body.startDate;
    const endDate = body.endDate;
    const durationDays = startDate && endDate ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)) : 0;
    await db.rawExecute(
      `INSERT INTO calendar_events (id, company_id, promotion_id, promotion_name, event_type, title, description, start_date, end_date, duration_days, customer_id, customer_name, product_id, product_name, category, brand, channel, region, mechanic, status, budget, expected_lift, priority, color, is_recurring, recurrence_pattern, tags, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.promotionId || null, body.promotionName || null, body.eventType || 'promotion', body.title, body.description || null, startDate, endDate, durationDays, body.customerId || null, body.customerName || null, body.productId || null, body.productName || null, body.category || null, body.brand || null, body.channel || null, body.region || null, body.mechanic || null, body.status || 'planned', body.budget || 0, body.expectedLift || 0, body.priority || 'medium', body.color || '#7C3AED', body.isRecurring ? 1 : 0, body.recurrencePattern || null, JSON.stringify(body.tags || []), body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, durationDays, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.put('/events/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    const fieldMap = { promotionId: 'promotion_id', promotionName: 'promotion_name', eventType: 'event_type', title: 'title', description: 'description', startDate: 'start_date', endDate: 'end_date', customerId: 'customer_id', customerName: 'customer_name', productId: 'product_id', productName: 'product_name', category: 'category', brand: 'brand', channel: 'channel', region: 'region', mechanic: 'mechanic', status: 'status', budget: 'budget', expectedLift: 'expected_lift', actualLift: 'actual_lift', priority: 'priority', color: 'color', recurrencePattern: 'recurrence_pattern', notes: 'notes' };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (body[k] !== undefined) { sets.push(`${col} = ?`); params.push(body[k]); }
    }
    if (body.startDate && body.endDate) {
      const dur = Math.max(0, Math.ceil((new Date(body.endDate) - new Date(body.startDate)) / 86400000));
      sets.push('duration_days = ?'); params.push(dur);
    }
    if (body.isRecurring !== undefined) { sets.push('is_recurring = ?'); params.push(body.isRecurring ? 1 : 0); }
    if (body.tags) { sets.push('tags = ?'); params.push(JSON.stringify(body.tags)); }
    if (body.data) { sets.push('data = ?'); params.push(JSON.stringify(body.data)); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE calendar_events SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.delete('/events/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM calendar_events WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Heatmap Data ---
calendarHeatmapRoutes.get('/heatmap', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { year, month } = c.req.query();
  try {
    const y = year || new Date().getFullYear().toString();
    const m = month ? month.padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
    const startDate = `${y}-${m}-01`;
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    const endDate = `${y}-${m}-${lastDay}`;
    const result = await db.rawQuery(
      `SELECT * FROM calendar_events WHERE company_id = ? AND end_date >= ? AND start_date <= ? ORDER BY start_date ASC`,
      [companyId, startDate, endDate]
    );
    const events = (result.results || []).map(mapEventRow);
    const dayCounts = {};
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${y}-${m}-${d.toString().padStart(2, '0')}`;
      dayCounts[dateStr] = { date: dateStr, count: 0, events: [], budget: 0 };
    }
    for (const evt of events) {
      const evtStart = new Date(evt.startDate);
      const evtEnd = new Date(evt.endDate);
      for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${y}-${m}-${d.toString().padStart(2, '0')}`;
        const current = new Date(dateStr);
        if (current >= evtStart && current <= evtEnd) {
          if (dayCounts[dateStr]) {
            dayCounts[dateStr].count++;
            dayCounts[dateStr].events.push({ id: evt.id, title: evt.title, color: evt.color, status: evt.status });
            dayCounts[dateStr].budget += (evt.budget || 0) / (evt.durationDays || 1);
          }
        }
      }
    }
    return c.json({ success: true, data: { year: y, month: m, days: Object.values(dayCounts), events } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Conflicts CRUD ---
calendarHeatmapRoutes.get('/conflicts', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', status, severity } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (severity) { where += ' AND severity = ?'; params.push(severity); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM calendar_conflicts WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM calendar_conflicts WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapConflictRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.post('/conflicts', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO calendar_conflicts (id, company_id, event_a_id, event_a_title, event_b_id, event_b_title, conflict_type, severity, overlap_start, overlap_end, overlap_days, shared_customer, shared_product, shared_channel, impact_description, status, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.eventAId, body.eventATitle || null, body.eventBId, body.eventBTitle || null, body.conflictType || 'overlap', body.severity || 'warning', body.overlapStart || null, body.overlapEnd || null, body.overlapDays || 0, body.sharedCustomer ? 1 : 0, body.sharedProduct ? 1 : 0, body.sharedChannel ? 1 : 0, body.impactDescription || null, body.status || 'open', body.notes || null, JSON.stringify(body.data || {}), now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.put('/conflicts/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    if (body.resolution !== undefined) { sets.push('resolution = ?'); params.push(body.resolution); }
    if (body.status !== undefined) { sets.push('status = ?'); params.push(body.status); }
    if (body.notes !== undefined) { sets.push('notes = ?'); params.push(body.notes); }
    if (body.status === 'resolved') { sets.push('resolved_by = ?'); params.push(c.get('userId') || null); sets.push('resolved_at = ?'); params.push(now); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE calendar_conflicts SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.delete('/conflicts/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM calendar_conflicts WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Coverage Analysis ---
calendarHeatmapRoutes.get('/coverage', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', dimension } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (dimension) { where += ' AND dimension = ?'; params.push(dimension); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM calendar_coverage WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM calendar_coverage WHERE ${where} ORDER BY period_start DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapCoverageRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.post('/coverage', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO calendar_coverage (id, company_id, analysis_period, period_start, period_end, dimension, dimension_id, dimension_name, total_days, covered_days, coverage_pct, gap_days, overlap_days, event_count, total_budget, avg_daily_spend, peak_day, peak_count, gaps, recommendations, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.analysisPeriod, body.periodStart, body.periodEnd, body.dimension || 'overall', body.dimensionId || null, body.dimensionName || null, body.totalDays || 0, body.coveredDays || 0, body.coveragePct || 0, body.gapDays || 0, body.overlapDays || 0, body.eventCount || 0, body.totalBudget || 0, body.avgDailySpend || 0, body.peakDay || null, body.peakCount || 0, JSON.stringify(body.gaps || []), JSON.stringify(body.recommendations || []), body.notes || null, JSON.stringify(body.data || {}), now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

calendarHeatmapRoutes.delete('/coverage/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM calendar_coverage WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Row mappers
function mapEventRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, promotionId: r.promotion_id, promotionName: r.promotion_name,
    eventType: r.event_type, title: r.title, description: r.description,
    startDate: r.start_date, endDate: r.end_date, durationDays: r.duration_days,
    customerId: r.customer_id, customerName: r.customer_name,
    productId: r.product_id, productName: r.product_name,
    category: r.category, brand: r.brand, channel: r.channel, region: r.region,
    mechanic: r.mechanic, status: r.status, budget: r.budget,
    expectedLift: r.expected_lift, actualLift: r.actual_lift,
    priority: r.priority, color: r.color,
    isRecurring: r.is_recurring === 1, recurrencePattern: r.recurrence_pattern,
    overlapCount: r.overlap_count, tags: JSON.parse(r.tags || '[]'),
    notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapConflictRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id,
    eventAId: r.event_a_id, eventATitle: r.event_a_title,
    eventBId: r.event_b_id, eventBTitle: r.event_b_title,
    conflictType: r.conflict_type, severity: r.severity,
    overlapStart: r.overlap_start, overlapEnd: r.overlap_end,
    overlapDays: r.overlap_days, sharedCustomer: r.shared_customer === 1,
    sharedProduct: r.shared_product === 1, sharedChannel: r.shared_channel === 1,
    impactDescription: r.impact_description, resolution: r.resolution,
    resolvedBy: r.resolved_by, resolvedAt: r.resolved_at,
    status: r.status, notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapCoverageRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id,
    analysisPeriod: r.analysis_period, periodStart: r.period_start, periodEnd: r.period_end,
    dimension: r.dimension, dimensionId: r.dimension_id, dimensionName: r.dimension_name,
    totalDays: r.total_days, coveredDays: r.covered_days, coveragePct: r.coverage_pct,
    gapDays: r.gap_days, overlapDays: r.overlap_days, eventCount: r.event_count,
    totalBudget: r.total_budget, avgDailySpend: r.avg_daily_spend,
    peakDay: r.peak_day, peakCount: r.peak_count,
    gaps: JSON.parse(r.gaps || '[]'), recommendations: JSON.parse(r.recommendations || '[]'),
    notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export { calendarHeatmapRoutes };
