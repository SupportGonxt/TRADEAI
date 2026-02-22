import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const notif = new Hono();
notif.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
const getUserId = (c) => c.get('userId') || null;

notif.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const stats = await db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN priority = 'high' OR priority = 'critical' THEN 1 ELSE 0 END) as high_priority
      FROM notifications WHERE company_id = ?
    `).bind(companyId).first();
    const ruleStats = await db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM alert_rules WHERE company_id = ?").bind(companyId).first();
    const alertStats = await db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'triggered' THEN 1 ELSE 0 END) as triggered FROM alert_history WHERE company_id = ?").bind(companyId).first();
    return c.json({ success: true, data: { notifications: stats, rules: ruleStats, alerts: alertStats } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      notificationTypes: [
        { value: 'info', label: 'Information' },
        { value: 'warning', label: 'Warning' },
        { value: 'error', label: 'Error' },
        { value: 'success', label: 'Success' }
      ],
      categories: [
        { value: 'system', label: 'System' },
        { value: 'approval', label: 'Approval' },
        { value: 'alert', label: 'Alert' },
        { value: 'promotion', label: 'Promotion' },
        { value: 'budget', label: 'Budget' },
        { value: 'claim', label: 'Claim' }
      ],
      priorities: [
        { value: 'low', label: 'Low' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ],
      severities: [
        { value: 'info', label: 'Info' },
        { value: 'warning', label: 'Warning' },
        { value: 'critical', label: 'Critical' }
      ],
      ruleTypes: [
        { value: 'threshold', label: 'Threshold' },
        { value: 'trend', label: 'Trend' },
        { value: 'anomaly', label: 'Anomaly' },
        { value: 'schedule', label: 'Schedule' }
      ]
    }
  });
});

notif.get('/notifications', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, category, priority, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM notifications WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.post('/notifications', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO notifications (id, company_id, user_id, title, message, notification_type, category, priority, status, source_entity_type, source_entity_id, source_entity_name, action_url, action_label, channel, notes, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unread', ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, companyId, getUserId(c), body.title, body.message || null, body.notification_type || 'info', body.category || 'system', body.priority || 'normal', body.source_entity_type || null, body.source_entity_id || null, body.source_entity_name || null, body.action_url || null, body.action_label || null, body.channel || 'in_app', body.notes || null, JSON.stringify(body.data || {}), now).run();
    const created = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.put('/notifications/:id/read', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const now = new Date().toISOString();
    await db.prepare("UPDATE notifications SET status = 'read', read_at = ? WHERE id = ?").bind(now, id).run();
    return c.json({ success: true, message: 'Marked as read' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.put('/notifications/:id/dismiss', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const now = new Date().toISOString();
    await db.prepare("UPDATE notifications SET status = 'dismissed', dismissed_at = ? WHERE id = ?").bind(now, id).run();
    return c.json({ success: true, message: 'Dismissed' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.put('/notifications/mark-all-read', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const now = new Date().toISOString();
    await db.prepare("UPDATE notifications SET status = 'read', read_at = ? WHERE company_id = ? AND status = 'unread'").bind(now, companyId).run();
    return c.json({ success: true, message: 'All marked as read' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.delete('/notifications/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    await db.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.get('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { rule_type, category, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM alert_rules WHERE company_id = ?';
    const params = [companyId];
    if (rule_type) { query += ' AND rule_type = ?'; params.push(rule_type); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.post('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO alert_rules (id, company_id, name, description, rule_type, category, entity_type, metric, operator, threshold_value, threshold_unit, severity, is_active, frequency, cooldown_minutes, recipients, channels, conditions, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, companyId, body.name, body.description || null, body.rule_type || 'threshold', body.category || 'system', body.entity_type || null, body.metric || null, body.operator || '>', body.threshold_value || 0, body.threshold_unit || null, body.severity || 'warning', body.frequency || 'daily', body.cooldown_minutes || 60, JSON.stringify(body.recipients || []), JSON.stringify(body.channels || ['in_app']), JSON.stringify(body.conditions || {}), body.notes || null, JSON.stringify(body.data || {}), getUserId(c), now, now).run();
    const created = await db.prepare('SELECT * FROM alert_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.put('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM alert_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);
    await db.prepare(`UPDATE alert_rules SET name = ?, description = ?, rule_type = ?, category = ?, entity_type = ?, metric = ?, operator = ?, threshold_value = ?, threshold_unit = ?, severity = ?, is_active = ?, frequency = ?, cooldown_minutes = ?, notes = ?, data = ?, updated_at = ? WHERE id = ?`).bind(body.name || existing.name, body.description ?? existing.description, body.rule_type || existing.rule_type, body.category || existing.category, body.entity_type ?? existing.entity_type, body.metric ?? existing.metric, body.operator || existing.operator, body.threshold_value ?? existing.threshold_value, body.threshold_unit ?? existing.threshold_unit, body.severity || existing.severity, body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active, body.frequency || existing.frequency, body.cooldown_minutes ?? existing.cooldown_minutes, body.notes ?? existing.notes, JSON.stringify(body.data || JSON.parse(existing.data || '{}')), now, id).run();
    const updated = await db.prepare('SELECT * FROM alert_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.delete('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    await db.prepare('DELETE FROM alert_rules WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Rule deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.get('/history', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { severity, status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM alert_history WHERE company_id = ?';
    const params = [companyId];
    if (severity) { query += ' AND severity = ?'; params.push(severity); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.post('/history', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO alert_history (id, company_id, rule_id, rule_name, alert_type, severity, title, message, entity_type, entity_id, entity_name, metric_value, threshold_value, status, notes, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'triggered', ?, ?, ?)`).bind(id, companyId, body.rule_id || null, body.rule_name || null, body.alert_type || 'threshold', body.severity || 'warning', body.title, body.message || null, body.entity_type || null, body.entity_id || null, body.entity_name || null, body.metric_value || null, body.threshold_value || null, body.notes || null, JSON.stringify(body.data || {}), now).run();
    const created = await db.prepare('SELECT * FROM alert_history WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.put('/history/:id/acknowledge', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const now = new Date().toISOString();
    await db.prepare("UPDATE alert_history SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ? WHERE id = ?").bind(getUserId(c), now, id).run();
    return c.json({ success: true, message: 'Acknowledged' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.put('/history/:id/resolve', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    const now = new Date().toISOString();
    await db.prepare("UPDATE alert_history SET status = 'resolved', resolved_by = ?, resolved_at = ? WHERE id = ?").bind(getUserId(c), now, id).run();
    return c.json({ success: true, message: 'Resolved' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

notif.delete('/history/:id', async (c) => {
  try {
    const db = c.env.DB;
    const { id } = c.req.param();
    await db.prepare('DELETE FROM alert_history WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

export const notificationCenterRoutes = notif;
