import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const campaigns = new Hono();

// Apply auth middleware to all routes
campaigns.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// Get all campaigns
campaigns.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, type, startDate, endDate, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT * FROM campaigns WHERE company_id = ?';
    const params = [companyId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND campaign_type = ?';
      params.push(type);
    }
    if (startDate) {
      query += ' AND start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND end_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: (result.results || []).map(rowToDocument),
      total: result.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get campaign analytics
campaigns.get('/analytics', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    
    const summary = await db.prepare(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(budget_amount) as total_budget,
        SUM(spent_amount) as total_spent,
        SUM(target_revenue) as total_target_revenue,
        SUM(actual_revenue) as total_actual_revenue,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count
      FROM campaigns WHERE company_id = ?
    `).bind(companyId).first();
    
    const byType = await db.prepare(`
      SELECT 
        campaign_type,
        COUNT(*) as count,
        SUM(budget_amount) as budget,
        SUM(spent_amount) as spent,
        SUM(actual_revenue) as revenue
      FROM campaigns WHERE company_id = ?
      GROUP BY campaign_type
    `).bind(companyId).all();
    
    return c.json({
      success: true,
      data: {
        summary: rowToDocument(summary),
        byType: (byType.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get campaign by ID
campaigns.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const result = await db.prepare(`
      SELECT * FROM campaigns WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!result) {
      return c.json({ success: false, message: 'Campaign not found' }, 404);
    }
    
    // Get associated promotions
    let promotions = [];
    try {
      const data = JSON.parse(result.data || '{}');
      if (data.promotionIds && data.promotionIds.length > 0) {
        const promoResult = await db.prepare(`
          SELECT id, name, status, start_date, end_date 
          FROM promotions 
          WHERE id IN (${data.promotionIds.map(() => '?').join(',')})
        `).bind(...data.promotionIds).all();
        promotions = promoResult.results || [];
      }
    } catch (e) {}
    
    return c.json({ 
      success: true, 
      data: {
        ...rowToDocument(result),
        promotions: promotions.map(rowToDocument)
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create campaign
campaigns.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const userId = getUserId(c);
    
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO campaigns (
        id, company_id, name, description, campaign_type, status,
        start_date, end_date, budget_amount, target_revenue, target_volume,
        created_by, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId, body.name, body.description || '',
      body.campaignType || body.campaign_type || 'tactical',
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.budgetAmount || body.budget_amount || 0,
      body.targetRevenue || body.target_revenue || 0,
      body.targetVolume || body.target_volume || 0,
      userId,
      JSON.stringify({
        promotionIds: body.promotionIds || [],
        customerIds: body.customerIds || [],
        productIds: body.productIds || [],
        ...body.data
      }),
      now, now
    ).run();
    
    const created = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Update campaign
campaigns.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare(`
      SELECT * FROM campaigns WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Campaign not found' }, 404);
    }
    
    await db.prepare(`
      UPDATE campaigns SET
        name = ?, description = ?, campaign_type = ?,
        start_date = ?, end_date = ?, budget_amount = ?,
        spent_amount = ?, target_revenue = ?, actual_revenue = ?,
        target_volume = ?, actual_volume = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description || existing.description,
      body.campaignType || body.campaign_type || existing.campaign_type,
      body.startDate || body.start_date || existing.start_date,
      body.endDate || body.end_date || existing.end_date,
      body.budgetAmount || body.budget_amount || existing.budget_amount,
      body.spentAmount || body.spent_amount || existing.spent_amount,
      body.targetRevenue || body.target_revenue || existing.target_revenue,
      body.actualRevenue || body.actual_revenue || existing.actual_revenue,
      body.targetVolume || body.target_volume || existing.target_volume,
      body.actualVolume || body.actual_volume || existing.actual_volume,
      JSON.stringify({
        promotionIds: body.promotionIds || [],
        customerIds: body.customerIds || [],
        productIds: body.productIds || [],
        ...body.data
      }),
      now, id
    ).run();
    
    const updated = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Delete campaign
campaigns.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    
    const existing = await db.prepare(`
      SELECT * FROM campaigns WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!existing) {
      return c.json({ success: false, message: 'Campaign not found' }, 404);
    }
    
    await db.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();
    
    return c.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Submit for approval
campaigns.post('/:id/submit', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE campaigns SET status = 'pending_approval', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error submitting campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Approve campaign
campaigns.post('/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE campaigns SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(userId, now, now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error approving campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Activate campaign
campaigns.post('/:id/activate', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE campaigns SET status = 'active', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error activating campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Complete campaign
campaigns.post('/:id/complete', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE campaigns SET status = 'completed', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error completing campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Cancel campaign
campaigns.post('/:id/cancel', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE campaigns SET status = 'cancelled', updated_at = ?
      WHERE id = ? AND company_id = ?
    `).bind(now, id, companyId).run();
    
    const updated = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error cancelling campaign:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Add promotion to campaign
campaigns.post('/:id/promotions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    
    const campaign = await db.prepare(`
      SELECT * FROM campaigns WHERE id = ? AND company_id = ?
    `).bind(id, companyId).first();
    
    if (!campaign) {
      return c.json({ success: false, message: 'Campaign not found' }, 404);
    }
    
    let data = {};
    try {
      data = JSON.parse(campaign.data || '{}');
    } catch (e) {}
    
    data.promotionIds = data.promotionIds || [];
    if (body.promotionId && !data.promotionIds.includes(body.promotionId)) {
      data.promotionIds.push(body.promotionId);
    }
    
    await db.prepare(`
      UPDATE campaigns SET data = ?, updated_at = ? WHERE id = ?
    `).bind(JSON.stringify(data), now, id).run();
    
    const updated = await db.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
    
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    console.error('Error adding promotion:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

campaigns.get('/:id/performance', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const campaign = await db.prepare('SELECT * FROM campaigns WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    const doc = rowToDocument(campaign);
    return c.json({ success: true, data: doc.performance || {
      budgetAmount: doc.budgetAmount || 0,
      spentAmount: doc.spentAmount || 0,
      targetRevenue: doc.targetRevenue || 0,
      actualRevenue: doc.actualRevenue || 0,
      targetVolume: doc.targetVolume || 0,
      actualVolume: doc.actualVolume || 0,
      roi: doc.actualRevenue && doc.spentAmount ? (((doc.actualRevenue - doc.spentAmount) / doc.spentAmount) * 100).toFixed(1) : '0.0'
    }});
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

campaigns.get('/:id/budget', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const campaign = await db.prepare('SELECT * FROM campaigns WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    const doc = rowToDocument(campaign);
    return c.json({ success: true, data: doc.budget || {
      totalBudget: doc.budgetAmount || 0,
      spentAmount: doc.spentAmount || 0,
      remaining: (doc.budgetAmount || 0) - (doc.spentAmount || 0),
      currency: 'ZAR'
    }});
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

campaigns.get('/:id/history', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const campaign = await db.prepare('SELECT * FROM campaigns WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    const doc = rowToDocument(campaign);
    const history = [];
    history.push({ id: `hist-create-${id}`, action: 'Created', user: doc.createdBy, date: doc.createdAt, details: `Campaign "${doc.name}" created` });
    if (doc.approvedBy) {
      history.push({ id: `hist-approve-${id}`, action: 'Approved', user: doc.approvedBy, date: doc.approvedAt, details: 'Campaign approved' });
    }
    if (doc.updatedAt && doc.updatedAt !== doc.createdAt) {
      history.push({ id: `hist-update-${id}`, action: 'Updated', user: doc.createdBy, date: doc.updatedAt, details: `Status: ${doc.status}` });
    }
    return c.json({ success: true, data: history.sort((a, b) => new Date(b.date) - new Date(a.date)) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const campaignsRoutes = campaigns;
