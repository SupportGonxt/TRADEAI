import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const roles = new Hono();
roles.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';

roles.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const roleStats = await db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM roles WHERE company_id = ?').bind(companyId).first();
    const assignStats = await db.prepare("SELECT COUNT(*) as total, COUNT(DISTINCT user_id) as users FROM user_roles WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const groupStats = await db.prepare('SELECT COUNT(*) as total FROM permission_groups WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: { roles: roleStats, assignments: assignStats, permissionGroups: groupStats } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      roleTypes: [
        { value: 'system', label: 'System Role' },
        { value: 'custom', label: 'Custom Role' }
      ],
      modules: [
        { value: 'promotions', label: 'Promotions' },
        { value: 'budgets', label: 'Budgets' },
        { value: 'claims', label: 'Claims' },
        { value: 'deductions', label: 'Deductions' },
        { value: 'settlements', label: 'Settlements' },
        { value: 'accruals', label: 'Accruals' },
        { value: 'approvals', label: 'Approvals' },
        { value: 'reporting', label: 'Reporting' },
        { value: 'admin', label: 'Admin' }
      ],
      permissions: [
        { value: 'view', label: 'View' },
        { value: 'create', label: 'Create' },
        { value: 'edit', label: 'Edit' },
        { value: 'delete', label: 'Delete' },
        { value: 'approve', label: 'Approve' },
        { value: 'export', label: 'Export' },
        { value: 'admin', label: 'Admin' }
      ]
    }
  });
});

roles.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { role_type, is_active, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM roles WHERE company_id = ?';
    const params = [companyId];
    if (role_type) { query += ' AND role_type = ?'; params.push(role_type); }
    if (is_active !== undefined) { query += ' AND is_active = ?'; params.push(parseInt(is_active)); }
    query += ' ORDER BY level ASC, name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM roles WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0 });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const role = await db.prepare('SELECT * FROM roles WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!role) return c.json({ success: false, message: 'Role not found' }, 404);
    const assignments = await db.prepare("SELECT * FROM user_roles WHERE role_id = ? AND company_id = ? AND status = 'active'").bind(id, companyId).all();
    return c.json({ success: true, data: { ...role, assignments: assignments.results || [] } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.name) return c.json({ success: false, message: 'Role name is required' }, 400);
    await db.prepare(`
      INSERT INTO roles (id, company_id, name, description, role_type, is_system, is_active, permissions, parent_role_id, level, max_approval_amount, created_by, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, companyId, body.name, body.description || null, body.role_type || 'custom', JSON.stringify(body.permissions || []), body.parent_role_id || null, body.level || 0, body.max_approval_amount || null, c.get('userId') || null, body.notes || null, JSON.stringify(body.data || {}), now, now).run();
    const created = await db.prepare('SELECT * FROM roles WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM roles WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Role not found' }, 404);
    await db.prepare(`
      UPDATE roles SET name = ?, description = ?, role_type = ?, is_active = ?, permissions = ?, parent_role_id = ?, level = ?, max_approval_amount = ?, notes = ?, data = ?, updated_at = ? WHERE id = ?
    `).bind(body.name || existing.name, body.description ?? existing.description, body.role_type || existing.role_type, body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active, JSON.stringify(body.permissions || JSON.parse(existing.permissions || '[]')), body.parent_role_id ?? existing.parent_role_id, body.level ?? existing.level, body.max_approval_amount ?? existing.max_approval_amount, body.notes ?? existing.notes, JSON.stringify(body.data || JSON.parse(existing.data || '{}')), now, id).run();
    const updated = await db.prepare('SELECT * FROM roles WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM roles WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Role not found' }, 404);
    if (existing.is_system) return c.json({ success: false, message: 'Cannot delete system role' }, 400);
    await db.prepare('DELETE FROM user_roles WHERE role_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM roles WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Role deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.get('/assignments/list', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { user_id, role_id, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM user_roles WHERE company_id = ?';
    const params = [companyId];
    if (user_id) { query += ' AND user_id = ?'; params.push(user_id); }
    if (role_id) { query += ' AND role_id = ?'; params.push(role_id); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.post('/assignments', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.user_id || !body.role_id) return c.json({ success: false, message: 'user_id and role_id are required' }, 400);
    const role = await db.prepare('SELECT name FROM roles WHERE id = ? AND company_id = ?').bind(body.role_id, companyId).first();
    await db.prepare(`INSERT INTO user_roles (id, company_id, user_id, role_id, role_name, assigned_by, valid_from, valid_until, status, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`).bind(id, companyId, body.user_id, body.role_id, role?.name || null, c.get('userId') || null, body.valid_from || now, body.valid_until || null, JSON.stringify(body.data || {}), now).run();
    const created = await db.prepare('SELECT * FROM user_roles WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.delete('/assignments/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM user_roles WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Assignment removed' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.get('/permission-groups/list', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const result = await db.prepare('SELECT * FROM permission_groups WHERE company_id = ? ORDER BY module ASC, name ASC').bind(companyId).all();
    return c.json({ success: true, data: result.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

roles.post('/permission-groups', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO permission_groups (id, company_id, name, description, module, permissions, is_system, created_by, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`).bind(id, companyId, body.name, body.description || null, body.module || null, JSON.stringify(body.permissions || []), c.get('userId') || null, JSON.stringify(body.data || {}), now, now).run();
    const created = await db.prepare('SELECT * FROM permission_groups WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

export const roleManagementRoutes = roles;
