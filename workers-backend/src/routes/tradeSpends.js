import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const tradeSpendRoutes = new Hono();

tradeSpendRoutes.use('*', authMiddleware);

// Get all trade spends
tradeSpendRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, status, customerId, promotionId } = c.req.query();

    const filter = { companyId: tenantId };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (promotionId) filter.promotionId = promotionId;

    const tradeSpends = await mongodb.find('tradespends', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });

    // Enrich trade spends with customer names and promotion details
    // Note: D1 service's rowToDocument already merges JSON data column into the document at top level
    const enrichedTradeSpends = await Promise.all(tradeSpends.map(async (ts) => {
      let customerName = null;
      let startDate = null;
      
      // Get customer name if customer_id exists
      if (ts.customerId || ts.customer_id) {
        const customer = await mongodb.findOne('customers', { 
          id: ts.customerId || ts.customer_id,
          companyId: tenantId 
        });
        if (customer) {
          customerName = customer.name;
        }
      }
      
      // First check if startDate is already at top level (merged from JSON data column by D1 service)
      if (ts.startDate) {
        startDate = ts.startDate;
      }
      // Fallback: Get promotion start date if promotion_id exists
      else if (ts.promotionId || ts.promotion_id) {
        const promotion = await mongodb.findOne('promotions', { 
          id: ts.promotionId || ts.promotion_id,
          companyId: tenantId 
        });
        if (promotion) {
          startDate = promotion.startDate || promotion.start_date;
        }
      }
      
      return {
        ...ts,
        customerName,
        startDate
      };
    }));

    const total = await mongodb.countDocuments('tradespends', filter);

    return c.json({
      success: true,
      data: enrichedTradeSpends,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get trade spends', error: error.message }, 500);
  }
});

// Get trade spend by ID
tradeSpendRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const tradeSpend = await mongodb.findOne('tradespends', { _id: { $oid: id }, companyId: tenantId });
    if (!tradeSpend) return c.json({ success: false, message: 'Trade spend not found' }, 404);

    return c.json({ success: true, data: tradeSpend });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get trade spend', error: error.message }, 500);
  }
});

// Create trade spend
tradeSpendRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const tradeSpendId = await mongodb.insertOne('tradespends', {
      ...data,
      companyId: tenantId,
      createdBy: userId,
      status: 'pending'
    });

    return c.json({ success: true, data: { id: tradeSpendId }, message: 'Trade spend created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create trade spend', error: error.message }, 500);
  }
});

// Update trade spend
tradeSpendRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('tradespends', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Trade spend updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update trade spend', error: error.message }, 500);
  }
});

// Delete trade spend
tradeSpendRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('tradespends', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Trade spend deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete trade spend', error: error.message }, 500);
  }
});

// Clone trade spend
tradeSpendRoutes.post('/:id/clone', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);
    const body = await c.req.json().catch(() => ({}));

    const original = await mongodb.findOne('tradespends', { id: id, companyId: tenantId });
    if (!original) return c.json({ success: false, message: 'Trade spend not found' }, 404);

    // Create clone with optional date shift
    const dateShiftDays = body.dateShiftDays || 0;
    const shiftDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      date.setDate(date.getDate() + dateShiftDays);
      return date.toISOString().split('T')[0];
    };

    const clonedTradeSpend = {
      ...original,
      id: `ts-${Date.now()}`,
      name: body.name || `${original.name || 'Trade Spend'} (Copy)`,
      status: 'pending',
      startDate: shiftDate(original.startDate),
      endDate: shiftDate(original.endDate),
      created_by: userId,
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    delete clonedTradeSpend._id;

    await mongodb.insertOne('tradespends', clonedTradeSpend);

    return c.json({ 
      success: true, 
      data: { id: clonedTradeSpend.id },
      message: 'Trade spend cloned successfully' 
    }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to clone trade spend', error: error.message }, 500);
  }
});

tradeSpendRoutes.get('/:id/performance', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const ts = await mongodb.findOne('tradespends', { _id: { $oid: id }, companyId: tenantId });
    if (!ts) return c.json({ success: false, message: 'Trade spend not found' }, 404);
    return c.json({ success: true, data: ts.performance || {
      amount: ts.amount || 0,
      status: ts.status,
      roi: ts.roi || 0,
      uplift: ts.uplift || 0,
      incrementalRevenue: ts.incrementalRevenue || 0
    }});
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

tradeSpendRoutes.get('/:id/approvals', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const ts = await mongodb.findOne('tradespends', { _id: { $oid: id }, companyId: tenantId });
    if (!ts) return c.json({ success: false, message: 'Trade spend not found' }, 404);
    const approvals = [];
    if (ts.createdBy) {
      approvals.push({ id: `appr-submit-${id}`, action: 'submitted', user: ts.createdBy, date: ts.createdAt, status: 'completed' });
    }
    if (ts.approvedBy) {
      approvals.push({ id: `appr-approve-${id}`, action: 'approved', user: ts.approvedBy, date: ts.approvedAt, status: 'completed' });
    }
    if (ts.rejectedBy) {
      approvals.push({ id: `appr-reject-${id}`, action: 'rejected', user: ts.rejectedBy, date: ts.rejectedAt, reason: ts.rejectionReason, status: 'completed' });
    }
    if (approvals.length <= 1 && ts.status === 'draft') {
      approvals.push({ id: `appr-pending-${id}`, action: 'pending_approval', user: null, date: null, status: 'pending' });
    }
    return c.json({ success: true, data: approvals });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

tradeSpendRoutes.get('/:id/history', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const ts = await mongodb.findOne('tradespends', { _id: { $oid: id }, companyId: tenantId });
    if (!ts) return c.json({ success: false, message: 'Trade spend not found' }, 404);
    const history = [];
    history.push({ id: `hist-create-${id}`, action: 'Created', user: ts.createdBy, date: ts.createdAt, details: `Trade spend ${ts.spendId || ''} created for R${(ts.amount || 0).toLocaleString()}` });
    if (ts.approvedBy) {
      history.push({ id: `hist-approve-${id}`, action: 'Approved', user: ts.approvedBy, date: ts.approvedAt, details: 'Trade spend approved' });
    }
    if (ts.rejectedBy) {
      history.push({ id: `hist-reject-${id}`, action: 'Rejected', user: ts.rejectedBy, date: ts.rejectedAt, details: ts.rejectionReason || 'Trade spend rejected' });
    }
    if (ts.updatedAt && ts.updatedAt !== ts.createdAt) {
      history.push({ id: `hist-update-${id}`, action: 'Updated', user: ts.createdBy, date: ts.updatedAt, details: `Status: ${ts.status}` });
    }
    return c.json({ success: true, data: history.sort((a, b) => new Date(b.date) - new Date(a.date)) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

tradeSpendRoutes.get('/:id/documents', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const ts = await mongodb.findOne('tradespends', { _id: { $oid: id }, companyId: tenantId });
    if (!ts) return c.json({ success: false, message: 'Trade spend not found' }, 404);
    const documents = [];
    if (ts.promotionId) {
      documents.push({ id: `doc-promo-${id}`, name: 'Linked Promotion', type: 'promotion', createdAt: ts.createdAt });
    }
    if (ts.budgetId) {
      documents.push({ id: `doc-budget-${id}`, name: 'Budget Allocation', type: 'budget', createdAt: ts.createdAt });
    }
    if (ts.approvedBy) {
      documents.push({ id: `doc-approval-${id}`, name: 'Approval Record', type: 'approval', createdAt: ts.approvedAt || ts.updatedAt });
    }
    return c.json({ success: true, data: documents });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

tradeSpendRoutes.get('/:id/accruals', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const ts = await mongodb.findOne('tradespends', { _id: { $oid: id }, companyId: tenantId });
    if (!ts) return c.json({ success: false, message: 'Trade spend not found' }, 404);
    const accruals = [];
    if (ts.amount) {
      const startDate = ts.startDate ? new Date(ts.startDate) : new Date(ts.createdAt);
      const monthName = startDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      accruals.push({
        id: `accrual-${id}-1`,
        period: monthName,
        amount: ts.amount,
        status: ts.status === 'approved' ? 'posted' : 'accrued',
        postingDate: ts.approvedAt || ts.createdAt,
        glAccount: '4100-Trade Promotion',
        description: `${ts.spendType || 'Trade'} spend - ${ts.customerName || ts.customerId || 'Customer'}`
      });
    }
    return c.json({ success: true, data: accruals });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Approve trade spend
tradeSpendRoutes.post('/:id/approve', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('tradespends', { _id: { $oid: id }, companyId: tenantId }, {
      status: 'approved',
      approvedBy: userId,
      approvedAt: new Date().toISOString()
    });

    return c.json({ success: true, message: 'Trade spend approved successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to approve trade spend', error: error.message }, 500);
  }
});

// Reject trade spend
tradeSpendRoutes.post('/:id/reject', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const { reason } = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('tradespends', { _id: { $oid: id }, companyId: tenantId }, {
      status: 'rejected',
      rejectedBy: userId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });

    return c.json({ success: true, message: 'Trade spend rejected successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to reject trade spend', error: error.message }, 500);
  }
});
