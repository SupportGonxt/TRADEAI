-- Feature 29: Audit Trail & Compliance

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  action_type TEXT NOT NULL,
  action_label TEXT,
  severity TEXT DEFAULT 'info',
  source TEXT DEFAULT 'ui',
  request_id TEXT,
  before_data TEXT DEFAULT '{}',
  after_data TEXT DEFAULT '{}',
  changed_fields TEXT DEFAULT '[]',
  actor_user_id TEXT,
  actor_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_events_company ON audit_events(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(company_id, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(company_id, created_at);

CREATE TABLE IF NOT EXISTS compliance_policies (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  policy_type TEXT DEFAULT 'control',
  applies_to TEXT,
  enforcement_level TEXT DEFAULT 'advisory',
  status TEXT DEFAULT 'active',
  version TEXT DEFAULT '1.0',
  owner TEXT,
  effective_from TEXT,
  effective_to TEXT,
  last_reviewed_at TEXT,
  next_review_at TEXT,
  rules TEXT DEFAULT '{}',
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_policies_company ON compliance_policies(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_policies_status ON compliance_policies(company_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_policies_type ON compliance_policies(company_id, policy_type);

CREATE TABLE IF NOT EXISTS data_access_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  access_type TEXT NOT NULL,
  outcome TEXT DEFAULT 'success',
  reason TEXT,
  actor_user_id TEXT,
  actor_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_company ON data_access_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_resource ON data_access_logs(company_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created ON data_access_logs(company_id, created_at);
