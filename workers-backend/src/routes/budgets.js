import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const budgetRoutes = new Hono();

budgetRoutes.use('*', authMiddleware);

// Get all budgets
budgetRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, year, status } = c.req.query();

    const filter = { companyId: tenantId };
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const budgets = await mongodb.find('budgets', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { year: -1, createdAt: -1 }
    });

    // Enrich budgets with customerName (use budget name or type as fallback since budgets are company-level)
    const enrichedBudgets = budgets.map(budget => {
      // Format budget type for display (e.g., "annual" -> "Annual Budget", "promotional" -> "Promotional")
      const budgetTypeLabels = {
        annual: 'Annual Budget',
        promotional: 'Promotional',
        listing: 'Listing Fees',
        rebate: 'Rebate Program',
        growth: 'Growth Initiative'
      };
      const customerName = budgetTypeLabels[budget.budgetType || budget.budget_type] || budget.name || 'Company Budget';
      
      return {
        ...budget,
        customerName
      };
    });

    const total = await mongodb.countDocuments('budgets', filter);

    return c.json({
      success: true,
      data: enrichedBudgets,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get budgets', error: error.message }, 500);
  }
});

// Get budget by ID
budgetRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);

    return c.json({ success: true, data: budget });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get budget', error: error.message }, 500);
  }
});

// Create budget
budgetRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const budgetId = await mongodb.insertOne('budgets', {
      ...data,
      companyId: tenantId,
      createdBy: userId,
      status: 'draft',
      utilized: 0
    });

    return c.json({ success: true, data: { id: budgetId }, message: 'Budget created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create budget', error: error.message }, 500);
  }
});

// Update budget
budgetRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('budgets', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Budget updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update budget', error: error.message }, 500);
  }
});

// Delete budget
budgetRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('budgets', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete budget', error: error.message }, 500);
  }
});

// Clone budget
budgetRoutes.post('/:id/clone', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);
    const body = await c.req.json().catch(() => ({}));

    const original = await mongodb.findOne('budgets', { id: id, companyId: tenantId });
    if (!original) return c.json({ success: false, message: 'Budget not found' }, 404);

    const clonedBudget = {
      ...original,
      id: `budget-${Date.now()}`,
      name: body.name || `${original.name} (Copy)`,
      year: body.year || new Date().getFullYear(),
      status: 'draft',
      utilized: 0,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    delete clonedBudget._id;

    await mongodb.insertOne('budgets', clonedBudget);

    return c.json({ 
      success: true, 
      data: { id: clonedBudget.id },
      message: 'Budget cloned successfully' 
    }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to clone budget', error: error.message }, 500);
  }
});

budgetRoutes.get('/:id/allocations', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);
    return c.json({ success: true, data: budget.allocations || budget.monthlyAllocations || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

budgetRoutes.get('/:id/approvals', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);
    return c.json({ success: true, data: budget.approvals || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

budgetRoutes.get('/:id/spending', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);
    const tradeSpends = await mongodb.find('tradespends', { budgetId: id, companyId: tenantId });
    const spending = {
      totalBudget: budget.amount || budget.totalAmount || 0,
      totalSpent: tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0),
      items: tradeSpends.map(ts => ({
        id: ts._id || ts.id,
        name: ts.name || ts.spendType || 'Trade Spend',
        amount: ts.amount || 0,
        status: ts.status,
        date: ts.createdAt
      }))
    };
    spending.remaining = spending.totalBudget - spending.totalSpent;
    spending.utilizationRate = spending.totalBudget > 0 ? ((spending.totalSpent / spending.totalBudget) * 100).toFixed(1) : '0.0';
    return c.json({ success: true, data: spending });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

budgetRoutes.get('/:id/history', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);
    return c.json({ success: true, data: budget.history || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

budgetRoutes.get('/:id/transfers', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);
    return c.json({ success: true, data: budget.transfers || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

budgetRoutes.get('/:id/scenarios', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);
    return c.json({ success: true, data: budget.scenarios || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

budgetRoutes.get('/:id/forecast', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);
    return c.json({ success: true, data: budget.forecast || budget.forecasts || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Get budget utilization
budgetRoutes.get('/:id/utilization', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const budget = await mongodb.findOne('budgets', { _id: { $oid: id }, companyId: tenantId });
    if (!budget) return c.json({ success: false, message: 'Budget not found' }, 404);

    // Get related trade spends
    const tradeSpends = await mongodb.find('tradespends', { budgetId: id, companyId: tenantId });
    const utilized = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const utilizationRate = budget.amount ? (utilized / budget.amount) * 100 : 0;

    return c.json({
      success: true,
      data: {
        budgetId: id,
        totalBudget: budget.amount || 0,
        utilized,
        remaining: (budget.amount || 0) - utilized,
        utilizationRate: utilizationRate.toFixed(2)
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get budget utilization', error: error.message }, 500);
  }
});
