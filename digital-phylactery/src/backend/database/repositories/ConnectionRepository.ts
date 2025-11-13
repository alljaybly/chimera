import Database from 'better-sqlite3';
import { Connection } from '../../../shared/types/index.js';

export interface ConnectionRow {
  id: string;
  source_node_id: string;
  target_node_id: string;
  type: 'semantic' | 'temporal' | 'manual';
  confidence: number;
  metadata: string;
  created_at: string;
}

export class ConnectionRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create a new connection
   */
  create(connection: Connection): void {
    const stmt = this.db.prepare(`
      INSERT INTO connections (id, source_node_id, target_node_id, type, confidence, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      connection.id,
      connection.sourceNodeId,
      connection.targetNodeId,
      connection.type,
      connection.confidence,
      JSON.stringify(connection.metadata),
      connection.metadata.discoveredAt.toISOString()
    );
  }

  /**
   * Find a connection by ID
   */
  findById(id: string): Connection | null {
    const stmt = this.db.prepare('SELECT * FROM connections WHERE id = ?');
    const row = stmt.get(id) as ConnectionRow | undefined;
    return row ? this.rowToConnection(row) : null;
  }

  /**
   * Find all connections for a specific node
   */
  findByNodeId(nodeId: string): Connection[] {
    const stmt = this.db.prepare(`
      SELECT * FROM connections 
      WHERE source_node_id = ? OR target_node_id = ?
      ORDER BY confidence DESC
    `);

    const rows = stmt.all(nodeId, nodeId) as ConnectionRow[];
    return rows.map(row => this.rowToConnection(row));
  }

  /**
   * Find connections between two specific nodes
   */
  findBetweenNodes(nodeId1: string, nodeId2: string): Connection[] {
    const stmt = this.db.prepare(`
      SELECT * FROM connections 
      WHERE (source_node_id = ? AND target_node_id = ?)
         OR (source_node_id = ? AND target_node_id = ?)
    `);

    const rows = stmt.all(nodeId1, nodeId2, nodeId2, nodeId1) as ConnectionRow[];
    return rows.map(row => this.rowToConnection(row));
  }

  /**
   * Find all connections with optional filters
   */
  findAll(filters?: {
    type?: 'semantic' | 'temporal' | 'manual';
    minConfidence?: number;
    limit?: number;
    offset?: number;
  }): Connection[] {
    let query = 'SELECT * FROM connections WHERE 1=1';
    const params: any[] = [];

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.minConfidence !== undefined) {
      query += ' AND confidence >= ?';
      params.push(filters.minConfidence);
    }

    query += ' ORDER BY confidence DESC, created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as ConnectionRow[];
    return rows.map(row => this.rowToConnection(row));
  }

  /**
   * Update a connection
   */
  update(id: string, updates: Partial<Connection>): void {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.confidence !== undefined) {
      fields.push('confidence = ?');
      params.push(updates.confidence);
    }

    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      params.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) return;

    params.push(id);
    const query = `UPDATE connections SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(...params);
  }

  /**
   * Delete a connection
   */
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM connections WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Delete all connections for a specific node
   */
  deleteByNodeId(nodeId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM connections 
      WHERE source_node_id = ? OR target_node_id = ?
    `);
    stmt.run(nodeId, nodeId);
  }

  /**
   * Count total connections
   */
  count(filters?: { type?: 'semantic' | 'temporal' | 'manual' }): number {
    let query = 'SELECT COUNT(*) as count FROM connections';
    const params: any[] = [];

    if (filters?.type) {
      query += ' WHERE type = ?';
      params.push(filters.type);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  /**
   * Get strong connections (confidence > 0.7)
   */
  findStrongConnections(nodeId?: string): Connection[] {
    let query = 'SELECT * FROM connections WHERE confidence > 0.7';
    const params: any[] = [];

    if (nodeId) {
      query += ' AND (source_node_id = ? OR target_node_id = ?)';
      params.push(nodeId, nodeId);
    }

    query += ' ORDER BY confidence DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as ConnectionRow[];
    return rows.map(row => this.rowToConnection(row));
  }

  /**
   * Convert database row to Connection
   */
  private rowToConnection(row: ConnectionRow): Connection {
    const metadata = JSON.parse(row.metadata);
    
    return {
      id: row.id,
      sourceNodeId: row.source_node_id,
      targetNodeId: row.target_node_id,
      type: row.type,
      confidence: row.confidence,
      metadata: {
        ...metadata,
        discoveredAt: new Date(row.created_at)
      }
    };
  }
}
