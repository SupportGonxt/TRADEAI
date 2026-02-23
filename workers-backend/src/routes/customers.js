import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const customerRoutes = new Hono();

customerRoutes.use('*', authMiddleware);

// Get customer hierarchy for selection components
customerRoutes.get('/hierarchy', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    // Get all customers for this tenant
    const customers = await mongodb.find('customers', { companyId: tenantId }, {
      sort: { name: 1 }
    });

    // Build hierarchy from customer data
    // Group by channel -> subChannel -> customer
    const channelMap = new Map();
    
    customers.forEach(customer => {
      const channel = customer.channel || customer.customer_channel || 'Other';
      const subChannel = customer.subChannel || customer.customer_sub_channel || 'General';
      
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          id: `channel-${channel.toLowerCase().replace(/\s+/g, '-')}`,
          name: channel,
          level: 1,
          revenue: 0,
          children: new Map()
        });
      }
      
      const channelNode = channelMap.get(channel);
      
      if (!channelNode.children.has(subChannel)) {
        channelNode.children.set(subChannel, {
          id: `subchannel-${channel.toLowerCase().replace(/\s+/g, '-')}-${subChannel.toLowerCase().replace(/\s+/g, '-')}`,
          name: subChannel,
          level: 2,
          revenue: 0,
          children: []
        });
      }
      
      const subChannelNode = channelNode.children.get(subChannel);
      const customerRevenue = customer.revenue || customer.annualRevenue || 100000;
      
      subChannelNode.children.push({
        id: customer.id || customer._id,
        name: customer.name,
        level: 3,
        revenue: customerRevenue
      });
      
      subChannelNode.revenue += customerRevenue;
      channelNode.revenue += customerRevenue;
    });

    // Convert Maps to arrays
    const hierarchy = Array.from(channelMap.values()).map(channel => ({
      ...channel,
      children: Array.from(channel.children.values())
    }));

    return c.json({
      success: true,
      hierarchy: hierarchy.length > 0 ? hierarchy : [
        {
          id: 'all-customers',
          name: 'All Customers',
          level: 1,
          revenue: customers.reduce((sum, c) => sum + (c.revenue || c.annualRevenue || 100000), 0),
          children: customers.map(customer => ({
            id: customer.id || customer._id,
            name: customer.name,
            level: 2,
            revenue: customer.revenue || customer.annualRevenue || 100000
          }))
        }
      ]
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get customer hierarchy', error: error.message }, 500);
  }
});

// Get all customers
customerRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, search, status, tier } = c.req.query();

    const filter = { companyId: tenantId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;
    if (tier) filter.tier = tier;

    const customers = await mongodb.find('customers', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { name: 1 }
    });

    // Enrich customers with contactName extracted from various possible locations
    // Note: D1 service's rowToDocument already merges JSON data column into the document at top level
    const enrichedCustomers = customers.map(customer => {
      let contactName = null;
      let contactEmail = null;
      let contactPhone = null;
      
      // First check if contactName is already at top level (merged from JSON data column by D1 service)
      if (customer.contactName) {
        contactName = customer.contactName;
        contactEmail = customer.contactEmail || null;
        contactPhone = customer.contactPhone || null;
      }
      // Fallback: Try to extract from nested data structure if it wasn't merged
      else if (customer.data) {
        const data = typeof customer.data === 'string' ? JSON.parse(customer.data) : customer.data;
        // Check for contactName directly
        if (data.contactName) {
          contactName = data.contactName;
          contactEmail = data.contactEmail || null;
          contactPhone = data.contactPhone || null;
        }
        // Check for contacts array
        else if (data.contacts && data.contacts.length > 0 && data.contacts[0].name) {
          contactName = data.contacts[0].name;
          contactEmail = data.contacts[0].email || null;
          contactPhone = data.contacts[0].phone || null;
        }
      }
      
      return {
        ...customer,
        contactName,
        contactEmail,
        contactPhone
      };
    });

    const total = await mongodb.countDocuments('customers', filter);

    return c.json({
      success: true,
      data: enrichedCustomers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get customers', error: error.message }, 500);
  }
});

// Get customer by ID
customerRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);

    return c.json({ success: true, data: customer });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get customer', error: error.message }, 500);
  }
});

customerRoutes.get('/:id/promotions', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
    const promos = await mongodb.find('promotions', { companyId: tenantId }, { limit: 50, sort: { createdAt: -1 } });
    const filtered = promos.filter(p => {
      const custId = customer.id || customer._id;
      return p.customerId === custId || p.customer_id === custId ||
        (p.customers || []).some(cu => (cu.customer?.id || cu.id) === custId);
    });
    return c.json({ success: true, data: filtered });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerRoutes.get('/:id/budgets', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
    const custId = customer.id || customer._id;
    const budgets = await mongodb.find('budgets', { customerId: custId, companyId: tenantId }, { limit: 50 });
    return c.json({ success: true, data: budgets });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerRoutes.get('/:id/deductions', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
    const custId = customer.id || customer._id;
    const deductions = await mongodb.find('deductions', { customerId: custId, companyId: tenantId }, { limit: 50 });
    return c.json({ success: true, data: deductions });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerRoutes.get('/:id/claims', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
    const custId = customer.id || customer._id;
    const claims = await mongodb.find('claims', { customerId: custId, companyId: tenantId }, { limit: 50 });
    return c.json({ success: true, data: claims });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerRoutes.get('/:id/trade-spends', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
    const custId = customer.id || customer._id;
    const spends = await mongodb.find('tradespends', { customerId: custId, companyId: tenantId }, { limit: 50 });
    return c.json({ success: true, data: spends });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerRoutes.get('/:id/sales-history', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
    return c.json({ success: true, data: customer.salesHistory || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

customerRoutes.get('/:id/trading-terms', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const customer = await mongodb.findOne('customers', { _id: { $oid: id }, companyId: tenantId });
    if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
    return c.json({ success: true, data: customer.tradingTerms || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create customer
customerRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const customerId = await mongodb.insertOne('customers', { ...data, companyId: tenantId, status: 'active' });

    return c.json({ success: true, data: { id: customerId }, message: 'Customer created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create customer', error: error.message }, 500);
  }
});

// Update customer
customerRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('customers', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update customer', error: error.message }, 500);
  }
});

// Delete customer
customerRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('customers', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete customer', error: error.message }, 500);
  }
});
