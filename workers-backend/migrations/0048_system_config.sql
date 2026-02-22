-- Feature 34: System Configuration & Tenant Management
CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT,
  config_type TEXT DEFAULT 'string',
  category TEXT DEFAULT 'general',
  module TEXT,
  description TEXT,
  is_sensitive INTEGER DEFAULT 0,
  is_readonly INTEGER DEFAULT 0,
  default_value TEXT,
  validation_rules TEXT,
  updated_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  domain TEXT,
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'standard',
  max_users INTEGER DEFAULT 50,
  max_storage_gb INTEGER DEFAULT 10,
  features TEXT DEFAULT '[]',
  branding TEXT DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_email TEXT,
  country TEXT,
  currency TEXT DEFAULT 'ZAR',
  timezone TEXT DEFAULT 'Africa/Johannesburg',
  trial_ends_at TEXT,
  subscription_starts_at TEXT,
  subscription_ends_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_system_config_company_key ON system_config(company_id, config_key);
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
