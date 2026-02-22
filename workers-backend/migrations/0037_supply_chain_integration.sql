-- Feature 23: Supply Chain Integration
-- Tables for supply chain visibility, inventory, logistics, and supplier management

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  supplier_type TEXT DEFAULT 'manufacturer',
  status TEXT NOT NULL DEFAULT 'active',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  lead_time_days INTEGER DEFAULT 0,
  reliability_score REAL DEFAULT 0,
  quality_score REAL DEFAULT 0,
  cost_rating REAL DEFAULT 0,
  annual_spend REAL DEFAULT 0,
  payment_terms TEXT DEFAULT 'net30',
  certifications TEXT DEFAULT '[]',
  categories TEXT DEFAULT '[]',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

CREATE TABLE IF NOT EXISTS inventory_levels (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  warehouse_id TEXT,
  warehouse_name TEXT,
  sku TEXT,
  category TEXT,
  current_qty REAL DEFAULT 0,
  reserved_qty REAL DEFAULT 0,
  available_qty REAL DEFAULT 0,
  reorder_point REAL DEFAULT 0,
  reorder_qty REAL DEFAULT 0,
  safety_stock REAL DEFAULT 0,
  max_stock REAL DEFAULT 0,
  unit_cost REAL DEFAULT 0,
  total_value REAL DEFAULT 0,
  days_of_supply REAL DEFAULT 0,
  turnover_rate REAL DEFAULT 0,
  stock_status TEXT DEFAULT 'normal',
  last_received_at TEXT,
  last_counted_at TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory_levels(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_levels(stock_status);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  shipment_number TEXT,
  order_id TEXT,
  order_number TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  shipment_type TEXT DEFAULT 'outbound',
  status TEXT NOT NULL DEFAULT 'pending',
  origin TEXT,
  destination TEXT,
  carrier TEXT,
  tracking_number TEXT,
  ship_date TEXT,
  expected_delivery TEXT,
  actual_delivery TEXT,
  total_weight REAL DEFAULT 0,
  total_volume REAL DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  shipping_cost REAL DEFAULT 0,
  insurance_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  on_time INTEGER DEFAULT 1,
  damage_reported INTEGER DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipments_company ON shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_type ON shipments(shipment_type);

CREATE TABLE IF NOT EXISTS supply_chain_alerts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  alert_type TEXT DEFAULT 'stockout',
  severity TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT,
  source_id TEXT,
  source_name TEXT,
  product_id TEXT,
  product_name TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  impact_value REAL DEFAULT 0,
  impact_description TEXT,
  recommended_action TEXT,
  resolved_at TEXT,
  resolved_by TEXT,
  resolution_notes TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sc_alerts_company ON supply_chain_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_sc_alerts_status ON supply_chain_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sc_alerts_severity ON supply_chain_alerts(severity);
