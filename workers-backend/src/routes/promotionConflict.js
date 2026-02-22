import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';

const promotionConflictRoutes = new Hono();
promotionConflictRoutes.use('*', authMiddleware);

promotionConflictRoutes.get('/check', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const promotions = await db.find('promotions', {
      company_id: user.companyId,
      status: { $in: ['active', 'approved', 'pending_approval'] }
    });
    const conflicts = [];
    for (let i = 0; i < promotions.length; i++) {
      for (let j = i + 1; j < promotions.length; j++) {
        const a = promotions[i], b = promotions[j];
        const aStart = new Date(a.start_date || a.created_at);
        const aEnd = new Date(a.end_date || Date.now() + 30 * 86400000);
        const bStart = new Date(b.start_date || b.created_at);
        const bEnd = new Date(b.end_date || Date.now() + 30 * 86400000);
        if (aStart <= bEnd && aEnd >= bStart) {
          conflicts.push({
            promotionA: { id: a.id, name: a.name, status: a.status },
            promotionB: { id: b.id, name: b.name, status: b.status },
            overlapDays: Math.max(0, Math.ceil((Math.min(aEnd, bEnd) - Math.max(aStart, bStart)) / 86400000)),
            severity: a.customer_id && b.customer_id && a.customer_id === b.customer_id ? 'high' : 'low'
          });
        }
      }
    }
    return c.json({ success: true, data: { conflicts, total: conflicts.length } });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

promotionConflictRoutes.post('/check', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const { customerId, productIds, startDate, endDate, promotionType, excludeId } = await c.req.json();

    const promotions = await db.find('promotions', {
      company_id: user.companyId,
      status: { $in: ['active', 'approved', 'pending_approval', 'draft'] }
    });

    const conflicts = [];
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    for (const promo of promotions) {
      if (excludeId && promo.id === excludeId) continue;

      const pData = typeof promo.data === 'string' ? JSON.parse(promo.data || '{}') : (promo.data || {});
      const pStart = new Date(pData.startDate || promo.start_date || promo.created_at);
      const pEnd = new Date(pData.endDate || promo.end_date || Date.now() + 30 * 86400000);

      const datesOverlap = newStart <= pEnd && newEnd >= pStart;
      if (!datesOverlap) continue;

      const overlapDays = Math.ceil(Math.min(newEnd, pEnd).getTime() - Math.max(newStart, pStart).getTime()) / 86400000;

      let conflictType = null;
      let severity = 'low';
      let reason = '';

      const promoCustomerId = pData.customerId || promo.customer_id;
      if (customerId && promoCustomerId && customerId === promoCustomerId) {
        conflictType = 'customer_overlap';
        severity = 'high';
        reason = `Both promotions target the same customer during overlapping dates (${overlapDays} days overlap)`;
      }

      if (productIds && productIds.length > 0 && pData.productIds) {
        const overlappingProducts = productIds.filter(pid => pData.productIds.includes(pid));
        if (overlappingProducts.length > 0) {
          conflictType = conflictType ? 'full_overlap' : 'product_overlap';
          severity = conflictType === 'full_overlap' ? 'critical' : 'high';
          reason = conflictType === 'full_overlap'
            ? `Same customer AND ${overlappingProducts.length} overlapping products — high cannibalization risk`
            : `${overlappingProducts.length} product(s) overlap during ${overlapDays} days — cannibalization risk`;
        }
      }

      if (promotionType && promo.promotion_type === promotionType && datesOverlap && !conflictType) {
        conflictType = 'type_overlap';
        severity = 'medium';
        reason = `Same promotion type (${promotionType}) running concurrently — may dilute impact`;
      }

      if (!conflictType && datesOverlap) {
        conflictType = 'date_overlap';
        severity = 'low';
        reason = `Date overlap of ${overlapDays} days — verify no market saturation`;
      }

      if (conflictType) {
        conflicts.push({
          conflictType,
          severity,
          reason,
          existingPromotion: {
            id: promo.id,
            name: promo.name,
            type: promo.promotion_type,
            status: promo.status,
            startDate: pData.startDate || promo.start_date,
            endDate: pData.endDate || promo.end_date,
            customerId: promoCustomerId
          },
          overlapDays: Math.max(0, overlapDays)
        });
      }
    }

    conflicts.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    });

    const hasBlocker = conflicts.some(c => c.severity === 'critical');
    const hasWarning = conflicts.some(c => c.severity === 'high' || c.severity === 'medium');

    return c.json({
      success: true,
      data: {
        conflicts,
        summary: {
          total: conflicts.length,
          critical: conflicts.filter(c => c.severity === 'critical').length,
          high: conflicts.filter(c => c.severity === 'high').length,
          medium: conflicts.filter(c => c.severity === 'medium').length,
          low: conflicts.filter(c => c.severity === 'low').length
        },
        recommendation: hasBlocker ? 'block' : hasWarning ? 'warn' : 'clear',
        message: hasBlocker
          ? 'Critical conflicts detected — resolve before proceeding'
          : hasWarning
            ? 'Potential conflicts detected — review before proceeding'
            : 'No significant conflicts found',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Promotion conflict check error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { promotionConflictRoutes };
