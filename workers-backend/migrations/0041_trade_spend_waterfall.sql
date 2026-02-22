-- Feature 27: Trade Spend Waterfall Analysis
-- Tables for waterfall analyses, waterfall steps, and spend decompositions

CREATE TABLE IF NOT EXISTS waterfall_analyses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  analysis_type TEXT DEFAULT 'trade_spend',
  period TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  dimension TEXT DEFAULT 'overall',
  dimension_id TEXT,
  dimension_name TEXT,
  base_revenue REAL DEFAULT 0,
  gross_revenue REAL DEFAULT 0,
  net_revenue REAL DEFAULT 0,
  total_trade_spend REAL DEFAULT 0,
  trade_spend_pct REAL DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  status TEXT DEFAULT 'draft',
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_waterfall_analyses_company ON waterfall_analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_waterfall_analyses_period ON waterfall_analyses(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_waterfall_analyses_status ON waterfall_analyses(status);

CREATE TABLE IF NOT EXISTS waterfall_steps (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  analysis_id TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  step_type TEXT DEFAULT 'deduction',
  label TEXT NOT NULL,
  description TEXT,
  amount REAL DEFAULT 0,
  percentage REAL DEFAULT 0,
  cumulative_amount REAL DEFAULT 0,
  cumulative_pct REAL DEFAULT 0,
  start_value REAL DEFAULT 0,
  end_value REAL DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  category TEXT,
  sub_category TEXT,
  source TEXT,
  is_subtotal INTEGER DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_waterfall_steps_company ON waterfall_steps(company_id);
CREATE INDEX IF NOT EXISTS idx_waterfall_steps_analysis ON waterfall_steps(analysis_id);

CREATE TABLE IF NOT EXISTS spend_decompositions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  analysis_id TEXT,
  name TEXT NOT NULL,
  period TEXT,
  period_start TEXT,
  period_end TEXT,
  spend_type TEXT DEFAULT 'trade_promotion',
  category TEXT,
  sub_category TEXT,
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  channel TEXT,
  region TEXT,
  gross_amount REAL DEFAULT 0,
  net_amount REAL DEFAULT 0,
  pct_of_total REAL DEFAULT 0,
  pct_of_revenue REAL DEFAULT 0,
  roi REAL DEFAULT 0,
  volume_impact REAL DEFAULT 0,
  incremental_revenue REAL DEFAULT 0,
  effectiveness_score REAL DEFAULT 0,
  benchmark REAL DEFAULT 0,
  variance_to_benchmark REAL DEFAULT 0,
  trend_direction TEXT DEFAULT 'flat',
  prior_period_amount REAL DEFAULT 0,
  yoy_change_pct REAL DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_spend_decompositions_company ON spend_decompositions(company_id);
CREATE INDEX IF NOT EXISTS idx_spend_decompositions_analysis ON spend_decompositions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_spend_decompositions_type ON spend_decompositions(spend_type);
