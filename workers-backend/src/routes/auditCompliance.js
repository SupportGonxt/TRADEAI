import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const auditComplianceRoutes = new Hono();
auditComplianceRoutes.use('*', authMiddleware);

function mapAuditRow(r) {
  return {
    id: r.id,
    companyId: r.company_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    entityName: r.entity_name,
    actionType: r.action_type,
    actionLabel: r.action_label,
    severity: r.severity,
    source: r.source,
    requestId: r.request_id,
    beforeData: r.before_data,
    afterData: r.after_data,
    changedFields: r.changed_fields,
    actorUserId: r.actor_user_id,
    actorName: r.actor_name,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    notes: r.notes,
    data: r.data,
    createdAt: r.created_at
  };
}

function mapPolicyRow(r) {
  return {
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    description: r.description,
    policyType: r.policy_type,
    appliesTo: r.applies_to,
    enforcementLevel: r.enforcement_level,
    status: r.status,
    version: r.version,
    owner: r.owner,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to,
    lastReviewedAt: r.last_reviewed_at,
    nextReviewAt: r.next_review_at,
    rules: r.rules,
    tags: r.tags,
    notes: r.notes,
    data: r.data,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function mapAccessRow(r) {
  return {
    id: r.id,
    companyId: r.company_id,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    resourceName: r.resource_name,
    accessType: r.access_type,
    outcome: r.outcome,
    reason: r.reason,
    actorUserId: r.actor_user_id,
    actorName: r.actor_name,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    requestId: r.request_id,
    notes: r.notes,
    data: r.data,
    createdAt: r.created_at
  };
}

auditComplianceRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      severities: ['info', 'warning', 'high', 'critical'],
      sources: ['ui', 'api', 'integration', 'system'],
      actionTypes: ['create', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'login', 'logout'],
      entityTypes: ['promotion', 'budget', 'trade_spend', 'claim', 'deduction', 'rebate', 'customer', 'product', 'user', 'settings'],
      policyTypes: ['control', 'segregation_of_duties', 'approval', 'data_retention', 'security', 'privacy'],
      enforcementLevels: ['advisory', 'enforced', 'blocked'],
      policyStatuses: ['active', 'draft', 'archived'],
      accessTypes: ['read', 'write', 'delete', 'export', 'import'],
      outcomes: ['success', 'denied', 'error']
    }
  });
});

auditComplianceRoutes.get('/summary', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  try {
    const events = await db.rawQuery('SELECT COUNT(*) as count FROM audit_events WHERE company_id = ?', [companyId]);
    const policies = await db.rawQuery('SELECT COUNT(*) as count FROM compliance_policies WHERE company_id = ?', [companyId]);
    const access = await db.rawQuery('SELECT COUNT(*) as count FROM data_access_logs WHERE company_id = ?', [companyId]);
    const high = await db.rawQuery('SELECT COUNT(*) as count FROM audit_events WHERE company_id = ? AND severity IN (?, ?)', [companyId, 'high', 'critical']);
    return c.json({
      success: true,
      data: {
        totalEvents: events.results?.[0]?.count || 0,
        totalPolicies: policies.results?.[0]?.count || 0,
        totalAccessLogs: access.results?.[0]?.count || 0,
        highSeverityEvents: high.results?.[0]?.count || 0
      }
    });
  } catch (e) {
    return c.json({ success: true, data: { totalEvents: 0, totalPolicies: 0, totalAccessLogs: 0, highSeverityEvents: 0 } });
  }
});

auditComplianceRoutes.get('/events', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const {
    entityType, entityId, actionType, severity, actorUserId,
    startDate, endDate,
    limit = '100', offset = '0'
  } = c.req.query();

  let sql = 'SELECT * FROM audit_events WHERE company_id = ?';
  const params = [companyId];
  if (entityType) { sql += ' AND entity_type = ?'; params.push(entityType); }
  if (entityId) { sql += ' AND entity_id = ?'; params.push(entityId); }
  if (actionType) { sql += ' AND action_type = ?'; params.push(actionType); }
  if (severity) { sql += ' AND severity = ?'; params.push(severity); }
  if (actorUserId) { sql += ' AND actor_user_id = ?'; params.push(actorUserId); }
  if (startDate) { sql += ' AND created_at >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND created_at <= ?'; params.push(endDate); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapAuditRow) });
});

auditComplianceRoutes.post('/events', async (c) => {
  const companyId = c.get('user')?.companyId;
  const actorUserId = c.get('user')?.userId;
  const actorName = c.get('user')?.name || c.get('user')?.email;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await db.rawExecute(
    `INSERT INTO audit_events (id, company_id, entity_type, entity_id, entity_name, action_type, action_label, severity, source, request_id, before_data, after_data, changed_fields, actor_user_id, actor_name, ip_address, user_agent, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, companyId,
      body.entityType, body.entityId || null, body.entityName || null,
      body.actionType, body.actionLabel || null,
      body.severity || 'info', body.source || 'ui', body.requestId || null,
      JSON.stringify(body.beforeData || {}),
      JSON.stringify(body.afterData || {}),
      JSON.stringify(body.changedFields || []),
      body.actorUserId || actorUserId || null,
      body.actorName || actorName || null,
      body.ipAddress || null,
      body.userAgent || null,
      body.notes || null,
      JSON.stringify(body.data || {})
    ]
  );

  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

auditComplianceRoutes.delete('/events/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM audit_events WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

auditComplianceRoutes.get('/policies', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { policyType, status, limit = '50', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM compliance_policies WHERE company_id = ?';
  const params = [companyId];
  if (policyType) { sql += ' AND policy_type = ?'; params.push(policyType); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapPolicyRow) });
});

auditComplianceRoutes.post('/policies', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO compliance_policies (id, company_id, name, description, policy_type, applies_to, enforcement_level, status, version, owner, effective_from, effective_to, last_reviewed_at, next_review_at, rules, tags, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, companyId,
      body.name, body.description || null,
      body.policyType || 'control', body.appliesTo || null,
      body.enforcementLevel || 'advisory', body.status || 'active',
      body.version || '1.0', body.owner || null,
      body.effectiveFrom || null, body.effectiveTo || null,
      body.lastReviewedAt || null, body.nextReviewAt || null,
      JSON.stringify(body.rules || {}),
      JSON.stringify(body.tags || []),
      body.notes || null,
      JSON.stringify(body.data || {})
    ]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

auditComplianceRoutes.put('/policies/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  const body = await c.req.json();
  await db.rawExecute(
    `UPDATE compliance_policies SET name = ?, description = ?, policy_type = ?, applies_to = ?, enforcement_level = ?, status = ?, version = ?, owner = ?, effective_from = ?, effective_to = ?, last_reviewed_at = ?, next_review_at = ?, rules = ?, tags = ?, notes = ?, data = ?, updated_at = datetime('now') WHERE id = ? AND company_id = ?`,
    [
      body.name, body.description || null,
      body.policyType || 'control', body.appliesTo || null,
      body.enforcementLevel || 'advisory', body.status || 'active',
      body.version || '1.0', body.owner || null,
      body.effectiveFrom || null, body.effectiveTo || null,
      body.lastReviewedAt || null, body.nextReviewAt || null,
      JSON.stringify(body.rules || {}),
      JSON.stringify(body.tags || []),
      body.notes || null,
      JSON.stringify(body.data || {}),
      id, companyId
    ]
  );
  return c.json({ success: true, data: { id, ...body } });
});

auditComplianceRoutes.delete('/policies/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM compliance_policies WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

auditComplianceRoutes.get('/access-logs', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { resourceType, resourceId, accessType, outcome, actorUserId, startDate, endDate, limit = '100', offset = '0' } = c.req.query();

  let sql = 'SELECT * FROM data_access_logs WHERE company_id = ?';
  const params = [companyId];
  if (resourceType) { sql += ' AND resource_type = ?'; params.push(resourceType); }
  if (resourceId) { sql += ' AND resource_id = ?'; params.push(resourceId); }
  if (accessType) { sql += ' AND access_type = ?'; params.push(accessType); }
  if (outcome) { sql += ' AND outcome = ?'; params.push(outcome); }
  if (actorUserId) { sql += ' AND actor_user_id = ?'; params.push(actorUserId); }
  if (startDate) { sql += ' AND created_at >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND created_at <= ?'; params.push(endDate); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapAccessRow) });
});

auditComplianceRoutes.post('/access-logs', async (c) => {
  const companyId = c.get('user')?.companyId;
  const actorUserId = c.get('user')?.userId;
  const actorName = c.get('user')?.name || c.get('user')?.email;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await db.rawExecute(
    `INSERT INTO data_access_logs (id, company_id, resource_type, resource_id, resource_name, access_type, outcome, reason, actor_user_id, actor_name, ip_address, user_agent, request_id, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, companyId,
      body.resourceType, body.resourceId || null, body.resourceName || null,
      body.accessType, body.outcome || 'success', body.reason || null,
      body.actorUserId || actorUserId || null,
      body.actorName || actorName || null,
      body.ipAddress || null,
      body.userAgent || null,
      body.requestId || null,
      body.notes || null,
      JSON.stringify(body.data || {})
    ]
  );

  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

auditComplianceRoutes.delete('/access-logs/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM data_access_logs WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

export { auditComplianceRoutes };
