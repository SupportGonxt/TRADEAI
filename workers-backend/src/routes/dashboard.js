import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const dashboardRoutes = new Hono();

dashboardRoutes.use('*', authMiddleware);

// Get dashboard overview
dashboardRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    // Get counts and aggregations
    const [
      totalCustomers,
      totalProducts,
      activePromotions,
      pendingApprovals,
      recentTradeSpends
    ] = await Promise.all([
      mongodb.countDocuments('customers', { companyId: tenantId }),
      mongodb.countDocuments('products', { companyId: tenantId }),
      mongodb.countDocuments('promotions', { companyId: tenantId, status: 'active' }),
      mongodb.countDocuments('tradespends', { companyId: tenantId, status: 'pending' }),
      mongodb.find('tradespends', { companyId: tenantId }, { limit: 5, sort: { createdAt: -1 } })
    ]);

    // Get budget utilization - check current year first, fall back to most recent year
    let budgets = await mongodb.find('budgets', { 
      companyId: tenantId, 
      year: new Date().getFullYear() 
    });
    if (budgets.length === 0) {
      budgets = await mongodb.find('budgets', { 
        companyId: tenantId, 
        year: new Date().getFullYear() - 1 
      });
    }
    
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const utilizedBudget = budgets.reduce((sum, b) => sum + (b.utilized || 0), 0);

    return c.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          totalProducts,
          activePromotions,
          pendingApprovals
        },
        budget: {
          total: totalBudget,
          utilized: utilizedBudget,
          remaining: totalBudget - utilizedBudget,
          utilizationRate: totalBudget ? ((utilizedBudget / totalBudget) * 100).toFixed(2) : 0
        },
        recentActivity: recentTradeSpends
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get dashboard', error: error.message }, 500);
  }
});

// Get KPIs
dashboardRoutes.get('/kpis', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Get monthly trade spend
    const monthlySpends = await mongodb.aggregate('tradespends', [
      { $match: { companyId: tenantId, status: 'approved' } },
      { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);

    // Get promotion ROI
    const promotions = await mongodb.find('promotions', { 
      companyId: tenantId, 
      status: { $in: ['completed', 'active'] } 
    });
    
    const avgROI = promotions.length > 0 
      ? promotions.reduce((sum, p) => sum + (p.performance?.roi || 0), 0) / promotions.length 
      : 0;

    return c.json({
      success: true,
      data: {
        monthlySpends,
        averageROI: avgROI.toFixed(2),
        totalPromotions: promotions.length,
        activePromotions: promotions.filter(p => p.status === 'active').length
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get KPIs', error: error.message }, 500);
  }
});

// Get recent activity
dashboardRoutes.get('/activity', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { limit = 20 } = c.req.query();

    const activities = await mongodb.find('activities', 
      { companyId: tenantId }, 
      { limit: parseInt(limit), sort: { createdAt: -1 } }
    );

    return c.json({ success: true, data: activities });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get activity', error: error.message }, 500);
  }
});

// Get notifications
dashboardRoutes.get('/notifications', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);

    const notifications = await mongodb.find('notifications', 
      { companyId: tenantId, userId, read: false }, 
      { limit: 10, sort: { createdAt: -1 } }
    );

    return c.json({ success: true, data: notifications });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get notifications', error: error.message }, 500);
  }
});
