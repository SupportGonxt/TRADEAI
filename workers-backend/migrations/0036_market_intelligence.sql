-- Feature 22: Market Intelligence & Competitive Insights (Phase 4)
-- Competitor tracking, market share analysis, competitive pricing, and market trends

CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  competitor_type TEXT DEFAULT 'direct',
  status TEXT NOT NULL DEFAULT 'active',
  website TEXT,
  headquarters TEXT,
  annual_revenue REAL DEFAULT 0,
  market_share_pct REAL DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  strengths TEXT DEFAULT '[]',
  weaknesses TEXT DEFAULT '[]',
  key_brands TEXT DEFAULT '[]',
  key_categories TEXT DEFAULT '[]',
  key_channels TEXT DEFAULT '[]',
  threat_level TEXT DEFAULT 'medium',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS market_share_data (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  competitor_id TEXT,
  competitor_name TEXT,
  period TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  category TEXT,
  brand TEXT,
  channel TEXT,
  region TEXT,
  market_size REAL DEFAULT 0,
  company_share_pct REAL DEFAULT 0,
  company_revenue REAL DEFAULT 0,
  competitor_share_pct REAL DEFAULT 0,
  competitor_revenue REAL DEFAULT 0,
  share_change_pct REAL DEFAULT 0,
  volume_share_pct REAL DEFAULT 0,
  value_share_pct REAL DEFAULT 0,
  growth_rate_pct REAL DEFAULT 0,
  market_rank INTEGER,
  source TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS competitive_prices (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  competitor_id TEXT,
  competitor_name TEXT,
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  channel TEXT,
  region TEXT,
  our_price REAL DEFAULT 0,
  competitor_price REAL DEFAULT 0,
  price_index REAL DEFAULT 100,
  price_gap_pct REAL DEFAULT 0,
  promo_price REAL,
  promo_depth_pct REAL DEFAULT 0,
  shelf_price REAL,
  observed_date TEXT,
  source TEXT,
  confidence_score REAL DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS market_trends (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trend_type TEXT DEFAULT 'market',
  category TEXT,
  channel TEXT,
  region TEXT,
  period TEXT,
  period_start TEXT,
  period_end TEXT,
  direction TEXT DEFAULT 'stable',
  magnitude TEXT DEFAULT 'moderate',
  impact_score REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  affected_categories TEXT DEFAULT '[]',
  affected_brands TEXT DEFAULT '[]',
  opportunities TEXT DEFAULT '[]',
  risks TEXT DEFAULT '[]',
  recommended_actions TEXT DEFAULT '[]',
  source TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_competitors_company ON competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_market_share_company ON market_share_data(company_id);
CREATE INDEX IF NOT EXISTS idx_market_share_period ON market_share_data(company_id, period);
CREATE INDEX IF NOT EXISTS idx_competitive_prices_company ON competitive_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_competitive_prices_competitor ON competitive_prices(competitor_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_company ON market_trends(company_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_type ON market_trends(company_id, trend_type);
