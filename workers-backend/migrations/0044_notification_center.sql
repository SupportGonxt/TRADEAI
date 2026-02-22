-- Feature 30: Notification Center & Alerts Engine
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT,
  notification_type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'system',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'unread',
  source_entity_type TEXT,
  source_entity_id TEXT,
  source_entity_name TEXT,
  action_url TEXT,
  action_label TEXT,
  read_at TEXT,
  dismissed_at TEXT,
  expires_at TEXT,
  channel TEXT DEFAULT 'in_app',
  sent_via_email INTEGER DEFAULT 0,
  sent_via_sms INTEGER DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT DEFAULT 'threshold',
  category TEXT DEFAULT 'system',
  entity_type TEXT,
  metric TEXT,
  operator TEXT DEFAULT '>',
  threshold_value REAL DEFAULT 0,
  threshold_unit TEXT,
  severity TEXT DEFAULT 'warning',
  is_active INTEGER DEFAULT 1,
  frequency TEXT DEFAULT 'daily',
  cooldown_minutes INTEGER DEFAULT 60,
  last_triggered_at TEXT,
  trigger_count INTEGER DEFAULT 0,
  recipients TEXT DEFAULT '[]',
  channels TEXT DEFAULT '["in_app"]',
  conditions TEXT DEFAULT '{}',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alert_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  rule_id TEXT,
  rule_name TEXT,
  alert_type TEXT DEFAULT 'threshold',
  severity TEXT DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  metric_value REAL,
  threshold_value REAL,
  status TEXT DEFAULT 'triggered',
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_alert_rules_company ON alert_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_company ON alert_history(company_id);
