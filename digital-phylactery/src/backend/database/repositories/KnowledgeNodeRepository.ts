import Database from 'better-sqlite3';
import { KnowledgeNode } from '../../../shared/types/index.js';

export interface KnowledgeNodeRow {
  id: string;
  type: 'note' | 'image' | 'webpage';
  content: string | null;
  content_path: string | null;
  metadata: string;
  searchable_text: string;
  created_at: string;
  modified_at: string;
}

export class KnowledgeNodeRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create a new knowledge node
   */
  create(node: KnowledgeNode): void {
    const stmt = this.db.prepare(`
      INSERT INTO knowledge_nodes (id, type, content, content_path, metadata, searchable_text, created_at, modified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const contentValue = typeof node.content === 'string' ? node.content : null;
    const contentPath = typeof node.content === 'string' ? null : node.content_path || null;

    stmt.run(
      node.id,
      node.type,
      contentValue,
      contentPath,
      JSON.stringify(node.metadata),
      node.searchableText,
      node.metadata.createdAt.toISOString(),
      node.metadata.modifiedAt.toISOString()
    );
  }

  /**
   * Find a knowledge node by ID
   */
  findById(id: string): KnowledgeNode | null {
    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_nodes WHERE id = ?
    `);

    const row = stmt.get(id) as KnowledgeNodeRow | undefined;
    return row ? this.rowToNode(row) : null;
  }

  /**
   * Find all knowledge nodes with optional filters
   */
  findAll(filters?: {
    type?: 'note' | 'image' | 'webpage';
    limit?: number;
    offset?: number;
  }): KnowledgeNode[] {
    let query = 'SELECT * FROM knowledge_nodes';
    const params: any[] = [];

    if (filters?.type) {
      query += ' WHERE type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as KnowledgeNodeRow[];
    return rows.map(row => this.rowToNode(row));
  }

  /**
   * Update a knowledge node
   */
  update(id: string, updates: Partial<KnowledgeNode>): void {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.content !== undefined) {
      fields.push('content = ?');
      params.push(typeof updates.content === 'string' ? updates.content : null);
    }

    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      params.push(JSON.stringify(updates.metadata));
      fields.push('modified_at = ?');
      params.push(updates.metadata.modifiedAt?.toISOString() || new Date().toISOString());
    }

    if (updates.searchableText !== undefined) {
      fields.push('searchable_text = ?');
      params.push(updates.searchableText);
    }

    if (fields.length === 0) return;

    params.push(id);
    const query = `UPDATE knowledge_nodes SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(...params);
  }

  /**
   * Delete a knowledge node
   */
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM knowledge_nodes WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Count total nodes
   */
  count(type?: 'note' | 'image' | 'webpage'): number {
    let query = 'SELECT COUNT(*) as count FROM knowledge_nodes';
    const params: any[] = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  /**
   * Full-text search across nodes
   */
  search(searchText: string, limit: number = 50): KnowledgeNode[] {
    const stmt = this.db.prepare(`
      SELECT kn.* FROM knowledge_nodes kn
      INNER JOIN nodes_fts fts ON kn.rowid = fts.rowid
      WHERE nodes_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);

    const rows = stmt.all(searchText, limit) as KnowledgeNodeRow[];
    return rows.map(row => this.rowToNode(row));
  }

  /**
   * Convert database row to KnowledgeNode
   */
  private rowToNode(row: KnowledgeNodeRow): KnowledgeNode {
    const metadata = JSON.parse(row.metadata);
    
    return {
      id: row.id,
      type: row.type,
      content: row.content || row.content_path || '',
      content_path: row.content_path || undefined,
      metadata: {
        ...metadata,
        createdAt: new Date(row.created_at),
        modifiedAt: new Date(row.modified_at)
      },
      searchableText: row.searchable_text
    };
  }
}
