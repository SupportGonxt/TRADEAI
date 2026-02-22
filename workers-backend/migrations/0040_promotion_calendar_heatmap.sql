-- Feature 26: Promotion Calendar Heatmap
-- Tables for calendar events, calendar conflicts, and calendar coverage analysis

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  promotion_id TEXT,
  promotion_name TEXT,
  event_type TEXT DEFAULT 'promotion',
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  duration_days INTEGER DEFAULT 0,
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  channel TEXT,
  region TEXT,
  mechanic TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  budget REAL DEFAULT 0,
  expected_lift REAL DEFAULT 0,
  actual_lift REAL DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  color TEXT DEFAULT '#7C3AED',
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  overlap_count INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_company ON calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_customer ON calendar_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_product ON calendar_events(product_id);

CREATE TABLE IF NOT EXISTS calendar_conflicts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  event_a_id TEXT NOT NULL,
  event_a_title TEXT,
  event_b_id TEXT NOT NULL,
  event_b_title TEXT,
  conflict_type TEXT DEFAULT 'overlap',
  severity TEXT DEFAULT 'warning',
  overlap_start TEXT,
  overlap_end TEXT,
  overlap_days INTEGER DEFAULT 0,
  shared_customer INTEGER DEFAULT 0,
  shared_product INTEGER DEFAULT 0,
  shared_channel INTEGER DEFAULT 0,
  impact_description TEXT,
  resolution TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_company ON calendar_conflicts(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_status ON calendar_conflicts(status);

CREATE TABLE IF NOT EXISTS calendar_coverage (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  analysis_period TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  dimension TEXT DEFAULT 'overall',
  dimension_id TEXT,
  dimension_name TEXT,
  total_days INTEGER DEFAULT 0,
  covered_days INTEGER DEFAULT 0,
  coverage_pct REAL DEFAULT 0,
  gap_days INTEGER DEFAULT 0,
  overlap_days INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  total_budget REAL DEFAULT 0,
  avg_daily_spend REAL DEFAULT 0,
  peak_day TEXT,
  peak_count INTEGER DEFAULT 0,
  gaps TEXT DEFAULT '[]',
  recommendations TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_coverage_company ON calendar_coverage(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_coverage_period ON calendar_coverage(analysis_period);
