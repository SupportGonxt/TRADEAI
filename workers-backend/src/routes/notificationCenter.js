import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const notificationCenterRoutes = new Hono();
notificationCenterRoutes.use('*', authMiddleware);

function mapNotificationRow(r) {
  return {
    id: r.id, companyId: r.company_id, userId: r.user_id, title: r.title, message: r.message,
    notificationType: r.notification_type, category: r.category, priority: r.priority, status: r.status,
    sourceEntityType: r.source_entity_type, sourceEntityId: r.source_entity_id, sourceEntityName: r.source_entity_name,
    actionUrl: r.action_url, actionLabel: r.action_label, readAt: r.read_at, dismissedAt: r.dismissed_at,
    expiresAt: r.expires_at, channel: r.channel, sentViaEmail: r.sent_via_email, sentViaSms: r.sent_via_sms,
    notes: r.notes, data: r.data, createdAt: r.created_at
  };
}

function mapRuleRow(r) {
  return {
    id: r.id, companyId: r.company_id, name: r.name, description: r.description,
    ruleType: r.rule_type, category: r.category, entityType: r.entity_type, metric: r.metric,
    operator: r.operator, thresholdValue: r.threshold_value, thresholdUnit: r.threshold_unit,
    severity: r.severity, isActive: r.is_active, frequency: r.frequency,
    cooldownMinutes: r.cooldown_minutes, lastTriggeredAt: r.last_triggered_at, triggerCount: r.trigger_count,
    recipients: r.recipients, channels: r.channels, conditions: r.conditions,
    notes: r.notes, data: r.data, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at
  };
}

function mapHistoryRow(r) {
  return {
    id: r.id, companyId: r.company_id, ruleId: r.rule_id, ruleName: r.rule_name,
    alertType: r.alert_type, severity: r.severity, title: r.title, message: r.message,
    entityType: r.entity_type, entityId: r.entity_id, entityName: r.entity_name,
    metricValue: r.metric_value, thresholdValue: r.threshold_value, status: r.status,
    acknowledgedBy: r.acknowledged_by, acknowledgedAt: r.acknowledged_at,
    resolvedBy: r.resolved_by, resolvedAt: r.resolved_at,
    notes: r.notes, data: r.data, createdAt: r.created_at
  };
}

notificationCenterRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      notificationTypes: ['info', 'warning', 'error', 'success', 'action_required'],
      categories: ['system', 'budget', 'promotion', 'claim', 'deduction', 'approval', 'settlement', 'alert'],
      priorities: ['low', 'normal', 'high', 'urgent'],
      statuses: ['unread', 'read', 'dismissed', 'archived'],
      channels: ['in_app', 'email', 'sms'],
      ruleTypes: ['threshold', 'anomaly', 'schedule', 'event', 'composite'],
      operators: ['greater_than', 'less_than', 'equals', 'not_equals', 'between', 'contains'],
      frequencies: ['real_time', 'hourly', 'daily', 'weekly'],
      severities: ['info', 'warning', 'critical'],
      alertStatuses: ['active', 'acknowledged', 'resolved', 'expired']
    }
  });
});

notificationCenterRoutes.get('/summary', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  try {
    const notifs = await db.rawQuery('SELECT COUNT(*) as count FROM notifications WHERE company_id = ?', [companyId]);
    const unread = await db.rawQuery('SELECT COUNT(*) as count FROM notifications WHERE company_id = ? AND status = ?', [companyId, 'unread']);
    const rules = await db.rawQuery('SELECT COUNT(*) as count FROM alert_rules WHERE company_id = ?', [companyId]);
    const activeAlerts = await db.rawQuery('SELECT COUNT(*) as count FROM alert_history WHERE company_id = ? AND status = ?', [companyId, 'active']);
    return c.json({
      success: true,
      data: {
        totalNotifications: notifs.results?.[0]?.count || 0,
        unreadCount: unread.results?.[0]?.count || 0,
        totalRules: rules.results?.[0]?.count || 0,
        activeAlerts: activeAlerts.results?.[0]?.count || 0
      }
    });
  } catch (e) {
    return c.json({ success: true, data: { totalNotifications: 0, unreadCount: 0, totalRules: 0, activeAlerts: 0 } });
  }
});

notificationCenterRoutes.get('/notifications', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { status, category, priority, limit = '50', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM notifications WHERE company_id = ?';
  const params = [companyId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (priority) { sql += ' AND priority = ?'; params.push(priority); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapNotificationRow) });
});

notificationCenterRoutes.post('/notifications', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO notifications (id, company_id, user_id, title, message, notification_type, category, priority, status, source_entity_type, source_entity_id, source_entity_name, action_url, action_label, expires_at, channel, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.userId || null, body.title, body.message || null,
     body.notificationType || 'info', body.category || 'system', body.priority || 'normal', 'unread',
     body.sourceEntityType || null, body.sourceEntityId || null, body.sourceEntityName || null,
     body.actionUrl || null, body.actionLabel || null, body.expiresAt || null,
     body.channel || 'in_app', body.notes || null, JSON.stringify(body.data || {})]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

notificationCenterRoutes.put('/notifications/:id/read', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute("UPDATE notifications SET status = 'read', read_at = datetime('now') WHERE id = ? AND company_id = ?", [id, companyId]);
  return c.json({ success: true });
});

notificationCenterRoutes.put('/notifications/:id/dismiss', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute("UPDATE notifications SET status = 'dismissed', dismissed_at = datetime('now') WHERE id = ? AND company_id = ?", [id, companyId]);
  return c.json({ success: true });
});

notificationCenterRoutes.put('/notifications/mark-all-read', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  await db.rawExecute("UPDATE notifications SET status = 'read', read_at = datetime('now') WHERE company_id = ? AND status = 'unread'", [companyId]);
  return c.json({ success: true });
});

notificationCenterRoutes.delete('/notifications/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM notifications WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

notificationCenterRoutes.get('/rules', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { ruleType, isActive, limit = '50', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM alert_rules WHERE company_id = ?';
  const params = [companyId];
  if (ruleType) { sql += ' AND rule_type = ?'; params.push(ruleType); }
  if (isActive !== undefined && isActive !== '') { sql += ' AND is_active = ?'; params.push(parseInt(isActive)); }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapRuleRow) });
});

notificationCenterRoutes.post('/rules', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO alert_rules (id, company_id, name, description, rule_type, category, entity_type, metric, operator, threshold_value, threshold_unit, severity, is_active, frequency, cooldown_minutes, recipients, channels, conditions, notes, data, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.name, body.description || null,
     body.ruleType || 'threshold', body.category || 'budget', body.entityType || null, body.metric || null,
     body.operator || 'greater_than', body.thresholdValue || 0, body.thresholdUnit || 'absolute',
     body.severity || 'warning', body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1,
     body.frequency || 'real_time', body.cooldownMinutes || 60,
     JSON.stringify(body.recipients || []), JSON.stringify(body.channels || ['in_app']),
     JSON.stringify(body.conditions || {}), body.notes || null, JSON.stringify(body.data || {}),
     c.get('user')?.userId || null]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

notificationCenterRoutes.put('/rules/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  const body = await c.req.json();
  await db.rawExecute(
    `UPDATE alert_rules SET name = ?, description = ?, rule_type = ?, category = ?, entity_type = ?, metric = ?, operator = ?, threshold_value = ?, threshold_unit = ?, severity = ?, is_active = ?, frequency = ?, cooldown_minutes = ?, recipients = ?, channels = ?, conditions = ?, notes = ?, data = ?, updated_at = datetime('now') WHERE id = ? AND company_id = ?`,
    [body.name, body.description || null, body.ruleType || 'threshold', body.category || 'budget',
     body.entityType || null, body.metric || null, body.operator || 'greater_than',
     body.thresholdValue || 0, body.thresholdUnit || 'absolute', body.severity || 'warning',
     body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1,
     body.frequency || 'real_time', body.cooldownMinutes || 60,
     JSON.stringify(body.recipients || []), JSON.stringify(body.channels || ['in_app']),
     JSON.stringify(body.conditions || {}), body.notes || null, JSON.stringify(body.data || {}),
     id, companyId]
  );
  return c.json({ success: true, data: { id, ...body } });
});

notificationCenterRoutes.delete('/rules/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM alert_rules WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

notificationCenterRoutes.get('/history', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { status, severity, ruleId, limit = '50', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM alert_history WHERE company_id = ?';
  const params = [companyId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (severity) { sql += ' AND severity = ?'; params.push(severity); }
  if (ruleId) { sql += ' AND rule_id = ?'; params.push(ruleId); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapHistoryRow) });
});

notificationCenterRoutes.post('/history', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO alert_history (id, company_id, rule_id, rule_name, alert_type, severity, title, message, entity_type, entity_id, entity_name, metric_value, threshold_value, status, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.ruleId || null, body.ruleName || null,
     body.alertType || 'threshold', body.severity || 'warning', body.title, body.message || null,
     body.entityType || null, body.entityId || null, body.entityName || null,
     body.metricValue || null, body.thresholdValue || null, 'active',
     body.notes || null, JSON.stringify(body.data || {})]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

notificationCenterRoutes.put('/history/:id/acknowledge', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  const userName = c.get('user')?.name || c.get('user')?.email;
  await db.rawExecute("UPDATE alert_history SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = datetime('now') WHERE id = ? AND company_id = ?", [userName, id, companyId]);
  return c.json({ success: true });
});

notificationCenterRoutes.put('/history/:id/resolve', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  const userName = c.get('user')?.name || c.get('user')?.email;
  await db.rawExecute("UPDATE alert_history SET status = 'resolved', resolved_by = ?, resolved_at = datetime('now') WHERE id = ? AND company_id = ?", [userName, id, companyId]);
  return c.json({ success: true });
});

notificationCenterRoutes.delete('/history/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM alert_history WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

export { notificationCenterRoutes };
