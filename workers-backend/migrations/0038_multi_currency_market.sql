-- Feature 24: Multi-Currency & Multi-Market
-- Tables for currency management, exchange rates, market configurations, and market-specific pricing

CREATE TABLE IF NOT EXISTS currency_configs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  symbol TEXT DEFAULT '',
  decimal_places INTEGER DEFAULT 2,
  is_base_currency INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  country TEXT,
  region TEXT,
  rounding_method TEXT DEFAULT 'standard',
  display_format TEXT DEFAULT '#,##0.00',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_currency_configs_company ON currency_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_currency_configs_code ON currency_configs(currency_code);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate REAL NOT NULL DEFAULT 1,
  inverse_rate REAL NOT NULL DEFAULT 1,
  rate_type TEXT DEFAULT 'spot',
  effective_date TEXT NOT NULL,
  expiry_date TEXT,
  source TEXT DEFAULT 'manual',
  variance_pct REAL DEFAULT 0,
  prior_rate REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_company ON exchange_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(effective_date);

CREATE TABLE IF NOT EXISTS market_configs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  market_code TEXT NOT NULL,
  market_name TEXT NOT NULL,
  description TEXT,
  market_type TEXT DEFAULT 'country',
  status TEXT NOT NULL DEFAULT 'active',
  country TEXT,
  region TEXT,
  timezone TEXT,
  base_currency TEXT DEFAULT 'ZAR',
  languages TEXT DEFAULT '[]',
  tax_rate REAL DEFAULT 0,
  vat_rate REAL DEFAULT 0,
  regulatory_requirements TEXT DEFAULT '[]',
  trade_policies TEXT DEFAULT '{}',
  fiscal_year_start TEXT DEFAULT '01-01',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  number_format TEXT DEFAULT '#,##0.00',
  population REAL DEFAULT 0,
  gdp REAL DEFAULT 0,
  market_size REAL DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_market_configs_company ON market_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_market_configs_code ON market_configs(market_code);
CREATE INDEX IF NOT EXISTS idx_market_configs_status ON market_configs(status);

CREATE TABLE IF NOT EXISTS market_pricing (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  market_id TEXT,
  market_name TEXT,
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  currency TEXT DEFAULT 'ZAR',
  list_price REAL DEFAULT 0,
  local_price REAL DEFAULT 0,
  base_currency_price REAL DEFAULT 0,
  exchange_rate REAL DEFAULT 1,
  tax_amount REAL DEFAULT 0,
  duty_amount REAL DEFAULT 0,
  landed_cost REAL DEFAULT 0,
  local_margin_pct REAL DEFAULT 0,
  price_index REAL DEFAULT 100,
  competitor_price REAL DEFAULT 0,
  effective_date TEXT,
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  approved_by TEXT,
  approved_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_market_pricing_company ON market_pricing(company_id);
CREATE INDEX IF NOT EXISTS idx_market_pricing_market ON market_pricing(market_id);
CREATE INDEX IF NOT EXISTS idx_market_pricing_product ON market_pricing(product_id);
