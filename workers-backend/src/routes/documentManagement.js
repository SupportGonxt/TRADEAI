import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const docs = new Hono();
docs.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
const getUserId = (c) => c.get('userId') || null;

docs.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const stats = await db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
        SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending,
        SUM(file_size) as total_size
      FROM documents WHERE company_id = ?
    `).bind(companyId).first();
    return c.json({ success: true, data: stats });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

docs.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      documentTypes: [
        { value: 'contract', label: 'Contract' },
        { value: 'invoice', label: 'Invoice' },
        { value: 'proof_of_performance', label: 'Proof of Performance' },
        { value: 'claim_support', label: 'Claim Support' },
        { value: 'agreement', label: 'Agreement' },
        { value: 'report', label: 'Report' },
        { value: 'general', label: 'General' }
      ],
      categories: [
        { value: 'trade_promotion', label: 'Trade Promotion' },
        { value: 'financial', label: 'Financial' },
        { value: 'legal', label: 'Legal' },
        { value: 'compliance', label: 'Compliance' },
        { value: 'operational', label: 'Operational' },
        { value: 'other', label: 'Other' }
      ],
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending_approval', label: 'Pending Approval' },
        { value: 'archived', label: 'Archived' },
        { value: 'expired', label: 'Expired' }
      ]
    }
  });
});

docs.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { document_type, category, status, entity_type, entity_id, limit = 50, offset = 0 } = c.req.query();
    let query = 'SELECT * FROM documents WHERE company_id = ?';
    const params = [companyId];
    if (document_type) { query += ' AND document_type = ?'; params.push(document_type); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
    if (entity_id) { query += ' AND entity_id = ?'; params.push(entity_id); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM documents WHERE company_id = ?').bind(companyId).first();
    return c.json({ success: true, data: result.results || [], total: countResult?.total || 0, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

docs.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const doc = await db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!doc) return c.json({ success: false, message: 'Document not found' }, 404);
    const versions = await db.prepare('SELECT * FROM document_versions WHERE document_id = ? AND company_id = ? ORDER BY version_number DESC').bind(id, companyId).all();
    return c.json({ success: true, data: { ...doc, versions: versions.results || [] } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

docs.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    if (!body.name) return c.json({ success: false, message: 'Document name is required' }, 400);
    await db.prepare(`
      INSERT INTO documents (id, company_id, name, description, document_type, category, file_name, file_url, file_size, mime_type, version, status, entity_type, entity_id, entity_name, tags, uploaded_by, expires_at, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, companyId, body.name, body.description || null, body.document_type || 'general', body.category || 'other', body.file_name || null, body.file_url || null, body.file_size || 0, body.mime_type || null, body.status || 'active', body.entity_type || null, body.entity_id || null, body.entity_name || null, JSON.stringify(body.tags || []), getUserId(c), body.expires_at || null, body.notes || null, JSON.stringify(body.data || {}), now, now).run();
    const created = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

docs.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Document not found' }, 404);
    await db.prepare(`
      UPDATE documents SET name = ?, description = ?, document_type = ?, category = ?, file_name = ?, file_url = ?, file_size = ?, mime_type = ?, status = ?, entity_type = ?, entity_id = ?, entity_name = ?, tags = ?, expires_at = ?, notes = ?, data = ?, updated_at = ? WHERE id = ?
    `).bind(body.name || existing.name, body.description ?? existing.description, body.document_type || existing.document_type, body.category || existing.category, body.file_name ?? existing.file_name, body.file_url ?? existing.file_url, body.file_size ?? existing.file_size, body.mime_type ?? existing.mime_type, body.status || existing.status, body.entity_type ?? existing.entity_type, body.entity_id ?? existing.entity_id, body.entity_name ?? existing.entity_name, JSON.stringify(body.tags || JSON.parse(existing.tags || '[]')), body.expires_at ?? existing.expires_at, body.notes ?? existing.notes, JSON.stringify(body.data || JSON.parse(existing.data || '{}')), now, id).run();
    const updated = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

docs.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Document not found' }, 404);
    await db.prepare('DELETE FROM document_versions WHERE document_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Document deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

docs.get('/:id/versions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const versions = await db.prepare('SELECT * FROM document_versions WHERE document_id = ? AND company_id = ? ORDER BY version_number DESC').bind(id, companyId).all();
    return c.json({ success: true, data: versions.results || [] });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

docs.post('/:id/versions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    const doc = await db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!doc) return c.json({ success: false, message: 'Document not found' }, 404);
    const newVersion = (doc.version || 1) + 1;
    const versionId = generateId();
    await db.prepare(`
      INSERT INTO document_versions (id, company_id, document_id, version_number, file_name, file_url, file_size, mime_type, change_summary, uploaded_by, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(versionId, companyId, id, newVersion, body.file_name || doc.file_name, body.file_url || null, body.file_size || 0, body.mime_type || doc.mime_type, body.change_summary || null, getUserId(c), JSON.stringify(body.data || {}), now).run();
    await db.prepare('UPDATE documents SET version = ?, file_name = ?, file_url = ?, file_size = ?, mime_type = ?, updated_at = ? WHERE id = ?').bind(newVersion, body.file_name || doc.file_name, body.file_url || doc.file_url, body.file_size || doc.file_size, body.mime_type || doc.mime_type, now, id).run();
    const created = await db.prepare('SELECT * FROM document_versions WHERE id = ?').bind(versionId).first();
    return c.json({ success: true, data: created }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

export const documentManagementRoutes = docs;
