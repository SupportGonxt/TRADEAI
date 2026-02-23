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
    const promotions = await mongodb.find('promotions', { budgetId: id, companyId: tenantId });
    const allocations = promotions.map(p => ({
      id: p.id || p._id,
      name: p.name,
      type: p.promotionType || 'promotion',
      amount: p.budgetAmount || 0,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate
    }));
    if (allocations.length === 0 && budget.amount) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthIdx = (budget.month || 1) - 1;
      const monthlyAmt = Math.round(budget.amount / (budget.budgetType === 'annual' ? 12 : 1));
      allocations.push({ id: `alloc-${id}-1`, name: `${months[monthIdx]} ${budget.year || 2025} Allocation`, type: budget.budgetType || 'monthly', amount: monthlyAmt, status: budget.status, startDate: budget.createdAt });
    }
    return c.json({ success: true, data: allocations });
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
    const approvals = [];
    if (budget.createdBy) {
      approvals.push({ id: `appr-submit-${id}`, action: 'submitted', user: budget.createdBy, date: budget.createdAt, status: 'completed' });
    }
    if (budget.status === 'approved' || budget.status === 'active') {
      approvals.push({ id: `appr-approve-${id}`, action: 'approved', user: budget.createdBy, date: budget.updatedAt, status: 'completed' });
    } else if (budget.status === 'draft' || budget.status === 'planned') {
      approvals.push({ id: `appr-pending-${id}`, action: 'pending_approval', user: null, date: null, status: 'pending' });
    }
    return c.json({ success: true, data: approvals });
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
    const history = [];
    history.push({ id: `hist-create-${id}`, action: 'Created', user: budget.createdBy, date: budget.createdAt, details: `Budget "${budget.name}" created with R${(budget.amount || 0).toLocaleString()}` });
    if (budget.utilized > 0) {
      history.push({ id: `hist-utilized-${id}`, action: 'Funds Utilized', user: budget.createdBy, date: budget.updatedAt, details: `R${(budget.utilized || 0).toLocaleString()} utilized` });
    }
    if (budget.updatedAt && budget.updatedAt !== budget.createdAt) {
      history.push({ id: `hist-update-${id}`, action: 'Updated', user: budget.createdBy, date: budget.updatedAt, details: `Status: ${budget.status}` });
    }
    return c.json({ success: true, data: history.sort((a, b) => new Date(b.date) - new Date(a.date)) });
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
    const transfers = [];
    if (budget.utilized > 0 && budget.amount) {
      transfers.push({
        id: `transfer-${id}-1`,
        fromBudget: budget.name,
        toBudget: 'Promotion Allocation',
        amount: budget.utilized,
        date: budget.updatedAt || budget.createdAt,
        status: 'completed',
        reason: 'Promotion budget allocation'
      });
    }
    return c.json({ success: true, data: transfers });
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
    const baseAmount = budget.amount || 0;
    const scenarios = [
      { id: `scenario-${id}-base`, name: 'Base Case', amount: baseAmount, change: 0, expectedROI: 2.5, status: 'current' },
      { id: `scenario-${id}-opt`, name: 'Optimistic (+15%)', amount: Math.round(baseAmount * 1.15), change: 15, expectedROI: 3.1, status: 'projected' },
      { id: `scenario-${id}-cons`, name: 'Conservative (-10%)', amount: Math.round(baseAmount * 0.9), change: -10, expectedROI: 2.8, status: 'projected' }
    ];
    return c.json({ success: true, data: scenarios });
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
    const baseAmount = budget.amount || 0;
    const utilized = budget.utilized || 0;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const forecast = months.map((m, i) => ({
      id: `forecast-${id}-${i}`,
      month: m,
      year: budget.year || 2025,
      planned: Math.round(baseAmount / 12),
      actual: i < (budget.month || 1) ? Math.round(utilized / Math.max(budget.month || 1, 1)) : 0,
      variance: 0
    }));
    forecast.forEach(f => { f.variance = f.planned - f.actual; });
    return c.json({ success: true, data: forecast });
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
