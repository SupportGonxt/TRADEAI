-- Feature 28: Cannibalization & Halo Analysis
-- Tables for cross-product effects of promotions

CREATE TABLE IF NOT EXISTS cannibalization_analyses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  analysis_type TEXT DEFAULT 'cannibalization',
  promotion_id TEXT,
  promotion_name TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  focal_product_id TEXT,
  focal_product_name TEXT,
  focal_category TEXT,
  focal_brand TEXT,
  total_products_analyzed INTEGER DEFAULT 0,
  cannibalized_count INTEGER DEFAULT 0,
  halo_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  net_impact REAL DEFAULT 0,
  net_impact_pct REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  methodology TEXT DEFAULT 'difference_in_differences',
  status TEXT DEFAULT 'draft',
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cannibalization_analyses_company ON cannibalization_analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_cannibalization_analyses_status ON cannibalization_analyses(status);

CREATE TABLE IF NOT EXISTS product_effects (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  analysis_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  effect_type TEXT DEFAULT 'neutral',
  baseline_sales REAL DEFAULT 0,
  actual_sales REAL DEFAULT 0,
  sales_change REAL DEFAULT 0,
  sales_change_pct REAL DEFAULT 0,
  baseline_volume REAL DEFAULT 0,
  actual_volume REAL DEFAULT 0,
  volume_change REAL DEFAULT 0,
  volume_change_pct REAL DEFAULT 0,
  price_elasticity REAL DEFAULT 0,
  cross_elasticity REAL DEFAULT 0,
  substitution_rate REAL DEFAULT 0,
  complementarity_rate REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  statistical_significance REAL DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_product_effects_company ON product_effects(company_id);
CREATE INDEX IF NOT EXISTS idx_product_effects_analysis ON product_effects(analysis_id);
CREATE INDEX IF NOT EXISTS idx_product_effects_type ON product_effects(effect_type);

CREATE TABLE IF NOT EXISTS halo_matrices (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  analysis_id TEXT,
  name TEXT NOT NULL,
  matrix_type TEXT DEFAULT 'correlation',
  period_start TEXT,
  period_end TEXT,
  dimension TEXT DEFAULT 'product',
  row_id TEXT,
  row_name TEXT,
  col_id TEXT,
  col_name TEXT,
  correlation REAL DEFAULT 0,
  lift_coefficient REAL DEFAULT 0,
  interaction_type TEXT DEFAULT 'neutral',
  sample_size INTEGER DEFAULT 0,
  p_value REAL DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_halo_matrices_company ON halo_matrices(company_id);
CREATE INDEX IF NOT EXISTS idx_halo_matrices_analysis ON halo_matrices(analysis_id);
