-- Feature 25: Executive KPI Dashboard
-- Tables for KPI definitions, KPI targets, KPI actuals, and executive scorecards

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  kpi_type TEXT DEFAULT 'financial',
  category TEXT DEFAULT 'revenue',
  unit TEXT DEFAULT 'currency',
  format TEXT DEFAULT '#,##0.00',
  calculation_method TEXT DEFAULT 'sum',
  data_source TEXT DEFAULT 'manual',
  source_table TEXT,
  source_column TEXT,
  aggregation TEXT DEFAULT 'sum',
  frequency TEXT DEFAULT 'monthly',
  direction TEXT DEFAULT 'higher_is_better',
  threshold_red REAL DEFAULT 0,
  threshold_amber REAL DEFAULT 0,
  threshold_green REAL DEFAULT 0,
  weight REAL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  owner TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kpi_definitions_company ON kpi_definitions(company_id);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_type ON kpi_definitions(kpi_type);

CREATE TABLE IF NOT EXISTS kpi_targets (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  kpi_id TEXT NOT NULL,
  kpi_name TEXT,
  period TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  target_value REAL DEFAULT 0,
  stretch_target REAL DEFAULT 0,
  floor_value REAL DEFAULT 0,
  prior_year_value REAL DEFAULT 0,
  budget_value REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  approved_by TEXT,
  approved_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kpi_targets_company ON kpi_targets(company_id);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_kpi ON kpi_targets(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_period ON kpi_targets(period);

CREATE TABLE IF NOT EXISTS kpi_actuals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  kpi_id TEXT NOT NULL,
  kpi_name TEXT,
  period TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  actual_value REAL DEFAULT 0,
  target_value REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  variance_pct REAL DEFAULT 0,
  achievement_pct REAL DEFAULT 0,
  trend_direction TEXT DEFAULT 'flat',
  prior_period_value REAL DEFAULT 0,
  prior_year_value REAL DEFAULT 0,
  yoy_growth_pct REAL DEFAULT 0,
  mom_growth_pct REAL DEFAULT 0,
  ytd_actual REAL DEFAULT 0,
  ytd_target REAL DEFAULT 0,
  ytd_achievement_pct REAL DEFAULT 0,
  rag_status TEXT DEFAULT 'green',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kpi_actuals_company ON kpi_actuals(company_id);
CREATE INDEX IF NOT EXISTS idx_kpi_actuals_kpi ON kpi_actuals(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_actuals_period ON kpi_actuals(period);

CREATE TABLE IF NOT EXISTS executive_scorecards (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scorecard_type TEXT DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'draft',
  period TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  overall_score REAL DEFAULT 0,
  overall_rag TEXT DEFAULT 'green',
  financial_score REAL DEFAULT 0,
  operational_score REAL DEFAULT 0,
  customer_score REAL DEFAULT 0,
  growth_score REAL DEFAULT 0,
  total_kpis INTEGER DEFAULT 0,
  green_count INTEGER DEFAULT 0,
  amber_count INTEGER DEFAULT 0,
  red_count INTEGER DEFAULT 0,
  highlights TEXT DEFAULT '[]',
  lowlights TEXT DEFAULT '[]',
  actions TEXT DEFAULT '[]',
  commentary TEXT,
  published_at TEXT,
  published_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_executive_scorecards_company ON executive_scorecards(company_id);
CREATE INDEX IF NOT EXISTS idx_executive_scorecards_period ON executive_scorecards(period);
CREATE INDEX IF NOT EXISTS idx_executive_scorecards_status ON executive_scorecards(status);
