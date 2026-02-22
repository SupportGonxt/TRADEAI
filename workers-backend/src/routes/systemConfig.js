import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const config = new Hono();
config.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';

config.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const configStats = await db.prepare('SELECT COUNT(*) as total, COUNT(DISTINCT category) as categories FROM system_config WHERE company_id = ?').bind(companyId).first();
    const tenantStats = await db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM tenants").first();
    return c.json({ success: true, data: { config: configStats, tenants: tenantStats } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      configTypes: [
        { value: 'string', label: 'String' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'json', label: 'JSON' },
        { value: 'secret', label: 'Secret' }
      ],
      categories: [
        { value: 'general', label: 'General' },
        { value: 'security', label: 'Security' },
        { value: 'notifications', label: 'Notifications' },
        { value: 'integrations', label: 'Integrations' },
        { value: 'branding', label: 'Branding' },
        { value: 'workflow', label: 'Workflow' },
        { value: 'reporting', label: 'Reporting' }
      ],
      plans: [
        { value: 'trial', label: 'Trial' },
        { value: 'starter', label: 'Starter' },
        { value: 'standard', label: 'Standard' },
        { value: 'professional', label: 'Professional' },
        { value: 'enterprise', label: 'Enterprise' }
      ]
    }
  });
});

config.get('/configs', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { category, module, limit = 100, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM system_config WHERE company_id = ?';
    const params = [companyId];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (module) { query += ' AND module = ?'; params.push(module); }
    query += ' ORDER BY category ASC, config_key ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM system_config WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0 });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.post('/configs', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.config_key) return c.json({ success: false, message: 'Config key is required' }, 400);
    await db.prepare(`
      INSERT INTO system_config (id, company_id, config_key, config_value, config_type, category, module, description, is_sensitive, is_readonly, default_value, validation_rules, updated_by, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, companyId, body.config_key, body.config_value || null, body.config_type || 'string', body.category || 'general', body.module || null, body.description || null, body.is_sensitive ? 1 : 0, body.is_readonly ? 1 : 0, body.default_value || null, body.validation_rules || null, c.get('userId') || null, JSON.stringify(body.data || {}), now, now).run();
    const created = await db.prepare('SELECT * FROM system_config WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.put('/configs/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM system_config WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Config not found' }, 404);
    if (existing.is_readonly) return c.json({ success: false, message: 'Config is read-only' }, 400);
    await db.prepare('UPDATE system_config SET config_value = ?, description = ?, updated_by = ?, updated_at = ? WHERE id = ?').bind(body.config_value ?? existing.config_value, body.description ?? existing.description, c.get('userId') || null, now, id).run();
    const updated = await db.prepare('SELECT * FROM system_config WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.delete('/configs/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM system_config WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Config not found' }, 404);
    await db.prepare('DELETE FROM system_config WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Config deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.get('/tenants', async (c) => {
  try {
    const db = c.env.DB;
    const { status, plan, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM tenants WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (plan) { query += ' AND plan = ?'; params.push(plan); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM tenants').first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0 });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.post('/tenants', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.name) return c.json({ success: false, message: 'Tenant name is required' }, 400);
    await db.prepare(`
      INSERT INTO tenants (id, name, code, domain, status, plan, max_users, max_storage_gb, features, branding, contact_name, contact_email, contact_phone, billing_email, country, currency, timezone, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, body.name, body.code || null, body.domain || null, body.status || 'active', body.plan || 'standard', body.max_users || 50, body.max_storage_gb || 10, JSON.stringify(body.features || []), JSON.stringify(body.branding || {}), body.contact_name || null, body.contact_email || null, body.contact_phone || null, body.billing_email || null, body.country || null, body.currency || 'ZAR', body.timezone || 'Africa/Johannesburg', body.notes || null, JSON.stringify(body.data || {}), now, now).run();
    const created = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.put('/tenants/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ success: false, message: 'Tenant not found' }, 404);
    await db.prepare(`
      UPDATE tenants SET name = ?, code = ?, domain = ?, status = ?, plan = ?, max_users = ?, max_storage_gb = ?, features = ?, branding = ?, contact_name = ?, contact_email = ?, contact_phone = ?, billing_email = ?, country = ?, currency = ?, timezone = ?, notes = ?, data = ?, updated_at = ? WHERE id = ?
    `).bind(body.name || existing.name, body.code ?? existing.code, body.domain ?? existing.domain, body.status || existing.status, body.plan || existing.plan, body.max_users ?? existing.max_users, body.max_storage_gb ?? existing.max_storage_gb, JSON.stringify(body.features || JSON.parse(existing.features || '[]')), JSON.stringify(body.branding || JSON.parse(existing.branding || '{}')), body.contact_name ?? existing.contact_name, body.contact_email ?? existing.contact_email, body.contact_phone ?? existing.contact_phone, body.billing_email ?? existing.billing_email, body.country ?? existing.country, body.currency || existing.currency, body.timezone || existing.timezone, body.notes ?? existing.notes, JSON.stringify(body.data || JSON.parse(existing.data || '{}')), now, id).run();
    const updated = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

config.delete('/tenants/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ success: false, message: 'Tenant not found' }, 404);
    await db.prepare('DELETE FROM tenants WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Tenant deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

export const systemConfigRoutes = config;
