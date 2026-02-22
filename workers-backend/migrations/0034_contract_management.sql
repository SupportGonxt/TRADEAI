-- Feature 20: Contract Management (Phase 4)
-- Trade contract lifecycle management with terms, conditions, compliance tracking

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_number TEXT,
  name TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL DEFAULT 'trade_agreement',
  status TEXT NOT NULL DEFAULT 'draft',
  customer_id TEXT,
  customer_name TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  start_date TEXT,
  end_date TEXT,
  auto_renew INTEGER DEFAULT 0,
  renewal_notice_days INTEGER DEFAULT 30,
  total_value REAL DEFAULT 0,
  committed_spend REAL DEFAULT 0,
  actual_spend REAL DEFAULT 0,
  utilization_pct REAL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  payment_terms TEXT,
  billing_frequency TEXT,
  owner TEXT,
  department TEXT,
  priority TEXT DEFAULT 'medium',
  risk_level TEXT DEFAULT 'low',
  compliance_status TEXT DEFAULT 'compliant',
  last_review_date TEXT,
  next_review_date TEXT,
  signed_by TEXT,
  signed_at TEXT,
  counter_signed_by TEXT,
  counter_signed_at TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contract_terms (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  term_number INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  term_type TEXT NOT NULL DEFAULT 'volume_rebate',
  status TEXT NOT NULL DEFAULT 'active',
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  channel TEXT,
  region TEXT,
  rate REAL DEFAULT 0,
  rate_type TEXT DEFAULT 'percentage',
  threshold REAL DEFAULT 0,
  cap REAL,
  tier_structure TEXT DEFAULT '[]',
  calculation_basis TEXT DEFAULT 'net_sales',
  settlement_frequency TEXT DEFAULT 'quarterly',
  effective_date TEXT,
  expiry_date TEXT,
  accrued_amount REAL DEFAULT 0,
  settled_amount REAL DEFAULT 0,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contract_milestones (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT DEFAULT 'review',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TEXT,
  completed_date TEXT,
  completed_by TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium',
  amount REAL DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contract_amendments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  amendment_number INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  amendment_type TEXT DEFAULT 'modification',
  status TEXT NOT NULL DEFAULT 'draft',
  effective_date TEXT,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  impact_amount REAL DEFAULT 0,
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(company_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contract_terms_company ON contract_terms(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_terms_contract ON contract_terms(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_company ON contract_milestones(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_amendments_company ON contract_amendments(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract ON contract_amendments(contract_id);
