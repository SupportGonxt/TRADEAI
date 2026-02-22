-- Feature 33: User Role & Permission Management
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  role_type TEXT DEFAULT 'custom',
  is_system INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  permissions TEXT DEFAULT '[]',
  parent_role_id TEXT,
  level INTEGER DEFAULT 0,
  max_approval_amount REAL,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  role_name TEXT,
  assigned_by TEXT,
  valid_from TEXT,
  valid_until TEXT,
  status TEXT DEFAULT 'active',
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permission_groups (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT,
  permissions TEXT DEFAULT '[]',
  is_system INTEGER DEFAULT 0,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permission_groups_company ON permission_groups(company_id);
