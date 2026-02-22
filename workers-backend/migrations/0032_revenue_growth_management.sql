-- Feature 18: Revenue Growth Management / RGM (Phase 4)
-- Strategic revenue growth initiatives, pricing strategies, mix optimization, and growth tracking

CREATE TABLE IF NOT EXISTS rgm_initiatives (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  initiative_type TEXT NOT NULL DEFAULT 'pricing',
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  channel TEXT,
  region TEXT,
  brand TEXT,
  start_date TEXT,
  end_date TEXT,
  target_revenue REAL DEFAULT 0,
  target_margin_pct REAL DEFAULT 0,
  target_growth_pct REAL DEFAULT 0,
  actual_revenue REAL DEFAULT 0,
  actual_margin_pct REAL DEFAULT 0,
  actual_growth_pct REAL DEFAULT 0,
  baseline_revenue REAL DEFAULT 0,
  baseline_margin_pct REAL DEFAULT 0,
  investment_amount REAL DEFAULT 0,
  roi REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  owner TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rgm_pricing_strategies (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  initiative_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL DEFAULT 'regular',
  status TEXT NOT NULL DEFAULT 'draft',
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  customer_id TEXT,
  customer_name TEXT,
  channel TEXT,
  current_price REAL DEFAULT 0,
  recommended_price REAL DEFAULT 0,
  price_change_pct REAL DEFAULT 0,
  current_margin_pct REAL DEFAULT 0,
  projected_margin_pct REAL DEFAULT 0,
  price_elasticity REAL DEFAULT 0,
  volume_impact_pct REAL DEFAULT 0,
  revenue_impact REAL DEFAULT 0,
  margin_impact REAL DEFAULT 0,
  competitor_price REAL DEFAULT 0,
  price_index REAL DEFAULT 0,
  effective_date TEXT,
  end_date TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rgm_mix_analyses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  initiative_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  analysis_type TEXT NOT NULL DEFAULT 'product',
  status TEXT NOT NULL DEFAULT 'completed',
  dimension TEXT DEFAULT 'product',
  period_start TEXT,
  period_end TEXT,
  total_revenue REAL DEFAULT 0,
  total_volume REAL DEFAULT 0,
  total_margin REAL DEFAULT 0,
  avg_margin_pct REAL DEFAULT 0,
  mix_score REAL DEFAULT 0,
  opportunity_value REAL DEFAULT 0,
  items TEXT DEFAULT '[]',
  recommendations TEXT DEFAULT '[]',
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rgm_growth_trackers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  initiative_id TEXT,
  period TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  metric_type TEXT NOT NULL DEFAULT 'revenue',
  dimension TEXT DEFAULT 'total',
  dimension_id TEXT,
  dimension_name TEXT,
  target_value REAL DEFAULT 0,
  actual_value REAL DEFAULT 0,
  prior_value REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  variance_pct REAL DEFAULT 0,
  growth_pct REAL DEFAULT 0,
  contribution_pct REAL DEFAULT 0,
  trend_direction TEXT DEFAULT 'flat',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rgm_initiatives_company ON rgm_initiatives(company_id);
CREATE INDEX IF NOT EXISTS idx_rgm_initiatives_status ON rgm_initiatives(company_id, status);
CREATE INDEX IF NOT EXISTS idx_rgm_initiatives_type ON rgm_initiatives(company_id, initiative_type);
CREATE INDEX IF NOT EXISTS idx_rgm_pricing_company ON rgm_pricing_strategies(company_id);
CREATE INDEX IF NOT EXISTS idx_rgm_pricing_initiative ON rgm_pricing_strategies(initiative_id);
CREATE INDEX IF NOT EXISTS idx_rgm_pricing_status ON rgm_pricing_strategies(company_id, status);
CREATE INDEX IF NOT EXISTS idx_rgm_mix_company ON rgm_mix_analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_rgm_mix_initiative ON rgm_mix_analyses(initiative_id);
CREATE INDEX IF NOT EXISTS idx_rgm_growth_company ON rgm_growth_trackers(company_id);
CREATE INDEX IF NOT EXISTS idx_rgm_growth_initiative ON rgm_growth_trackers(initiative_id);
CREATE INDEX IF NOT EXISTS idx_rgm_growth_period ON rgm_growth_trackers(company_id, period);
