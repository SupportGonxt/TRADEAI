import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const wf = new Hono();
wf.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';

wf.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const templates = await db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM workflow_templates WHERE company_id = ?").bind(companyId).first();
    const instances = await db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM workflow_instances WHERE company_id = ?
    `).bind(companyId).first();
    return c.json({ success: true, data: { templates, instances } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      workflowTypes: [
        { value: 'approval', label: 'Approval Workflow' },
        { value: 'review', label: 'Review Workflow' },
        { value: 'notification', label: 'Notification Workflow' },
        { value: 'escalation', label: 'Escalation Workflow' },
        { value: 'custom', label: 'Custom Workflow' }
      ],
      entityTypes: [
        { value: 'promotion', label: 'Promotion' },
        { value: 'budget', label: 'Budget' },
        { value: 'claim', label: 'Claim' },
        { value: 'deduction', label: 'Deduction' },
        { value: 'settlement', label: 'Settlement' },
        { value: 'trade_spend', label: 'Trade Spend' }
      ],
      triggerEvents: [
        { value: 'on_create', label: 'On Create' },
        { value: 'on_submit', label: 'On Submit' },
        { value: 'on_amount_threshold', label: 'Amount Threshold' },
        { value: 'on_status_change', label: 'Status Change' },
        { value: 'manual', label: 'Manual' }
      ],
      stepTypes: [
        { value: 'approval', label: 'Approval' },
        { value: 'review', label: 'Review' },
        { value: 'notification', label: 'Notification' },
        { value: 'condition', label: 'Condition Check' },
        { value: 'action', label: 'Automated Action' }
      ]
    }
  });
});

wf.get('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { workflow_type, entity_type, status, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM workflow_templates WHERE company_id = ?';
    const params = [companyId];
    if (workflow_type) { query += ' AND workflow_type = ?'; params.push(workflow_type); }
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM workflow_templates WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0 });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.get('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const template = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!template) return c.json({ success: false, message: 'Template not found' }, 404);
    return c.json({ success: true, data: template });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.post('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.name) return c.json({ success: false, message: 'Name is required' }, 400);
    await db.prepare(`
      INSERT INTO workflow_templates (id, company_id, name, description, workflow_type, entity_type, trigger_event, status, is_system, version, steps, conditions, escalation_rules, sla_hours, auto_approve_below, requires_all_approvers, created_by, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, companyId, body.name, body.description || null, body.workflow_type || 'approval', body.entity_type || null, body.trigger_event || 'on_submit', body.status || 'active', JSON.stringify(body.steps || []), JSON.stringify(body.conditions || {}), JSON.stringify(body.escalation_rules || {}), body.sla_hours || null, body.auto_approve_below || null, body.requires_all_approvers ? 1 : 0, c.get('userId') || null, body.notes || null, JSON.stringify(body.data || {}), now, now).run();
    const created = await db.prepare('SELECT * FROM workflow_templates WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.put('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Template not found' }, 404);
    await db.prepare(`
      UPDATE workflow_templates SET name = ?, description = ?, workflow_type = ?, entity_type = ?, trigger_event = ?, status = ?, steps = ?, conditions = ?, escalation_rules = ?, sla_hours = ?, auto_approve_below = ?, requires_all_approvers = ?, notes = ?, data = ?, updated_at = ? WHERE id = ?
    `).bind(body.name || existing.name, body.description ?? existing.description, body.workflow_type || existing.workflow_type, body.entity_type ?? existing.entity_type, body.trigger_event || existing.trigger_event, body.status || existing.status, JSON.stringify(body.steps || JSON.parse(existing.steps || '[]')), JSON.stringify(body.conditions || JSON.parse(existing.conditions || '{}')), JSON.stringify(body.escalation_rules || JSON.parse(existing.escalation_rules || '{}')), body.sla_hours ?? existing.sla_hours, body.auto_approve_below ?? existing.auto_approve_below, body.requires_all_approvers !== undefined ? (body.requires_all_approvers ? 1 : 0) : existing.requires_all_approvers, body.notes ?? existing.notes, JSON.stringify(body.data || JSON.parse(existing.data || '{}')), now, id).run();
    const updated = await db.prepare('SELECT * FROM workflow_templates WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.delete('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Template not found' }, 404);
    if (existing.is_system) return c.json({ success: false, message: 'Cannot delete system template' }, 400);
    await db.prepare('DELETE FROM workflow_templates WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Template deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.get('/instances', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, entity_type, template_id, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM workflow_instances WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (template_id) { query += ' AND template_id = ?'; params.push(template_id); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM workflow_instances WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0 });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.get('/instances/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const instance = await db.prepare('SELECT * FROM workflow_instances WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!instance) return c.json({ success: false, message: 'Instance not found' }, 404);
    const steps = await db.prepare('SELECT * FROM workflow_steps WHERE instance_id = ? AND company_id = ? ORDER BY step_number ASC').bind(id, companyId).all();
    return c.json({ success: true, data: { ...instance, steps: steps.results || [] } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.post('/instances', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.template_id) return c.json({ success: false, message: 'template_id is required' }, 400);
    const template = await db.prepare('SELECT * FROM workflow_templates WHERE id = ? AND company_id = ?').bind(body.template_id, companyId).first();
    if (!template) return c.json({ success: false, message: 'Template not found' }, 404);
    const steps = JSON.parse(template.steps || '[]');
    await db.prepare(`
      INSERT INTO workflow_instances (id, company_id, template_id, template_name, entity_type, entity_id, entity_name, status, current_step, total_steps, initiated_by, initiated_at, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', 1, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, companyId, body.template_id, template.name, body.entity_type || template.entity_type, body.entity_id || null, body.entity_name || null, steps.length || 1, c.get('userId') || null, now, body.notes || null, JSON.stringify(body.data || {}), now, now).run();
    for (let i = 0; i < steps.length; i++) {
      const stepId = generateId();
      await db.prepare(`INSERT INTO workflow_steps (id, company_id, instance_id, step_number, step_name, step_type, assignee_id, assignee_name, status, due_at, sla_hours, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(stepId, companyId, id, i + 1, steps[i].name || `Step ${i + 1}`, steps[i].type || 'approval', steps[i].assignee_id || null, steps[i].assignee_name || null, i === 0 ? 'in_progress' : 'pending', null, steps[i].sla_hours || template.sla_hours || null, JSON.stringify(steps[i].data || {}), now).run();
    }
    const created = await db.prepare('SELECT * FROM workflow_instances WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.put('/steps/:id/complete', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const step = await db.prepare('SELECT * FROM workflow_steps WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!step) return c.json({ success: false, message: 'Step not found' }, 404);
    await db.prepare("UPDATE workflow_steps SET status = 'completed', action = ?, comments = ?, completed_at = ? WHERE id = ?").bind(body.action || 'approved', body.comments || null, now, id).run();
    const nextStep = await db.prepare("SELECT * FROM workflow_steps WHERE instance_id = ? AND step_number = ? AND company_id = ?").bind(step.instance_id, step.step_number + 1, companyId).first();
    if (nextStep) {
      await db.prepare("UPDATE workflow_steps SET status = 'in_progress', started_at = ? WHERE id = ?").bind(now, nextStep.id).run();
      await db.prepare("UPDATE workflow_instances SET current_step = ?, updated_at = ? WHERE id = ?").bind(step.step_number + 1, now, step.instance_id).run();
    } else {
      await db.prepare("UPDATE workflow_instances SET status = 'completed', outcome = 'approved', completed_at = ?, completed_by = ?, updated_at = ? WHERE id = ?").bind(now, c.get('userId') || null, now, step.instance_id).run();
    }
    return c.json({ success: true, message: 'Step completed' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

wf.put('/steps/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const step = await db.prepare('SELECT * FROM workflow_steps WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!step) return c.json({ success: false, message: 'Step not found' }, 404);
    await db.prepare("UPDATE workflow_steps SET status = 'rejected', action = 'rejected', comments = ?, completed_at = ? WHERE id = ?").bind(body.comments || null, now, id).run();
    await db.prepare("UPDATE workflow_instances SET status = 'rejected', outcome = 'rejected', completed_at = ?, completed_by = ?, updated_at = ? WHERE id = ?").bind(now, c.get('userId') || null, now, step.instance_id).run();
    return c.json({ success: true, message: 'Step rejected' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

export const workflowEngineRoutes = wf;
