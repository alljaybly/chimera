-- Digital Phylactery Database Schema
-- SQLite database for knowledge management system

-- Knowledge Nodes table
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('note', 'image', 'webpage')),
  content TEXT,
  content_path TEXT,
  metadata JSON NOT NULL,
  searchable_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index using FTS5
CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
  id UNINDEXED,
  searchable_text,
  content='knowledge_nodes',
  content_rowid='rowid'
);

-- Triggers to keep FTS index in sync with knowledge_nodes table
CREATE TRIGGER IF NOT EXISTS nodes_fts_insert AFTER INSERT ON knowledge_nodes BEGIN
  INSERT INTO nodes_fts(rowid, id, searchable_text)
  VALUES (new.rowid, new.id, new.searchable_text);
END;

CREATE TRIGGER IF NOT EXISTS nodes_fts_delete AFTER DELETE ON knowledge_nodes BEGIN
  DELETE FROM nodes_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS nodes_fts_update AFTER UPDATE ON knowledge_nodes BEGIN
  DELETE FROM nodes_fts WHERE rowid = old.rowid;
  INSERT INTO nodes_fts(rowid, id, searchable_text)
  VALUES (new.rowid, new.id, new.searchable_text);
END;

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('semantic', 'temporal', 'manual')),
  confidence REAL NOT NULL CHECK(confidence >= 0.0 AND confidence <= 1.0),
  metadata JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_node_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_node_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
);

-- Behavioral events table
CREATE TABLE IF NOT EXISTS behavioral_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK(event_type IN ('click', 'hover', 'focus', 'scroll')),
  target TEXT NOT NULL,
  metadata JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- UI mutations table
CREATE TABLE IF NOT EXISTS ui_mutations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('reorder', 'resize', 'hide', 'show', 'shortcut')),
  target TEXT NOT NULL,
  parameters JSON NOT NULL,
  triggered_by TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_connections_source ON connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON connections(target_node_id);
CREATE INDEX IF NOT EXISTS idx_connections_confidence ON connections(confidence);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_created ON knowledge_nodes(created_at);
CREATE INDEX IF NOT EXISTS idx_nodes_modified ON knowledge_nodes(modified_at);
CREATE INDEX IF NOT EXISTS idx_behavioral_events_timestamp ON behavioral_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_behavioral_events_type ON behavioral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ui_mutations_applied ON ui_mutations(applied_at);
