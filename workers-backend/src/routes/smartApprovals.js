import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';

const smartApprovalsRoutes = new Hono();
smartApprovalsRoutes.use('*', authMiddleware);

function calculateRiskScore(item, historicalData) {
  let score = 0;
  const amount = item.amount || 0;

  if (amount > 500000) score += 40;
  else if (amount > 100000) score += 25;
  else if (amount > 50000) score += 15;
  else score += 5;

  if (!item.customer_id && !item.customerId) score += 15;

  const avgAmount = historicalData.length > 0
    ? historicalData.reduce((s, h) => s + (h.amount || 0), 0) / historicalData.length
    : amount;
  if (amount > avgAmount * 2) score += 20;

  if (item.description && item.description.length > 20) score -= 5;
  if (item.notes && item.notes.length > 10) score -= 5;

  return Math.max(0, Math.min(100, score));
}

smartApprovalsRoutes.get('/queue', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const pending = await db.find('approvals', { company_id: user.companyId, status: 'pending' }, { limit: 50 });
    const historical = await db.find('approvals', { company_id: user.companyId, status: 'approved' }, { limit: 100 });
    const queue = pending.map(item => {
      const riskScore = calculateRiskScore(item, historical);
      return {
        id: item.id,
        entityType: item.entity_type,
        entityId: item.entity_id,
        amount: item.amount,
        status: item.status,
        riskScore,
        recommendation: riskScore <= 20 ? 'auto_approve' : riskScore <= 40 ? 'fast_track' : riskScore <= 70 ? 'standard' : 'escalate',
        createdAt: item.created_at
      };
    });
    return c.json({ success: true, data: queue, total: queue.length });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

smartApprovalsRoutes.post('/evaluate', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const { entityType, entityId, amount, customerId, description } = await c.req.json();

    const historical = await db.find(entityType === 'trade_spend' ? 'trade_spends' : entityType === 'claim' ? 'claims' : 'approvals', {
      company_id: user.companyId, status: 'approved'
    }, { limit: 50 });

    const riskScore = calculateRiskScore({ amount, customer_id: customerId, description }, historical);

    let recommendation = 'manual_review';
    let autoApproved = false;
    let reason = '';

    if (riskScore <= 20 && amount <= 25000) {
      recommendation = 'auto_approve';
      autoApproved = true;
      reason = 'Low risk: amount within threshold and consistent with historical patterns';
    } else if (riskScore <= 40) {
      recommendation = 'fast_track';
      reason = 'Medium-low risk: single approver sufficient';
    } else if (riskScore <= 70) {
      recommendation = 'standard';
      reason = 'Standard risk: requires full approval workflow';
    } else {
      recommendation = 'escalate';
      reason = 'High risk: requires senior management review';
    }

    const approvalChain = [];
    if (recommendation === 'auto_approve') {
      approvalChain.push({ role: 'System', action: 'Auto-approved', sla: '0 hours' });
    } else if (recommendation === 'fast_track') {
      approvalChain.push({ role: 'Line Manager', action: 'Approve', sla: '4 hours' });
    } else if (recommendation === 'standard') {
      approvalChain.push({ role: 'Line Manager', action: 'Approve', sla: '24 hours' });
      approvalChain.push({ role: 'Finance', action: 'Approve', sla: '48 hours' });
    } else {
      approvalChain.push({ role: 'Line Manager', action: 'Approve', sla: '24 hours' });
      approvalChain.push({ role: 'Finance Director', action: 'Approve', sla: '48 hours' });
      approvalChain.push({ role: 'CFO / MD', action: 'Approve', sla: '72 hours' });
    }

    return c.json({
      success: true,
      data: {
        riskScore,
        recommendation,
        autoApproved,
        reason,
        approvalChain,
        estimatedSLA: approvalChain.reduce((max, a) => { const h = parseInt(a.sla); return h > max ? h : max; }, 0) + ' hours',
        policyCompliance: riskScore < 50 ? 'compliant' : 'review_required',
        similarApprovals: historical.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Smart approval error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

smartApprovalsRoutes.post('/bulk-evaluate', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);

    const pending = await db.find('approvals', { company_id: user.companyId, status: 'pending' });
    const historical = await db.find('approvals', { company_id: user.companyId, status: 'approved' }, { limit: 100 });

    const results = pending.map(item => {
      const riskScore = calculateRiskScore(item, historical);
      const canAutoApprove = riskScore <= 20 && (item.amount || 0) <= 25000;
      return {
        id: item.id,
        entityType: item.entity_type,
        amount: item.amount,
        riskScore,
        recommendation: canAutoApprove ? 'auto_approve' : riskScore <= 40 ? 'fast_track' : riskScore <= 70 ? 'standard' : 'escalate',
        canAutoApprove
      };
    });

    const autoApprovable = results.filter(r => r.canAutoApprove);
    const needsReview = results.filter(r => !r.canAutoApprove);

    return c.json({
      success: true,
      data: {
        total: pending.length,
        autoApprovable: autoApprovable.length,
        needsReview: needsReview.length,
        results,
        avgRiskScore: results.length > 0 ? (results.reduce((s, r) => s + r.riskScore, 0) / results.length).toFixed(1) : 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { smartApprovalsRoutes };
