import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const hub = new Hono();
hub.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';

hub.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const stats = await db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
        SUM(CASE WHEN sync_status = 'syncing' THEN 1 ELSE 0 END) as syncing
      FROM integrations WHERE company_id = ?
    `).bind(companyId).first();
    return c.json({ success: true, data: stats });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

hub.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      integrationTypes: [
        { value: 'api', label: 'REST API' },
        { value: 'webhook', label: 'Webhook' },
        { value: 'file', label: 'File Import' },
        { value: 'database', label: 'Database' },
        { value: 'oauth', label: 'OAuth 2.0' }
      ],
      providers: [
        { value: 'sap', label: 'SAP' },
        { value: 'oracle', label: 'Oracle' },
        { value: 'dynamics365', label: 'Microsoft Dynamics 365' },
        { value: 'salesforce', label: 'Salesforce' },
        { value: 'azure_ad', label: 'Azure AD' },
        { value: 'custom', label: 'Custom' }
      ],
      categories: [
        { value: 'erp', label: 'ERP' },
        { value: 'crm', label: 'CRM' },
        { value: 'identity', label: 'Identity' },
        { value: 'analytics', label: 'Analytics' },
        { value: 'communication', label: 'Communication' },
        { value: 'other', label: 'Other' }
      ],
      syncFrequencies: [
        { value: 'real_time', label: 'Real-time' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'manual', label: 'Manual' }
      ]
    }
  });
});

hub.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { category, status, provider, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM integrations WHERE company_id = ?';
    const params = [companyId];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (provider) { query += ' AND provider = ?'; params.push(provider); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM integrations WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0 });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

hub.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const item = await db.prepare('SELECT * FROM integrations WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!item) return c.json({ success: false, message: 'Integration not found' }, 404);
    return c.json({ success: true, data: item });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

hub.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.name) return c.json({ success: false, message: 'Name is required' }, 400);
    await db.prepare(`
      INSERT INTO integrations (id, company_id, name, description, integration_type, provider, category, status, config, credentials, endpoint_url, auth_type, sync_frequency, created_by, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, companyId, body.name, body.description || null, body.integration_type || 'api', body.provider || 'custom', body.category || 'erp', body.status || 'inactive', JSON.stringify(body.config || {}), JSON.stringify(body.credentials || {}), body.endpoint_url || null, body.auth_type || 'api_key', body.sync_frequency || 'manual', c.get('userId') || null, body.notes || null, JSON.stringify(body.data || {}), now, now).run();
    const created = await db.prepare('SELECT * FROM integrations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

hub.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM integrations WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Integration not found' }, 404);
    await db.prepare(`
      UPDATE integrations SET name = ?, description = ?, integration_type = ?, provider = ?, category = ?, status = ?, config = ?, endpoint_url = ?, auth_type = ?, sync_frequency = ?, notes = ?, data = ?, updated_at = ? WHERE id = ?
    `).bind(body.name || existing.name, body.description ?? existing.description, body.integration_type || existing.integration_type, body.provider || existing.provider, body.category || existing.category, body.status || existing.status, JSON.stringify(body.config || JSON.parse(existing.config || '{}')), body.endpoint_url ?? existing.endpoint_url, body.auth_type || existing.auth_type, body.sync_frequency || existing.sync_frequency, body.notes ?? existing.notes, JSON.stringify(body.data || JSON.parse(existing.data || '{}')), now, id).run();
    const updated = await db.prepare('SELECT * FROM integrations WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

hub.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM integrations WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Integration not found' }, 404);
    await db.prepare('DELETE FROM integration_logs WHERE integration_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM integrations WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Integration deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

hub.post('/:id/sync', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    const integration = await db.prepare('SELECT * FROM integrations WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!integration) return c.json({ success: false, message: 'Integration not found' }, 404);
    await db.prepare("UPDATE integrations SET sync_status = 'syncing', updated_at = ? WHERE id = ?").bind(now, id).run();
    const logId = generateId();
    await db.prepare(`INSERT INTO integration_logs (id, company_id, integration_id, log_type, action, status, records_processed, duration_ms, created_at) VALUES (?, ?, ?, 'info', 'sync', 'success', 0, 0, ?)`).bind(logId, companyId, id, now).run();
    await db.prepare("UPDATE integrations SET sync_status = 'idle', last_sync_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id).run();
    return c.json({ success: true, message: 'Sync completed' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

hub.get('/:id/logs', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const { limit = 50, offset = 0 } = c.req.query();
    const result = await db.prepare('SELECT * FROM integration_logs WHERE integration_id = ? AND company_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(id, companyId, parseInt(limit), parseInt(offset)).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

export const integrationHubRoutes = hub;
