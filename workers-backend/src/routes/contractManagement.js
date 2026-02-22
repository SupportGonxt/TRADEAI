import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const contractManagement = new Hono();

contractManagement.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

contractManagement.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      contractTypes: [
        { value: 'trade_agreement', label: 'Trade Agreement' },
        { value: 'rebate_agreement', label: 'Rebate Agreement' },
        { value: 'promotional', label: 'Promotional Contract' },
        { value: 'supply', label: 'Supply Contract' },
        { value: 'joint_business', label: 'Joint Business Plan' },
        { value: 'listing_fee', label: 'Listing Fee Agreement' },
        { value: 'marketing', label: 'Marketing Agreement' }
      ],
      termTypes: [
        { value: 'volume_rebate', label: 'Volume Rebate' },
        { value: 'value_rebate', label: 'Value Rebate' },
        { value: 'growth_incentive', label: 'Growth Incentive' },
        { value: 'listing_fee', label: 'Listing Fee' },
        { value: 'marketing_contribution', label: 'Marketing Contribution' },
        { value: 'promotional_allowance', label: 'Promotional Allowance' },
        { value: 'logistics', label: 'Logistics Rebate' }
      ],
      milestoneTypes: [
        { value: 'review', label: 'Contract Review' },
        { value: 'renewal', label: 'Renewal Deadline' },
        { value: 'payment', label: 'Payment Milestone' },
        { value: 'compliance', label: 'Compliance Check' },
        { value: 'performance', label: 'Performance Review' }
      ],
      priorities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    }
  });
});

contractManagement.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const total = await db.prepare('SELECT COUNT(*) as total FROM contracts WHERE company_id = ?').bind(companyId).first();
    const active = await db.prepare("SELECT COUNT(*) as total FROM contracts WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const expiring = await db.prepare("SELECT COUNT(*) as total FROM contracts WHERE company_id = ? AND status = 'active' AND end_date <= date('now', '+30 days')").bind(companyId).first();
    const totalValue = await db.prepare("SELECT COALESCE(SUM(total_value), 0) as total FROM contracts WHERE company_id = ? AND status = 'active'").bind(companyId).first();
    const terms = await db.prepare('SELECT COUNT(*) as total FROM contract_terms WHERE company_id = ?').bind(companyId).first();
    const pendingMilestones = await db.prepare("SELECT COUNT(*) as total FROM contract_milestones WHERE company_id = ? AND status = 'pending'").bind(companyId).first();

    return c.json({
      success: true,
      data: {
        contracts: { total: total?.total || 0, active: active?.total || 0, expiring: expiring?.total || 0 },
        totalActiveValue: totalValue?.total || 0,
        terms: terms?.total || 0,
        pendingMilestones: pendingMilestones?.total || 0
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.get('/contracts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, contract_type, customer_id, search, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM contracts WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (contract_type) { query += ' AND contract_type = ?'; params.push(contract_type); }
    if (customer_id) { query += ' AND customer_id = ?'; params.push(customer_id); }
    if (search) { query += ' AND (name LIKE ? OR contract_number LIKE ? OR customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    const countResult = await db.prepare('SELECT COUNT(*) as total FROM contracts WHERE company_id = ?').bind(companyId).first();

    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: countResult?.total || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.get('/contracts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    const contract = await db.prepare('SELECT * FROM contracts WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!contract) return c.json({ success: false, message: 'Contract not found' }, 404);

    const terms = await db.prepare('SELECT * FROM contract_terms WHERE contract_id = ? AND company_id = ? ORDER BY term_number').bind(id, companyId).all();
    const milestones = await db.prepare('SELECT * FROM contract_milestones WHERE contract_id = ? AND company_id = ? ORDER BY due_date').bind(id, companyId).all();
    const amendments = await db.prepare('SELECT * FROM contract_amendments WHERE contract_id = ? AND company_id = ? ORDER BY created_at DESC').bind(id, companyId).all();

    const doc = rowToDocument(contract);
    doc.terms = (terms.results || []).map(rowToDocument);
    doc.milestones = (milestones.results || []).map(rowToDocument);
    doc.amendments = (amendments.results || []).map(rowToDocument);

    return c.json({ success: true, data: doc });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.post('/contracts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO contracts (id, company_id, contract_number, name, description, contract_type, status, customer_id, customer_name, vendor_id, vendor_name, start_date, end_date, auto_renew, renewal_notice_days, total_value, committed_spend, currency, payment_terms, billing_frequency, owner, department, priority, risk_level, created_by, tags, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.contractNumber || body.contract_number || `CON-${Date.now()}`,
      body.name || '',
      body.description || '',
      body.contractType || body.contract_type || 'trade_agreement',
      body.status || 'draft',
      body.customerId || body.customer_id || null,
      body.customerName || body.customer_name || null,
      body.vendorId || body.vendor_id || null,
      body.vendorName || body.vendor_name || null,
      body.startDate || body.start_date || null,
      body.endDate || body.end_date || null,
      body.autoRenew || body.auto_renew || 0,
      body.renewalNoticeDays || body.renewal_notice_days || 30,
      body.totalValue || body.total_value || 0,
      body.committedSpend || body.committed_spend || 0,
      body.currency || 'ZAR',
      body.paymentTerms || body.payment_terms || null,
      body.billingFrequency || body.billing_frequency || null,
      body.owner || null,
      body.department || null,
      body.priority || 'medium',
      body.riskLevel || body.risk_level || 'low',
      getUserId(c),
      JSON.stringify(body.tags || []),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.put('/contracts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM contracts WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Contract not found' }, 404);

    const fields = [];
    const params = [];
    const fieldMap = {
      name: 'name', description: 'description', contractType: 'contract_type',
      status: 'status', customerName: 'customer_name', vendorName: 'vendor_name',
      startDate: 'start_date', endDate: 'end_date', autoRenew: 'auto_renew',
      renewalNoticeDays: 'renewal_notice_days', totalValue: 'total_value',
      committedSpend: 'committed_spend', actualSpend: 'actual_spend',
      currency: 'currency', paymentTerms: 'payment_terms',
      billingFrequency: 'billing_frequency', owner: 'owner',
      department: 'department', priority: 'priority', riskLevel: 'risk_level',
      complianceStatus: 'compliance_status', approvedBy: 'approved_by',
      approvedAt: 'approved_at', signedBy: 'signed_by', signedAt: 'signed_at',
      notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(body.tags)); }
    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }
    fields.push('updated_at = ?');
    params.push(now, id, companyId);

    await db.prepare(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.delete('/contracts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();

    await db.prepare('DELETE FROM contract_amendments WHERE contract_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM contract_milestones WHERE contract_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM contract_terms WHERE contract_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM contracts WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Contract and associated data deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.get('/terms', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { contract_id, term_type, status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM contract_terms WHERE company_id = ?';
    const params = [companyId];

    if (contract_id) { query += ' AND contract_id = ?'; params.push(contract_id); }
    if (term_type) { query += ' AND term_type = ?'; params.push(term_type); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.post('/terms', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO contract_terms (id, company_id, contract_id, term_number, name, description, term_type, status, product_id, product_name, category, brand, channel, region, rate, rate_type, threshold, cap, tier_structure, calculation_basis, settlement_frequency, effective_date, expiry_date, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.contractId || body.contract_id || null,
      body.termNumber || body.term_number || 1,
      body.name || '',
      body.description || '',
      body.termType || body.term_type || 'volume_rebate',
      body.status || 'active',
      body.productId || body.product_id || null,
      body.productName || body.product_name || null,
      body.category || null,
      body.brand || null,
      body.channel || null,
      body.region || null,
      body.rate || 0,
      body.rateType || body.rate_type || 'percentage',
      body.threshold || 0,
      body.cap || null,
      JSON.stringify(body.tierStructure || body.tier_structure || []),
      body.calculationBasis || body.calculation_basis || 'net_sales',
      body.settlementFrequency || body.settlement_frequency || 'quarterly',
      body.effectiveDate || body.effective_date || null,
      body.expiryDate || body.expiry_date || null,
      getUserId(c),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM contract_terms WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.put('/terms/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM contract_terms WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Term not found' }, 404);

    const fields = [];
    const params = [];
    const fieldMap = {
      name: 'name', description: 'description', termType: 'term_type',
      status: 'status', rate: 'rate', rateType: 'rate_type',
      threshold: 'threshold', cap: 'cap', calculationBasis: 'calculation_basis',
      settlementFrequency: 'settlement_frequency', effectiveDate: 'effective_date',
      expiryDate: 'expiry_date', accruedAmount: 'accrued_amount',
      settledAmount: 'settled_amount', notes: 'notes'
    };

    for (const [camel, col] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) { fields.push(`${col} = ?`); params.push(body[camel]); }
      if (body[col] !== undefined && body[camel] === undefined) { fields.push(`${col} = ?`); params.push(body[col]); }
    }

    if (body.tierStructure !== undefined) { fields.push('tier_structure = ?'); params.push(JSON.stringify(body.tierStructure)); }
    if (body.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(body.data)); }
    fields.push('updated_at = ?');
    params.push(now, id, companyId);

    await db.prepare(`UPDATE contract_terms SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`).bind(...params).run();
    const updated = await db.prepare('SELECT * FROM contract_terms WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.delete('/terms/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM contract_terms WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Term deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.get('/milestones', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { contract_id, status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM contract_milestones WHERE company_id = ?';
    const params = [companyId];

    if (contract_id) { query += ' AND contract_id = ?'; params.push(contract_id); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY due_date ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.post('/milestones', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO contract_milestones (id, company_id, contract_id, name, description, milestone_type, status, due_date, assigned_to, priority, amount, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.contractId || body.contract_id || null,
      body.name || '',
      body.description || '',
      body.milestoneType || body.milestone_type || 'review',
      body.status || 'pending',
      body.dueDate || body.due_date || null,
      body.assignedTo || body.assigned_to || null,
      body.priority || 'medium',
      body.amount || 0,
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM contract_milestones WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.delete('/milestones/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM contract_milestones WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Milestone deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.get('/amendments', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { contract_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM contract_amendments WHERE company_id = ?';
    const params = [companyId];

    if (contract_id) { query += ' AND contract_id = ?'; params.push(contract_id); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.post('/amendments', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO contract_amendments (id, company_id, contract_id, amendment_number, name, description, amendment_type, status, effective_date, field_changed, old_value, new_value, reason, impact_amount, created_by, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId,
      body.contractId || body.contract_id || null,
      body.amendmentNumber || body.amendment_number || 1,
      body.name || '',
      body.description || '',
      body.amendmentType || body.amendment_type || 'modification',
      body.status || 'draft',
      body.effectiveDate || body.effective_date || null,
      body.fieldChanged || body.field_changed || null,
      body.oldValue || body.old_value || null,
      body.newValue || body.new_value || null,
      body.reason || null,
      body.impactAmount || body.impact_amount || 0,
      getUserId(c),
      body.notes || '',
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM contract_amendments WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

contractManagement.delete('/amendments/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM contract_amendments WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Amendment deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { contractManagement as contractManagementRoutes };
