-- Feature 35: Advanced Workflow Engine
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT DEFAULT 'approval',
  entity_type TEXT,
  trigger_event TEXT,
  status TEXT DEFAULT 'active',
  is_system INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  steps TEXT DEFAULT '[]',
  conditions TEXT DEFAULT '{}',
  escalation_rules TEXT DEFAULT '{}',
  sla_hours INTEGER,
  auto_approve_below REAL,
  requires_all_approvers INTEGER DEFAULT 0,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  status TEXT DEFAULT 'in_progress',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  initiated_by TEXT,
  initiated_at TEXT,
  completed_at TEXT,
  completed_by TEXT,
  outcome TEXT,
  duration_hours REAL,
  escalated INTEGER DEFAULT 0,
  escalated_to TEXT,
  escalated_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  step_number INTEGER DEFAULT 1,
  step_name TEXT,
  step_type TEXT DEFAULT 'approval',
  assignee_id TEXT,
  assignee_name TEXT,
  status TEXT DEFAULT 'pending',
  action TEXT,
  comments TEXT,
  started_at TEXT,
  completed_at TEXT,
  due_at TEXT,
  sla_hours INTEGER,
  is_overdue INTEGER DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_company ON workflow_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_company ON workflow_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_template ON workflow_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_instance ON workflow_steps(instance_id);
