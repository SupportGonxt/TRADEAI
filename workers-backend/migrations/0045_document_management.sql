-- Feature 31: Document Management
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT DEFAULT 'general',
  category TEXT DEFAULT 'other',
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  tags TEXT DEFAULT '[]',
  uploaded_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  expires_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  version_number INTEGER DEFAULT 1,
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  change_summary TEXT,
  uploaded_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_id);
