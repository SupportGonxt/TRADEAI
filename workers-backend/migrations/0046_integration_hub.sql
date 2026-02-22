-- Feature 32: Integration Hub
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  integration_type TEXT DEFAULT 'api',
  provider TEXT,
  category TEXT DEFAULT 'erp',
  status TEXT DEFAULT 'inactive',
  config TEXT DEFAULT '{}',
  credentials TEXT DEFAULT '{}',
  endpoint_url TEXT,
  auth_type TEXT DEFAULT 'api_key',
  sync_frequency TEXT DEFAULT 'manual',
  last_sync_at TEXT,
  next_sync_at TEXT,
  sync_status TEXT DEFAULT 'idle',
  record_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS integration_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  log_type TEXT DEFAULT 'info',
  action TEXT,
  status TEXT DEFAULT 'success',
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  request_data TEXT,
  response_data TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_integrations_company ON integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration ON integration_logs(integration_id);
