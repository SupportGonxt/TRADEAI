import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const advancedReporting = new Hono();

advancedReporting.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

advancedReporting.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      reportCategories: [
        { value: 'trade_spend', label: 'Trade Spend' },
        { value: 'promotion', label: 'Promotion Performance' },
        { value: 'budget', label: 'Budget & Allocation' },
        { value: 'customer', label: 'Customer Analysis' },
        { value: 'product', label: 'Product Performance' },
        { value: 'financial', label: 'Financial / P&L' },
        { value: 'claims', label: 'Claims & Deductions' },
        { value: 'compliance', label: 'Compliance & Audit' },
        { value: 'forecasting', label: 'Forecasting & Predictions' },
        { value: 'general', label: 'General' }
      ],
      reportTypes: [
        { value: 'tabular', label: 'Tabular Report' },
        { value: 'summary', label: 'Summary Report' },
        { value: 'comparison', label: 'Comparison Report' },
        { value: 'trend', label: 'Trend Analysis' },
        { value: 'pivot', label: 'Pivot Table' },
        { value: 'dashboard', label: 'Dashboard View' }
      ],
      dataSources: [
        { value: 'promotions', label: 'Promotions' },
        { value: 'budgets', label: 'Budgets' },
        { value: 'trade_spends', label: 'Trade Spends' },
        { value: 'claims', label: 'Claims' },
        { value: 'deductions', label: 'Deductions' },
        { value: 'settlements', label: 'Settlements' },
        { value: 'accruals', label: 'Accruals' },
        { value: 'customers', label: 'Customers' },
        { value: 'products', label: 'Products' },
        { value: 'pnl_reports', label: 'P&L Reports' },
        { value: 'baselines', label: 'Baselines' },
        { value: 'rebates', label: 'Rebates' }
      ],
      scheduleFrequencies: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' }
      ],
      exportFormats: [
        { value: 'pdf', label: 'PDF' },
        { value: 'csv', label: 'CSV' },
        { value: 'xlsx', label: 'Excel' },
        { value: 'json', label: 'JSON' }
      ]
    }
  });
});

advancedReporting.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const templatesResult = await db.prepare('SELECT COUNT(*) as total FROM report_templates WHERE company_id = ?').bind(companyId).first();
    const activeTemplatesResult = await db.prepare("SELECT COUNT(*) as total FROM report_templates WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const reportsResult = await db.prepare('SELECT COUNT(*) as total FROM saved_reports WHERE company_id = ?').bind(companyId).first();
    const favoritesResult = await db.prepare('SELECT COUNT(*) as total FROM saved_reports WHERE company_id = ? AND is_favorite = 1').bind(companyId).first();
    const schedulesResult = await db.prepare('SELECT COUNT(*) as total FROM report_schedules WHERE company_id = ?').bind(companyId).first();
    const activeSchedulesResult = await db.prepare('SELECT COUNT(*) as total FROM report_schedules WHERE company_id = ? AND is_active = 1').bind(companyId).first();
    const categoryResult = await db.prepare('SELECT report_category, COUNT(*) as count FROM report_templates WHERE company_id = ? GROUP BY report_category').bind(companyId).all();
    const recentResult = await db.prepare('SELECT COUNT(*) as total FROM saved_reports WHERE company_id = ? AND created_at >= datetime("now", "-7 days")').bind(companyId).first();

    return c.json({
      success: true,
      data: {
        templates: { total: templatesResult?.total || 0, active: activeTemplatesResult?.total || 0 },
        reports: { total: reportsResult?.total || 0, favorites: favoritesResult?.total || 0, recentWeek: recentResult?.total || 0 },
        schedules: { total: schedulesResult?.total || 0, active: activeSchedulesResult?.total || 0 },
        byCategory: (categoryResult.results || []).map(r => ({ category: r.report_category, count: r.count }))
      }
    });
  } catch (error) {
    console.error('Error fetching advanced reporting summary:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.get('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { report_category, status, search, sort_by = 'created_at', sort_order = 'desc', limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM report_templates WHERE company_id = ?';
    const params = [companyId];

    if (report_category) { query += ' AND report_category = ?'; params.push(report_category); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const allowedSorts = ['name', 'report_category', 'report_type', 'run_count', 'last_run_at', 'created_at'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM report_templates WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.get('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const template = await db.prepare('SELECT * FROM report_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!template) return c.json({ success: false, message: 'Report template not found' }, 404);

    const recentReports = await db.prepare('SELECT * FROM saved_reports WHERE template_id = ? AND company_id = ? ORDER BY created_at DESC LIMIT 10').bind(id, companyId).all();
    const schedules = await db.prepare('SELECT * FROM report_schedules WHERE template_id = ? AND company_id = ?').bind(id, companyId).all();

    const doc = rowToDocument(template);
    doc.recentReports = (recentReports.results || []).map(rowToDocument);
    doc.schedules = (schedules.results || []).map(rowToDocument);

    return c.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error fetching report template:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.post('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO report_templates (id, company_id, name, description, report_category, report_type, data_source, columns, filters, grouping, sorting, calculations, chart_config, parameters, is_system, is_shared, shared_with, schedule_enabled, schedule_frequency, schedule_day, schedule_time, schedule_recipients, created_by, tags, version, status, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.name || '',
      body.description || '',
      body.reportCategory || body.report_category || 'general',
      body.reportType || body.report_type || 'tabular',
      body.dataSource || body.data_source || 'promotions',
      JSON.stringify(body.columns || []),
      JSON.stringify(body.filters || {}),
      JSON.stringify(body.grouping || []),
      JSON.stringify(body.sorting || []),
      JSON.stringify(body.calculations || []),
      JSON.stringify(body.chartConfig || body.chart_config || {}),
      JSON.stringify(body.parameters || []),
      body.isSystem || body.is_system || 0,
      body.isShared || body.is_shared || 0,
      JSON.stringify(body.sharedWith || body.shared_with || []),
      body.scheduleEnabled || body.schedule_enabled || 0,
      body.scheduleFrequency || body.schedule_frequency || null,
      body.scheduleDay || body.schedule_day || null,
      body.scheduleTime || body.schedule_time || null,
      JSON.stringify(body.scheduleRecipients || body.schedule_recipients || []),
      getUserId(c),
      JSON.stringify(body.tags || []),
      1,
      body.status || 'active',
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM report_templates WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating report template:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.put('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM report_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Report template not found' }, 404);

    const fields = [];
    const params = [];

    const fieldMap = {
      name: 'name', description: 'description', reportCategory: 'report_category',
      reportType: 'report_type', dataSource: 'data_source', status: 'status',
      isShared: 'is_shared', scheduleEnabled: 'schedule_enabled',
      scheduleFrequency: 'schedule_frequency', scheduleDay: 'schedule_day',
      scheduleTime: 'schedule_time', notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    const jsonFields = ['columns', 'filters', 'grouping', 'sorting', 'calculations', 'chartConfig', 'parameters', 'sharedWith', 'scheduleRecipients', 'tags', 'data'];
    const jsonColMap = { chartConfig: 'chart_config', sharedWith: 'shared_with', scheduleRecipients: 'schedule_recipients' };
    for (const f of jsonFields) {
      const col = jsonColMap[f] || f;
      if (body[f] !== undefined) { fields.push(`${col} = ?`); params.push(JSON.stringify(body[f])); }
    }

    fields.push('version = version + 1');
    fields.push('updated_at = ?');
    params.push(now);
    params.push(id, companyId);

    await db.prepare(`UPDATE report_templates SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();

    const updated = await db.prepare('SELECT * FROM report_templates WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating report template:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.delete('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM report_schedules WHERE template_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM saved_reports WHERE template_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM report_templates WHERE id = ? AND company_id = ?').bind(id, companyId).run();

    return c.json({ success: true, message: 'Report template and associated reports/schedules deleted' });
  } catch (error) {
    console.error('Error deleting report template:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.post('/templates/:id/run', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json().catch(() => ({}));

    const template = await db.prepare('SELECT * FROM report_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!template) return c.json({ success: false, message: 'Report template not found' }, 404);

    const startTime = Date.now();
    const dataSource = template.data_source || 'promotions';
    const filtersApplied = body.filters || JSON.parse(template.filters || '{}');

    let reportData = [];
    let summaryData = {};
    let rowCount = 0;

    const sourceTableMap = {
      promotions: 'promotions',
      budgets: 'budgets',
      trade_spends: 'trade_spends',
      claims: 'claims',
      deductions: 'deductions',
      settlements: 'settlements',
      accruals: 'accruals',
      customers: 'customers',
      products: 'products',
      pnl_reports: 'pnl_reports',
      baselines: 'baselines',
      rebates: 'rebates'
    };

    const tableName = sourceTableMap[dataSource] || 'promotions';

    let dataQuery = `SELECT * FROM ${tableName} WHERE company_id = ?`;
    const dataParams = [companyId];

    if (filtersApplied.status) { dataQuery += ' AND status = ?'; dataParams.push(filtersApplied.status); }
    if (filtersApplied.startDate) { dataQuery += ' AND created_at >= ?'; dataParams.push(filtersApplied.startDate); }
    if (filtersApplied.endDate) { dataQuery += ' AND created_at <= ?'; dataParams.push(filtersApplied.endDate); }
    if (filtersApplied.customerId || filtersApplied.customer_id) {
      dataQuery += ' AND customer_id = ?'; dataParams.push(filtersApplied.customerId || filtersApplied.customer_id);
    }

    dataQuery += ' ORDER BY created_at DESC LIMIT 500';

    const dataResult = await db.prepare(dataQuery).bind(...dataParams).all();
    reportData = (dataResult.results || []).map(rowToDocument);
    rowCount = reportData.length;

    const amountFields = ['amount', 'claimed_amount', 'approved_amount', 'settled_amount', 'deduction_amount', 'accrued_amount', 'budget_amount', 'gross_sales', 'net_sales', 'trade_spend'];
    let totalAmount = 0;
    let maxAmount = 0;
    let minAmount = Infinity;

    for (const row of reportData) {
      for (const f of amountFields) {
        const val = row[f] || row[f.replace(/_/g, '')] || 0;
        if (typeof val === 'number' && val > 0) {
          totalAmount += val;
          if (val > maxAmount) maxAmount = val;
          if (val < minAmount) minAmount = val;
          break;
        }
      }
    }

    const statusBreakdown = {};
    for (const row of reportData) {
      const s = row.status || 'unknown';
      statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
    }

    summaryData = {
      totalRows: rowCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
      avgAmount: rowCount > 0 ? Math.round((totalAmount / rowCount) * 100) / 100 : 0,
      maxAmount: maxAmount > 0 ? maxAmount : 0,
      minAmount: minAmount < Infinity ? minAmount : 0,
      statusBreakdown
    };

    const generationTime = Date.now() - startTime;

    const reportId = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO saved_reports (id, company_id, template_id, name, description, report_category, report_type, data_source, status, filters_applied, parameters_applied, columns, row_count, report_data, summary_data, chart_data, generation_time_ms, generated_by, tags, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      reportId, companyId, id,
      `${template.name} — ${now.slice(0, 10)}`,
      template.description || '',
      template.report_category || 'general',
      template.report_type || 'tabular',
      dataSource,
      'completed',
      JSON.stringify(filtersApplied),
      JSON.stringify(body.parameters || {}),
      template.columns || '[]',
      rowCount,
      JSON.stringify(reportData.slice(0, 100)),
      JSON.stringify(summaryData),
      JSON.stringify({}),
      generationTime,
      getUserId(c),
      template.tags || '[]',
      '',
      JSON.stringify({}),
      now, now
    ).run();

    await db.prepare('UPDATE report_templates SET last_run_at = ?, run_count = run_count + 1, updated_at = ? WHERE id = ?').bind(now, now, id).run();

    return c.json({
      success: true,
      data: {
        reportId,
        templateId: id,
        name: `${template.name} — ${now.slice(0, 10)}`,
        rowCount,
        summaryData,
        reportData: reportData.slice(0, 100),
        generationTimeMs: generationTime
      }
    });
  } catch (error) {
    console.error('Error running report template:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.get('/reports', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { report_category, status, template_id, is_favorite, search, sort_by = 'created_at', sort_order = 'desc', limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM saved_reports WHERE company_id = ?';
    const params = [companyId];

    if (report_category) { query += ' AND report_category = ?'; params.push(report_category); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (template_id) { query += ' AND template_id = ?'; params.push(template_id); }
    if (is_favorite === '1') { query += ' AND is_favorite = 1'; }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const allowedSorts = ['name', 'report_category', 'row_count', 'generation_time_ms', 'created_at'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM saved_reports WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(r => {
        const doc = rowToDocument(r);
        delete doc.reportData;
        return doc;
      }),
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching saved reports:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.get('/reports/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const report = await db.prepare('SELECT * FROM saved_reports WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!report) return c.json({ success: false, message: 'Saved report not found' }, 404);

    return c.json({ success: true, data: rowToDocument(report) });
  } catch (error) {
    console.error('Error fetching saved report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.put('/reports/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM saved_reports WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Saved report not found' }, 404);

    const fields = [];
    const params = [];

    const fieldMap = {
      name: 'name', description: 'description', status: 'status',
      isFavorite: 'is_favorite', isShared: 'is_shared', notes: 'notes',
      exportFormat: 'export_format', exportUrl: 'export_url'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    const jsonFields = { sharedWith: 'shared_with', tags: 'tags', data: 'data' };
    for (const [camel, col] of Object.entries(jsonFields)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(JSON.stringify(body[camel])); }
    }

    fields.push('updated_at = ?');
    params.push(now);
    params.push(id, companyId);

    await db.prepare(`UPDATE saved_reports SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();

    const updated = await db.prepare('SELECT * FROM saved_reports WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating saved report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.delete('/reports/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM saved_reports WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Saved report deleted' });
  } catch (error) {
    console.error('Error deleting saved report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.post('/reports/:id/toggle-favorite', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const report = await db.prepare('SELECT is_favorite FROM saved_reports WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!report) return c.json({ success: false, message: 'Saved report not found' }, 404);

    const newVal = report.is_favorite ? 0 : 1;
    await db.prepare('UPDATE saved_reports SET is_favorite = ?, updated_at = ? WHERE id = ?').bind(newVal, new Date().toISOString(), id).run();

    return c.json({ success: true, data: { isFavorite: !!newVal } });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.get('/schedules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { is_active, template_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM report_schedules WHERE company_id = ?';
    const params = [companyId];

    if (is_active !== undefined) { query += ' AND is_active = ?'; params.push(parseInt(is_active)); }
    if (template_id) { query += ' AND template_id = ?'; params.push(template_id); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM report_schedules WHERE company_id = ?').bind(companyId).first();

    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: countResult?.total || 0
    });
  } catch (error) {
    console.error('Error fetching report schedules:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.get('/schedules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const schedule = await db.prepare('SELECT * FROM report_schedules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!schedule) return c.json({ success: false, message: 'Report schedule not found' }, 404);

    return c.json({ success: true, data: rowToDocument(schedule) });
  } catch (error) {
    console.error('Error fetching report schedule:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.post('/schedules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO report_schedules (id, company_id, template_id, name, description, frequency, day_of_week, day_of_month, time_of_day, timezone, recipients, format, filters, parameters, is_active, next_run_at, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.templateId || body.template_id || '',
      body.name || '',
      body.description || '',
      body.frequency || 'weekly',
      body.dayOfWeek || body.day_of_week || null,
      body.dayOfMonth || body.day_of_month || null,
      body.timeOfDay || body.time_of_day || '08:00',
      body.timezone || 'Africa/Johannesburg',
      JSON.stringify(body.recipients || []),
      body.format || 'pdf',
      JSON.stringify(body.filters || {}),
      JSON.stringify(body.parameters || {}),
      body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1,
      body.nextRunAt || body.next_run_at || null,
      getUserId(c),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM report_schedules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating report schedule:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.put('/schedules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM report_schedules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Report schedule not found' }, 404);

    const fields = [];
    const params = [];

    const fieldMap = {
      name: 'name', description: 'description', frequency: 'frequency',
      dayOfWeek: 'day_of_week', dayOfMonth: 'day_of_month', timeOfDay: 'time_of_day',
      timezone: 'timezone', format: 'format', isActive: 'is_active',
      nextRunAt: 'next_run_at', notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    const jsonFields = { recipients: 'recipients', filters: 'filters', parameters: 'parameters', data: 'data' };
    for (const [camel, col] of Object.entries(jsonFields)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(JSON.stringify(body[camel])); }
    }

    fields.push('updated_at = ?');
    params.push(now);
    params.push(id, companyId);

    await db.prepare(`UPDATE report_schedules SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();

    const updated = await db.prepare('SELECT * FROM report_schedules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating report schedule:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.delete('/schedules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM report_schedules WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Report schedule deleted' });
  } catch (error) {
    console.error('Error deleting report schedule:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

advancedReporting.get('/cross-module', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { start_date, end_date } = c.req.query();

    let dateFilter = '';
    const dateParams = [];
    if (start_date) { dateFilter = ' AND created_at >= ?'; dateParams.push(start_date); }
    if (end_date) { dateFilter += ' AND created_at <= ?'; dateParams.push(end_date); }

    const promoResult = await db.prepare(`SELECT COUNT(*) as count, status FROM promotions WHERE company_id = ?${dateFilter} GROUP BY status`).bind(companyId, ...dateParams).all();
    const budgetResult = await db.prepare(`SELECT SUM(amount) as total_budget, SUM(utilized) as total_utilized FROM budgets WHERE company_id = ?${dateFilter}`).bind(companyId, ...dateParams).first();
    const spendResult = await db.prepare(`SELECT SUM(amount) as total_spend, COUNT(*) as count FROM trade_spends WHERE company_id = ?${dateFilter}`).bind(companyId, ...dateParams).first();
    const claimResult = await db.prepare(`SELECT SUM(claimed_amount) as total_claimed, SUM(approved_amount) as total_approved, COUNT(*) as count FROM claims WHERE company_id = ?${dateFilter}`).bind(companyId, ...dateParams).first();
    const deductionResult = await db.prepare(`SELECT SUM(deduction_amount) as total_deductions, SUM(matched_amount) as total_matched, COUNT(*) as count FROM deductions WHERE company_id = ?${dateFilter}`).bind(companyId, ...dateParams).first();
    const settlementResult = await db.prepare(`SELECT SUM(settled_amount) as total_settled, COUNT(*) as count FROM settlements WHERE company_id = ?${dateFilter}`).bind(companyId, ...dateParams).first();

    return c.json({
      success: true,
      data: {
        promotions: {
          byStatus: (promoResult.results || []).reduce((acc, r) => { acc[r.status] = r.count; return acc; }, {}),
          total: (promoResult.results || []).reduce((sum, r) => sum + r.count, 0)
        },
        budgets: {
          totalBudget: budgetResult?.total_budget || 0,
          totalUtilized: budgetResult?.total_utilized || 0,
          utilizationPct: budgetResult?.total_budget > 0 ? Math.round((budgetResult.total_utilized / budgetResult.total_budget) * 10000) / 100 : 0
        },
        tradeSpends: {
          totalSpend: spendResult?.total_spend || 0,
          count: spendResult?.count || 0
        },
        claims: {
          totalClaimed: claimResult?.total_claimed || 0,
          totalApproved: claimResult?.total_approved || 0,
          count: claimResult?.count || 0,
          approvalRate: claimResult?.total_claimed > 0 ? Math.round((claimResult.total_approved / claimResult.total_claimed) * 10000) / 100 : 0
        },
        deductions: {
          totalDeductions: deductionResult?.total_deductions || 0,
          totalMatched: deductionResult?.total_matched || 0,
          count: deductionResult?.count || 0,
          matchRate: deductionResult?.total_deductions > 0 ? Math.round((deductionResult.total_matched / deductionResult.total_deductions) * 10000) / 100 : 0
        },
        settlements: {
          totalSettled: settlementResult?.total_settled || 0,
          count: settlementResult?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching cross-module report:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { advancedReporting as advancedReportingRoutes };
