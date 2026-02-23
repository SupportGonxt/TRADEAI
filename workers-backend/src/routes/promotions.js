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
    return c.json({ success: true, data: promotion.products || [] });
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
    return c.json({ success: true, data: promotion.customers || [] });
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
    const budget = promotion.budget || promotion.financial || {
      totalBudget: promotion.estimatedCost || 0,
      allocatedBudget: promotion.allocatedBudget || 0,
      spentBudget: promotion.actualCost || promotion.financial?.actual?.totalCost || 0,
      remainingBudget: (promotion.estimatedCost || 0) - (promotion.actualCost || 0),
      currency: 'ZAR'
    };
    return c.json({ success: true, data: budget });
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
    return c.json({ success: true, data: promotion.documents || [] });
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
    return c.json({ success: true, data: promotion.approvals || [] });
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
    return c.json({ success: true, data: promotion.history || [] });
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
