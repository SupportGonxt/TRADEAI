-- Feature 17: Advanced Reporting Engine (Phase 4)
-- Configurable report templates, scheduled reports, saved reports, and cross-module aggregation

CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_category TEXT NOT NULL DEFAULT 'general',
  report_type TEXT NOT NULL DEFAULT 'tabular',
  data_source TEXT NOT NULL DEFAULT 'promotions',
  columns TEXT DEFAULT '[]',
  filters TEXT DEFAULT '{}',
  grouping TEXT DEFAULT '[]',
  sorting TEXT DEFAULT '[]',
  calculations TEXT DEFAULT '[]',
  chart_config TEXT DEFAULT '{}',
  parameters TEXT DEFAULT '[]',
  is_system INTEGER DEFAULT 0,
  is_shared INTEGER DEFAULT 0,
  shared_with TEXT DEFAULT '[]',
  schedule_enabled INTEGER DEFAULT 0,
  schedule_frequency TEXT,
  schedule_day TEXT,
  schedule_time TEXT,
  schedule_recipients TEXT DEFAULT '[]',
  last_run_at TEXT,
  run_count INTEGER DEFAULT 0,
  created_by TEXT,
  tags TEXT DEFAULT '[]',
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_reports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  template_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  report_category TEXT NOT NULL DEFAULT 'general',
  report_type TEXT NOT NULL DEFAULT 'tabular',
  data_source TEXT NOT NULL DEFAULT 'promotions',
  status TEXT NOT NULL DEFAULT 'completed',
  filters_applied TEXT DEFAULT '{}',
  parameters_applied TEXT DEFAULT '{}',
  columns TEXT DEFAULT '[]',
  row_count INTEGER DEFAULT 0,
  report_data TEXT DEFAULT '[]',
  summary_data TEXT DEFAULT '{}',
  chart_data TEXT DEFAULT '{}',
  export_format TEXT,
  export_url TEXT,
  file_size INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  is_shared INTEGER DEFAULT 0,
  shared_with TEXT DEFAULT '[]',
  expires_at TEXT,
  generated_by TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS report_schedules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  day_of_week INTEGER,
  day_of_month INTEGER,
  time_of_day TEXT DEFAULT '08:00',
  timezone TEXT DEFAULT 'Africa/Johannesburg',
  recipients TEXT DEFAULT '[]',
  format TEXT DEFAULT 'pdf',
  filters TEXT DEFAULT '{}',
  parameters TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  run_count INTEGER DEFAULT 0,
  last_status TEXT,
  last_error TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_report_templates_company ON report_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(company_id, report_category);
CREATE INDEX IF NOT EXISTS idx_report_templates_status ON report_templates(company_id, status);
CREATE INDEX IF NOT EXISTS idx_saved_reports_company ON saved_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_template ON saved_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_category ON saved_reports(company_id, report_category);
CREATE INDEX IF NOT EXISTS idx_saved_reports_status ON saved_reports(company_id, status);
CREATE INDEX IF NOT EXISTS idx_report_schedules_company ON report_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_template ON report_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(company_id, is_active);
