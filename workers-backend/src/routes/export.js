import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const exportRoutes = new Hono();

exportRoutes.use('*', authMiddleware);

exportRoutes.get('/formats', async (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'csv', name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
      { id: 'json', name: 'JSON', extension: '.json', mimeType: 'application/json' },
      { id: 'xlsx', name: 'Excel', extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ]
  });
});

exportRoutes.get('/', async (c) => {
  return c.json({
    success: true,
    data: {
      availableExports: [
        { id: 'promotions', name: 'Promotions', endpoint: '/api/export/promotions' },
        { id: 'budgets', name: 'Budgets', endpoint: '/api/export/budgets' },
        { id: 'trade-spends', name: 'Trade Spends', endpoint: '/api/export/trade-spends' },
        { id: 'customers', name: 'Customers', endpoint: '/api/export/customers' },
        { id: 'products', name: 'Products', endpoint: '/api/export/products' },
        { id: 'simulations', name: 'Simulations', endpoint: '/api/export/simulations' }
      ]
    }
  });
});

// Helper function to convert array of objects to CSV
const toCSV = (data, columns) => {
  if (!data || data.length === 0) return '';
  
  // Use provided columns or extract from first row
  const headers = columns || Object.keys(data[0]).filter(k => !k.startsWith('_'));
  
  // Create header row
  const headerRow = headers.map(h => `"${h}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(h => {
      let value = row[h];
      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

// Export promotions
exportRoutes.get('/promotions', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { status, type } = c.req.query();

    const filter = { companyId: tenantId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const promotions = await mongodb.find('promotions', filter, { sort: { createdAt: -1 } });
    
    const columns = ['id', 'name', 'promotion_type', 'status', 'start_date', 'end_date', 'created_at'];
    const csv = toCSV(promotions, columns);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="promotions_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to export promotions', error: error.message }, 500);
  }
});

// Export budgets
exportRoutes.get('/budgets', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { year, status } = c.req.query();

    const filter = { companyId: tenantId };
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const budgets = await mongodb.find('budgets', filter, { sort: { year: -1 } });
    
    const columns = ['id', 'name', 'year', 'amount', 'utilized', 'status', 'budget_type', 'created_at'];
    const csv = toCSV(budgets, columns);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="budgets_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to export budgets', error: error.message }, 500);
  }
});

// Export trade spends
exportRoutes.get('/trade-spends', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { status, customerId } = c.req.query();

    const filter = { companyId: tenantId };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    const tradeSpends = await mongodb.find('tradespends', filter, { sort: { createdAt: -1 } });
    
    // Enrich with customer names
    const customerIds = [...new Set(tradeSpends.map(ts => ts.customerId || ts.customer_id).filter(Boolean))];
    const customers = customerIds.length > 0 
      ? await mongodb.find('customers', { companyId: tenantId })
      : [];
    const customerMap = Object.fromEntries(customers.map(c => [c.id, c.name]));
    
    const enrichedData = tradeSpends.map(ts => ({
      ...ts,
      customerName: customerMap[ts.customerId || ts.customer_id] || ''
    }));
    
    const columns = ['id', 'spend_type', 'activity_type', 'amount', 'status', 'customerName', 'created_at', 'approved_at'];
    const csv = toCSV(enrichedData, columns);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="trade_spends_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to export trade spends', error: error.message }, 500);
  }
});

// Export customers
exportRoutes.get('/customers', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { status, tier, channel } = c.req.query();

    const filter = { companyId: tenantId };
    if (status) filter.status = status;
    if (tier) filter.tier = tier;
    if (channel) filter.channel = channel;

    const customers = await mongodb.find('customers', filter, { sort: { name: 1 } });
    
    const columns = ['id', 'name', 'code', 'customer_type', 'channel', 'tier', 'region', 'city', 'status', 'created_at'];
    const csv = toCSV(customers, columns);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to export customers', error: error.message }, 500);
  }
});

// Export products
exportRoutes.get('/products', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { status, category, brand } = c.req.query();

    const filter = { companyId: tenantId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    const products = await mongodb.find('products', filter, { sort: { name: 1 } });
    
    const columns = ['id', 'name', 'sku', 'barcode', 'category', 'subcategory', 'brand', 'unit_price', 'cost_price', 'status', 'created_at'];
    const csv = toCSV(products, columns);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to export products', error: error.message }, 500);
  }
});

// Export simulations
exportRoutes.get('/simulations', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const simulations = await mongodb.find('simulations', { companyId: tenantId }, { sort: { created_at: -1 } });
    
    const columns = ['id', 'name', 'simulation_type', 'status', 'created_at'];
    const csv = toCSV(simulations, columns);
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="simulations_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to export simulations', error: error.message }, 500);
  }
});
