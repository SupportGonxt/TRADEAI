import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const cannibalizationHaloRoutes = new Hono();
cannibalizationHaloRoutes.use('*', authMiddleware);

function mapAnalysisRow(r) {
  return {
    id: r.id, companyId: r.company_id, name: r.name, description: r.description,
    analysisType: r.analysis_type, promotionId: r.promotion_id, promotionName: r.promotion_name,
    periodStart: r.period_start, periodEnd: r.period_end, focalProductId: r.focal_product_id,
    focalProductName: r.focal_product_name, focalCategory: r.focal_category, focalBrand: r.focal_brand,
    totalProductsAnalyzed: r.total_products_analyzed, cannibalizedCount: r.cannibalized_count,
    haloCount: r.halo_count, neutralCount: r.neutral_count, netImpact: r.net_impact,
    netImpactPct: r.net_impact_pct, confidenceScore: r.confidence_score, methodology: r.methodology,
    status: r.status, tags: r.tags, notes: r.notes, data: r.data,
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at
  };
}

function mapEffectRow(r) {
  return {
    id: r.id, companyId: r.company_id, analysisId: r.analysis_id, productId: r.product_id,
    productName: r.product_name, category: r.category, brand: r.brand, effectType: r.effect_type,
    baselineSales: r.baseline_sales, actualSales: r.actual_sales, salesChange: r.sales_change,
    salesChangePct: r.sales_change_pct, baselineVolume: r.baseline_volume, actualVolume: r.actual_volume,
    volumeChange: r.volume_change, volumeChangePct: r.volume_change_pct, priceElasticity: r.price_elasticity,
    crossElasticity: r.cross_elasticity, substitutionRate: r.substitution_rate,
    complementarityRate: r.complementarity_rate, confidence: r.confidence,
    statisticalSignificance: r.statistical_significance, notes: r.notes, data: r.data,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
}

function mapMatrixRow(r) {
  return {
    id: r.id, companyId: r.company_id, analysisId: r.analysis_id, name: r.name,
    matrixType: r.matrix_type, periodStart: r.period_start, periodEnd: r.period_end,
    dimension: r.dimension, rowId: r.row_id, rowName: r.row_name, colId: r.col_id,
    colName: r.col_name, correlation: r.correlation, liftCoefficient: r.lift_coefficient,
    interactionType: r.interaction_type, sampleSize: r.sample_size, pValue: r.p_value,
    notes: r.notes, data: r.data, createdAt: r.created_at, updatedAt: r.updated_at
  };
}

cannibalizationHaloRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      analysisTypes: ['cannibalization', 'halo', 'combined', 'portfolio'],
      effectTypes: ['cannibalized', 'halo', 'neutral', 'complementary', 'substitute'],
      methodologies: ['difference_in_differences', 'regression', 'matched_market', 'time_series', 'bayesian'],
      matrixTypes: ['correlation', 'elasticity', 'lift', 'affinity'],
      statuses: ['draft', 'in_progress', 'completed', 'archived']
    }
  });
});

cannibalizationHaloRoutes.get('/summary', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  try {
    const analyses = await db.rawQuery('SELECT COUNT(*) as count FROM cannibalization_analyses WHERE company_id = ?', [companyId]);
    const effects = await db.rawQuery('SELECT COUNT(*) as count FROM product_effects WHERE company_id = ?', [companyId]);
    const cannibalized = await db.rawQuery('SELECT COUNT(*) as count FROM product_effects WHERE company_id = ? AND effect_type = ?', [companyId, 'cannibalized']);
    const halo = await db.rawQuery('SELECT COUNT(*) as count FROM product_effects WHERE company_id = ? AND effect_type = ?', [companyId, 'halo']);
    return c.json({
      success: true,
      data: {
        totalAnalyses: analyses.results?.[0]?.count || 0,
        totalEffects: effects.results?.[0]?.count || 0,
        cannibalizedProducts: cannibalized.results?.[0]?.count || 0,
        haloProducts: halo.results?.[0]?.count || 0
      }
    });
  } catch (e) {
    return c.json({ success: true, data: { totalAnalyses: 0, totalEffects: 0, cannibalizedProducts: 0, haloProducts: 0 } });
  }
});

cannibalizationHaloRoutes.get('/analyses', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { status, analysisType, limit = '50', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM cannibalization_analyses WHERE company_id = ?';
  const params = [companyId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (analysisType) { sql += ' AND analysis_type = ?'; params.push(analysisType); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapAnalysisRow) });
});

cannibalizationHaloRoutes.post('/analyses', async (c) => {
  const companyId = c.get('user')?.companyId;
  const userId = c.get('user')?.userId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO cannibalization_analyses (id, company_id, name, description, analysis_type, promotion_id, promotion_name, period_start, period_end, focal_product_id, focal_product_name, focal_category, focal_brand, total_products_analyzed, cannibalized_count, halo_count, neutral_count, net_impact, net_impact_pct, confidence_score, methodology, status, tags, notes, data, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.name, body.description || null, body.analysisType || 'cannibalization', body.promotionId || null, body.promotionName || null, body.periodStart, body.periodEnd, body.focalProductId || null, body.focalProductName || null, body.focalCategory || null, body.focalBrand || null, body.totalProductsAnalyzed || 0, body.cannibalizedCount || 0, body.haloCount || 0, body.neutralCount || 0, body.netImpact || 0, body.netImpactPct || 0, body.confidenceScore || 0, body.methodology || 'difference_in_differences', body.status || 'draft', JSON.stringify(body.tags || []), body.notes || null, JSON.stringify(body.data || {}), userId]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

cannibalizationHaloRoutes.put('/analyses/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  const body = await c.req.json();
  await db.rawExecute(
    `UPDATE cannibalization_analyses SET name = ?, description = ?, analysis_type = ?, promotion_id = ?, promotion_name = ?, period_start = ?, period_end = ?, focal_product_id = ?, focal_product_name = ?, focal_category = ?, focal_brand = ?, total_products_analyzed = ?, cannibalized_count = ?, halo_count = ?, neutral_count = ?, net_impact = ?, net_impact_pct = ?, confidence_score = ?, methodology = ?, status = ?, tags = ?, notes = ?, data = ?, updated_at = datetime('now') WHERE id = ? AND company_id = ?`,
    [body.name, body.description || null, body.analysisType || 'cannibalization', body.promotionId || null, body.promotionName || null, body.periodStart, body.periodEnd, body.focalProductId || null, body.focalProductName || null, body.focalCategory || null, body.focalBrand || null, body.totalProductsAnalyzed || 0, body.cannibalizedCount || 0, body.haloCount || 0, body.neutralCount || 0, body.netImpact || 0, body.netImpactPct || 0, body.confidenceScore || 0, body.methodology || 'difference_in_differences', body.status || 'draft', JSON.stringify(body.tags || []), body.notes || null, JSON.stringify(body.data || {}), id, companyId]
  );
  return c.json({ success: true, data: { id, ...body } });
});

cannibalizationHaloRoutes.delete('/analyses/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM product_effects WHERE analysis_id = ? AND company_id = ?', [id, companyId]);
  await db.rawExecute('DELETE FROM halo_matrices WHERE analysis_id = ? AND company_id = ?', [id, companyId]);
  await db.rawExecute('DELETE FROM cannibalization_analyses WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

cannibalizationHaloRoutes.get('/effects', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { analysisId, effectType, limit = '100', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM product_effects WHERE company_id = ?';
  const params = [companyId];
  if (analysisId) { sql += ' AND analysis_id = ?'; params.push(analysisId); }
  if (effectType) { sql += ' AND effect_type = ?'; params.push(effectType); }
  sql += ' ORDER BY ABS(sales_change_pct) DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapEffectRow) });
});

cannibalizationHaloRoutes.post('/effects', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO product_effects (id, company_id, analysis_id, product_id, product_name, category, brand, effect_type, baseline_sales, actual_sales, sales_change, sales_change_pct, baseline_volume, actual_volume, volume_change, volume_change_pct, price_elasticity, cross_elasticity, substitution_rate, complementarity_rate, confidence, statistical_significance, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.analysisId, body.productId || null, body.productName, body.category || null, body.brand || null, body.effectType || 'neutral', body.baselineSales || 0, body.actualSales || 0, body.salesChange || 0, body.salesChangePct || 0, body.baselineVolume || 0, body.actualVolume || 0, body.volumeChange || 0, body.volumeChangePct || 0, body.priceElasticity || 0, body.crossElasticity || 0, body.substitutionRate || 0, body.complementarityRate || 0, body.confidence || 0, body.statisticalSignificance || 0, body.notes || null, JSON.stringify(body.data || {})]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

cannibalizationHaloRoutes.delete('/effects/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM product_effects WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

cannibalizationHaloRoutes.get('/matrices', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { analysisId, matrixType, limit = '200', offset = '0' } = c.req.query();
  let sql = 'SELECT * FROM halo_matrices WHERE company_id = ?';
  const params = [companyId];
  if (analysisId) { sql += ' AND analysis_id = ?'; params.push(analysisId); }
  if (matrixType) { sql += ' AND matrix_type = ?'; params.push(matrixType); }
  sql += ' ORDER BY ABS(correlation) DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const result = await db.rawQuery(sql, params);
  return c.json({ success: true, data: (result.results || []).map(mapMatrixRow) });
});

cannibalizationHaloRoutes.post('/matrices', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await db.rawExecute(
    `INSERT INTO halo_matrices (id, company_id, analysis_id, name, matrix_type, period_start, period_end, dimension, row_id, row_name, col_id, col_name, correlation, lift_coefficient, interaction_type, sample_size, p_value, notes, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyId, body.analysisId || null, body.name, body.matrixType || 'correlation', body.periodStart || null, body.periodEnd || null, body.dimension || 'product', body.rowId || null, body.rowName || null, body.colId || null, body.colName || null, body.correlation || 0, body.liftCoefficient || 0, body.interactionType || 'neutral', body.sampleSize || 0, body.pValue || 0, body.notes || null, JSON.stringify(body.data || {})]
  );
  return c.json({ success: true, data: { id, ...body, companyId } }, 201);
});

cannibalizationHaloRoutes.delete('/matrices/:id', async (c) => {
  const companyId = c.get('user')?.companyId;
  const db = getD1Client(c.env.DB);
  const { id } = c.req.param();
  await db.rawExecute('DELETE FROM halo_matrices WHERE id = ? AND company_id = ?', [id, companyId]);
  return c.json({ success: true });
});

export { cannibalizationHaloRoutes };
