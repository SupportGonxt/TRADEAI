-- Feature 19: Retailer Collaboration Portal (Phase 4)
-- Shared workspace for retailer-manufacturer collaboration on promotions, forecasts, and joint business plans

CREATE TABLE IF NOT EXISTS retailer_portals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  retailer_id TEXT,
  retailer_name TEXT NOT NULL,
  retailer_code TEXT,
  portal_status TEXT NOT NULL DEFAULT 'active',
  access_level TEXT DEFAULT 'standard',
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  onboarded_at TEXT,
  last_login_at TEXT,
  total_shared_promotions INTEGER DEFAULT 0,
  total_joint_plans INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  collaboration_score REAL DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collaboration_plans (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  retailer_id TEXT,
  retailer_name TEXT,
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'joint_business',
  status TEXT NOT NULL DEFAULT 'draft',
  fiscal_year TEXT,
  quarter TEXT,
  start_date TEXT,
  end_date TEXT,
  total_investment REAL DEFAULT 0,
  projected_revenue REAL DEFAULT 0,
  projected_growth_pct REAL DEFAULT 0,
  actual_revenue REAL DEFAULT 0,
  actual_growth_pct REAL DEFAULT 0,
  objectives TEXT DEFAULT '[]',
  kpis TEXT DEFAULT '[]',
  milestones TEXT DEFAULT '[]',
  owner TEXT,
  retailer_owner TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shared_promotions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  retailer_id TEXT,
  retailer_name TEXT,
  plan_id TEXT,
  promotion_id TEXT,
  promotion_name TEXT,
  share_status TEXT NOT NULL DEFAULT 'pending',
  visibility TEXT DEFAULT 'full',
  retailer_feedback TEXT,
  retailer_rating INTEGER,
  retailer_approved INTEGER DEFAULT 0,
  retailer_approved_at TEXT,
  retailer_notes TEXT,
  manufacturer_notes TEXT,
  shared_by TEXT,
  shared_at TEXT,
  expires_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collaboration_messages (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  retailer_id TEXT,
  plan_id TEXT,
  promotion_id TEXT,
  sender_type TEXT NOT NULL DEFAULT 'manufacturer',
  sender_name TEXT,
  sender_email TEXT,
  message_type TEXT DEFAULT 'text',
  subject TEXT,
  body TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  read_at TEXT,
  parent_id TEXT,
  attachments TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_retailer_portals_company ON retailer_portals(company_id);
CREATE INDEX IF NOT EXISTS idx_retailer_portals_status ON retailer_portals(company_id, portal_status);
CREATE INDEX IF NOT EXISTS idx_collab_plans_company ON collaboration_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_collab_plans_retailer ON collaboration_plans(retailer_id);
CREATE INDEX IF NOT EXISTS idx_collab_plans_status ON collaboration_plans(company_id, status);
CREATE INDEX IF NOT EXISTS idx_shared_promos_company ON shared_promotions(company_id);
CREATE INDEX IF NOT EXISTS idx_shared_promos_retailer ON shared_promotions(retailer_id);
CREATE INDEX IF NOT EXISTS idx_shared_promos_plan ON shared_promotions(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_company ON collaboration_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_retailer ON collaboration_messages(retailer_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_plan ON collaboration_messages(plan_id);
