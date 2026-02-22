import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const retailerCollaboration = new Hono();

retailerCollaboration.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

retailerCollaboration.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      planTypes: [
        { value: 'joint_business', label: 'Joint Business Plan' },
        { value: 'promotional', label: 'Promotional Plan' },
        { value: 'category', label: 'Category Plan' },
        { value: 'seasonal', label: 'Seasonal Plan' },
        { value: 'innovation', label: 'Innovation Launch' },
        { value: 'trade_terms', label: 'Trade Terms Review' }
      ],
      accessLevels: [
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' },
        { value: 'strategic', label: 'Strategic Partner' }
      ],
      shareStatuses: [
        { value: 'pending', label: 'Pending Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'expired', label: 'Expired' }
      ],
      visibilityLevels: [
        { value: 'full', label: 'Full Details' },
        { value: 'summary', label: 'Summary Only' },
        { value: 'restricted', label: 'Restricted' }
      ]
    }
  });
});

retailerCollaboration.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const portals = await db.prepare('SELECT COUNT(*) as total FROM retailer_portals WHERE company_id = ?').bind(companyId).first();
    const activePortals = await db.prepare("SELECT COUNT(*) as total FROM retailer_portals WHERE company_id = ? AND portal_status = 'active'").bind(companyId).first();
    const plans = await db.prepare('SELECT COUNT(*) as total FROM collaboration_plans WHERE company_id = ?').bind(companyId).first();
    const activePlans = await db.prepare("SELECT COUNT(*) as total FROM collaboration_plans WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const sharedPromos = await db.prepare('SELECT COUNT(*) as total FROM shared_promotions WHERE company_id = ?').bind(companyId).first();
    const pendingPromos = await db.prepare("SELECT COUNT(*) as total FROM shared_promotions WHERE company_id = ? AND share_status = 'pending'").bind(companyId).first();
    const messages = await db.prepare('SELECT COUNT(*) as total FROM collaboration_messages WHERE company_id = ?').bind(companyId).first();
    const unreadMessages = await db.prepare("SELECT COUNT(*) as total FROM collaboration_messages WHERE company_id = ? AND is_read = 0").bind(companyId).first();

    return c.json({
      success: true,
      data: {
        portals: { total: portals?.total || 0, active: activePortals?.total || 0 },
        plans: { total: plans?.total || 0, active: activePlans?.total || 0 },
        sharedPromotions: { total: sharedPromos?.total || 0, pending: pendingPromos?.total || 0 },
        messages: { total: messages?.total || 0, unread: unreadMessages?.total || 0 }
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.get('/portals', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { portal_status, search, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM retailer_portals WHERE company_id = ?';
    const params = [companyId];

    if (portal_status) { query += ' AND portal_status = ?'; params.push(portal_status); }
    if (search) { query += ' AND (retailer_name LIKE ? OR retailer_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM retailer_portals WHERE company_id = ?').bind(companyId).first();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: countResult?.total || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.get('/portals/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const portal = await db.prepare('SELECT * FROM retailer_portals WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!portal) return c.json({ success: false, message: 'Portal not found' }, 404);

    const plans = await db.prepare('SELECT * FROM collaboration_plans WHERE retailer_id = ? AND company_id = ? ORDER BY created_at DESC LIMIT 10').bind(id, companyId).all();
    const shared = await db.prepare('SELECT * FROM shared_promotions WHERE retailer_id = ? AND company_id = ? ORDER BY created_at DESC LIMIT 10').bind(id, companyId).all();
    const msgs = await db.prepare('SELECT * FROM collaboration_messages WHERE retailer_id = ? AND company_id = ? ORDER BY created_at DESC LIMIT 20').bind(id, companyId).all();

    const doc = rowToDocument(portal);
    doc.plans = (plans.results || []).map(rowToDocument);
    doc.sharedPromotions = (shared.results || []).map(rowToDocument);
    doc.messages = (msgs.results || []).map(rowToDocument);

    return c.json({ success: true, data: doc });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.post('/portals', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO retailer_portals (id, company_id, retailer_id, retailer_name, retailer_code, portal_status, access_level, primary_contact_name, primary_contact_email, primary_contact_phone, onboarded_at, collaboration_score, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId, body.retailerId || body.retailer_id || null,
      body.retailerName || body.retailer_name || '',
      body.retailerCode || body.retailer_code || null,
      body.portalStatus || body.portal_status || 'active',
      body.accessLevel || body.access_level || 'standard',
      body.primaryContactName || body.primary_contact_name || null,
      body.primaryContactEmail || body.primary_contact_email || null,
      body.primaryContactPhone || body.primary_contact_phone || null,
      now, body.collaborationScore || body.collaboration_score || 0,
      body.notes || '', JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM retailer_portals WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.put('/portals/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM retailer_portals WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Portal not found' }, 404);

    const fields = [];
    const params = [];
    const fieldMap = {
      retailerName: 'retailer_name', retailerCode: 'retailer_code',
      portalStatus: 'portal_status', accessLevel: 'access_level',
      primaryContactName: 'primary_contact_name', primaryContactEmail: 'primary_contact_email',
      primaryContactPhone: 'primary_contact_phone', collaborationScore: 'collaboration_score',
      notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }
    fields.push('updated_at = ?');
    params.push(now, id, companyId);

    await db.prepare(`UPDATE retailer_portals SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM retailer_portals WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.delete('/portals/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM collaboration_messages WHERE retailer_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM shared_promotions WHERE retailer_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM collaboration_plans WHERE retailer_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM retailer_portals WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Portal and associated data deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.get('/plans', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { retailer_id, plan_type, status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM collaboration_plans WHERE company_id = ?';
    const params = [companyId];

    if (retailer_id) { query += ' AND retailer_id = ?'; params.push(retailer_id); }
    if (plan_type) { query += ' AND plan_type = ?'; params.push(plan_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM collaboration_plans WHERE company_id = ?').bind(companyId).first();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: countResult?.total || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.get('/plans/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const plan = await db.prepare('SELECT * FROM collaboration_plans WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!plan) return c.json({ success: false, message: 'Plan not found' }, 404);

    const shared = await db.prepare('SELECT * FROM shared_promotions WHERE plan_id = ? AND company_id = ? ORDER BY created_at DESC').bind(id, companyId).all();
    const doc = rowToDocument(plan);
    doc.sharedPromotions = (shared.results || []).map(rowToDocument);

    return c.json({ success: true, data: doc });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.post('/plans', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO collaboration_plans (id, company_id, retailer_id, retailer_name, name, description, plan_type, status, fiscal_year, quarter, start_date, end_date, total_investment, projected_revenue, projected_growth_pct, objectives, kpis, milestones, owner, retailer_owner, created_by, tags, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.retailerId || body.retailer_id || null,
      body.retailerName || body.retailer_name || null,
      body.name || '',
      body.description || '',
      body.planType || body.plan_type || 'joint_business',
      body.status || 'draft',
      body.fiscalYear || body.fiscal_year || null,
      body.quarter || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.totalInvestment || body.total_investment || 0,
      body.projectedRevenue || body.projected_revenue || 0,
      body.projectedGrowthPct || body.projected_growth_pct || 0,
      JSON.stringify(body.objectives || []),
      JSON.stringify(body.kpis || []),
      JSON.stringify(body.milestones || []),
      body.owner || null,
      body.retailerOwner || body.retailer_owner || null,
      getUserId(c),
      JSON.stringify(body.tags || []),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM collaboration_plans WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.put('/plans/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM collaboration_plans WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Plan not found' }, 404);

    const fields = [];
    const params = [];
    const fieldMap = {
      name: 'name', description: 'description', planType: 'plan_type',
      status: 'status', fiscalYear: 'fiscal_year', quarter: 'quarter',
      startDate: 'start_date', endDate: 'end_date',
      totalInvestment: 'total_investment', projectedRevenue: 'projected_revenue',
      projectedGrowthPct: 'projected_growth_pct', actualRevenue: 'actual_revenue',
      actualGrowthPct: 'actual_growth_pct', owner: 'owner',
      retailerOwner: 'retailer_owner', approvedBy: 'approved_by',
      approvedAt: 'approved_at', notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.objectives !== undefined) { fields.push('objectives = ?'); params.push(JSON.stringify(body.objectives)); }
    if (body.kpis !== undefined) { fields.push('kpis = ?'); params.push(JSON.stringify(body.kpis)); }
    if (body.milestones !== undefined) { fields.push('milestones = ?'); params.push(JSON.stringify(body.milestones)); }
    if (body.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(body.tags)); }
    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }

    fields.push('updated_at = ?');
    params.push(now, id, companyId);

    await db.prepare(`UPDATE collaboration_plans SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM collaboration_plans WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.delete('/plans/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM shared_promotions WHERE plan_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM collaboration_plans WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.get('/shared-promotions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { retailer_id, plan_id, share_status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM shared_promotions WHERE company_id = ?';
    const params = [companyId];

    if (retailer_id) { query += ' AND retailer_id = ?'; params.push(retailer_id); }
    if (plan_id) { query += ' AND plan_id = ?'; params.push(plan_id); }
    if (share_status) { query += ' AND share_status = ?'; params.push(share_status); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.post('/shared-promotions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO shared_promotions (id, company_id, retailer_id, retailer_name, plan_id, promotion_id, promotion_name, share_status, visibility, manufacturer_notes, shared_by, shared_at, expires_at, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.retailerId || body.retailer_id || null,
      body.retailerName || body.retailer_name || null,
      body.planId || body.plan_id || null,
      body.promotionId || body.promotion_id || null,
      body.promotionName || body.promotion_name || null,
      body.shareStatus || body.share_status || 'pending',
      body.visibility || 'full',
      body.manufacturerNotes || body.manufacturer_notes || null,
      getUserId(c), now,
      body.expiresAt || body.expires_at || null,
      body.notes || '', JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM shared_promotions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.put('/shared-promotions/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM shared_promotions WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Shared promotion not found' }, 404);

    const fields = [];
    const params = [];
    const fieldMap = {
      shareStatus: 'share_status', visibility: 'visibility',
      retailerFeedback: 'retailer_feedback', retailerRating: 'retailer_rating',
      retailerApproved: 'retailer_approved', retailerApprovedAt: 'retailer_approved_at',
      retailerNotes: 'retailer_notes', manufacturerNotes: 'manufacturer_notes',
      notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }
    fields.push('updated_at = ?');
    params.push(now, id, companyId);

    await db.prepare(`UPDATE shared_promotions SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM shared_promotions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.delete('/shared-promotions/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM shared_promotions WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Shared promotion deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.get('/messages', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { retailer_id, plan_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM collaboration_messages WHERE company_id = ?';
    const params = [companyId];

    if (retailer_id) { query += ' AND retailer_id = ?'; params.push(retailer_id); }
    if (plan_id) { query += ' AND plan_id = ?'; params.push(plan_id); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.post('/messages', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO collaboration_messages (id, company_id, retailer_id, plan_id, promotion_id, sender_type, sender_name, sender_email, message_type, subject, body, parent_id, attachments, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.retailerId || body.retailer_id || null,
      body.planId || body.plan_id || null,
      body.promotionId || body.promotion_id || null,
      body.senderType || body.sender_type || 'manufacturer',
      body.senderName || body.sender_name || null,
      body.senderEmail || body.sender_email || null,
      body.messageType || body.message_type || 'text',
      body.subject || null,
      body.body || '',
      body.parentId || body.parent_id || null,
      JSON.stringify(body.attachments || []),
      body.notes || '', JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM collaboration_messages WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

retailerCollaboration.delete('/messages/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM collaboration_messages WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { retailerCollaboration as retailerCollaborationRoutes };
