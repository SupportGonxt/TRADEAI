import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const promotionRoutes = new Hono();

promotionRoutes.use('*', authMiddleware);

// Get all promotions
promotionRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, search, status, type } = c.req.query();

    const filter = { companyId: tenantId };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const promotions = await mongodb.find('promotions', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });

    const total = await mongodb.countDocuments('promotions', filter);

    return c.json({
      success: true,
      data: promotions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get promotions', error: error.message }, 500);
  }
});

// Get promotion by ID
promotionRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);

    return c.json({ success: true, data: promotion });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get promotion', error: error.message }, 500);
  }
});

// Create promotion
promotionRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const promotionId = await mongodb.insertOne('promotions', {
      ...data,
      companyId: tenantId,
      createdBy: userId,
      status: data.status || 'draft'
    });

    return c.json({ success: true, data: { id: promotionId }, message: 'Promotion created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create promotion', error: error.message }, 500);
  }
});

// Update promotion
promotionRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('promotions', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Promotion updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update promotion', error: error.message }, 500);
  }
});

// Delete promotion
promotionRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('promotions', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete promotion', error: error.message }, 500);
  }
});

// Clone promotion
promotionRoutes.post('/:id/clone', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);
    const body = await c.req.json().catch(() => ({}));

    const original = await mongodb.findOne('promotions', { id: id, companyId: tenantId });
    if (!original) return c.json({ success: false, message: 'Promotion not found' }, 404);

    // Create clone with optional date shift
    const dateShiftDays = body.dateShiftDays || 0;
    const shiftDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      date.setDate(date.getDate() + dateShiftDays);
      return date.toISOString().split('T')[0];
    };

    const clonedPromotion = {
      ...original,
      id: `promo-${Date.now()}`,
      name: body.name || `${original.name} (Copy)`,
      status: 'draft',
      start_date: shiftDate(original.start_date),
      end_date: shiftDate(original.end_date),
      sell_in_start_date: shiftDate(original.sell_in_start_date),
      sell_in_end_date: shiftDate(original.sell_in_end_date),
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    delete clonedPromotion._id;

    await mongodb.insertOne('promotions', clonedPromotion);

    return c.json({ 
      success: true, 
      data: { id: clonedPromotion.id },
      message: 'Promotion cloned successfully' 
    }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to clone promotion', error: error.message }, 500);
  }
});

promotionRoutes.get('/:id/products', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const products = [];
    if (promotion.productId) {
      const product = await mongodb.findOne('products', { id: promotion.productId, companyId: tenantId });
      if (product) {
        products.push({
          id: product.id || product._id,
          product: { id: product.id || product._id, name: product.name, sku: product.sku || product.code },
          regularPrice: product.unitPrice || 0,
          promotionalPrice: (product.unitPrice || 0) * 0.85,
          expectedLift: promotion.preEvaluation?.expectedLift || 15
        });
      }
    }
    return c.json({ success: true, data: products });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.delete('/:id/products/:productId', async (c) => {
  try {
    const { id, productId } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const products = (promotion.products || []).filter(p => (p.product?.id || p.product?._id || p.id) !== productId);
    await mongodb.updateOne('promotions', { _id: { $oid: id }, companyId: tenantId }, { products });
    return c.json({ success: true, message: 'Product removed' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.get('/:id/customers', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const customers = [];
    if (promotion.customerId) {
      const customer = await mongodb.findOne('customers', { id: promotion.customerId, companyId: tenantId });
      if (customer) {
        customers.push({
          id: customer.id || customer._id,
          customer: { id: customer.id || customer._id, name: customer.name, code: customer.code, type: customer.customerType || customer.channel },
          stores: customer.hierarchy ? [customer.hierarchy] : []
        });
      }
    }
    return c.json({ success: true, data: customers });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.delete('/:id/customers/:customerId', async (c) => {
  try {
    const { id, customerId } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const customers = (promotion.customers || []).filter(cu => (cu.customer?.id || cu.customer?._id || cu.id) !== customerId);
    await mongodb.updateOne('promotions', { _id: { $oid: id }, companyId: tenantId }, { customers });
    return c.json({ success: true, message: 'Customer removed' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.get('/:id/budget', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const totalBudget = promotion.budgetAmount || 0;
    let allocatedBudget = totalBudget;
    let spentBudget = 0;
    if (promotion.budgetId) {
      const linkedBudget = await mongodb.findOne('budgets', { _id: { $oid: promotion.budgetId }, companyId: tenantId });
      if (linkedBudget) {
        allocatedBudget = linkedBudget.utilized || totalBudget;
      }
    }
    const tradeSpends = await mongodb.find('tradespends', { promotionId: id, companyId: tenantId });
    spentBudget = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    return c.json({ success: true, data: {
      totalBudget,
      allocatedBudget,
      spentBudget,
      remainingBudget: totalBudget - spentBudget,
      currency: 'ZAR'
    }});
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.get('/:id/documents', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const documents = [];
    if (promotion.budgetId) {
      documents.push({ id: `doc-budget-${id}`, name: 'Budget Allocation', type: 'budget', createdAt: promotion.createdAt });
    }
    if (promotion.approvedBy) {
      documents.push({ id: `doc-approval-${id}`, name: 'Approval Record', type: 'approval', createdAt: promotion.approvedAt || promotion.updatedAt });
    }
    return c.json({ success: true, data: documents });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.delete('/:id/documents/:documentId', async (c) => {
  try {
    const { id, documentId } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const documents = (promotion.documents || []).filter(d => (d._id || d.id) !== documentId);
    await mongodb.updateOne('promotions', { _id: { $oid: id }, companyId: tenantId }, { documents });
    return c.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.get('/:id/approvals', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const approvals = [];
    if (promotion.createdBy) {
      approvals.push({ id: `appr-submit-${id}`, action: 'submitted', user: promotion.createdBy, date: promotion.createdAt, status: 'completed' });
    }
    if (promotion.approvedBy) {
      approvals.push({ id: `appr-approve-${id}`, action: 'approved', user: promotion.approvedBy, date: promotion.approvedAt, status: 'completed' });
    }
    if (promotion.rejectedBy) {
      approvals.push({ id: `appr-reject-${id}`, action: 'rejected', user: promotion.rejectedBy, date: promotion.rejectedAt, reason: promotion.rejectionReason, status: 'completed' });
    }
    if (approvals.length === 0 && promotion.status === 'draft') {
      approvals.push({ id: `appr-pending-${id}`, action: 'pending_submission', user: promotion.createdBy, date: null, status: 'pending' });
    }
    return c.json({ success: true, data: approvals });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionRoutes.get('/:id/history', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);
    const history = [];
    history.push({ id: `hist-create-${id}`, action: 'Created', user: promotion.createdBy, date: promotion.createdAt, details: `Promotion "${promotion.name}" created` });
    if (promotion.approvedBy) {
      history.push({ id: `hist-approve-${id}`, action: 'Approved', user: promotion.approvedBy, date: promotion.approvedAt, details: 'Promotion approved' });
    }
    if (promotion.rejectedBy) {
      history.push({ id: `hist-reject-${id}`, action: 'Rejected', user: promotion.rejectedBy, date: promotion.rejectedAt, details: promotion.rejectionReason || 'Promotion rejected' });
    }
    if (promotion.updatedAt && promotion.updatedAt !== promotion.createdAt) {
      history.push({ id: `hist-update-${id}`, action: 'Updated', user: promotion.createdBy, date: promotion.updatedAt, details: `Status: ${promotion.status}` });
    }
    return c.json({ success: true, data: history.sort((a, b) => new Date(b.date) - new Date(a.date)) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get promotion performance
promotionRoutes.get('/:id/performance', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const promotion = await mongodb.findOne('promotions', { _id: { $oid: id }, companyId: tenantId });
    if (!promotion) return c.json({ success: false, message: 'Promotion not found' }, 404);

    // Get related trade spends
    const tradeSpends = await mongodb.find('tradespends', { promotionId: id, companyId: tenantId });
    
    const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const roi = promotion.performance?.roi || ((promotion.revenue || 0) - totalSpend) / (totalSpend || 1) * 100;

    return c.json({
      success: true,
      data: {
        promotionId: id,
        totalSpend,
        revenue: promotion.revenue || 0,
        roi,
        uplift: promotion.performance?.uplift || 0,
        status: promotion.status
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get promotion performance', error: error.message }, 500);
  }
});
