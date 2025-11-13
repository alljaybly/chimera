import Database from 'better-sqlite3';
import { UIMutation } from '../../../shared/types/index.js';

export interface UIMutationRow {
  id: string;
  type: 'reorder' | 'resize' | 'hide' | 'show' | 'shortcut';
  target: string;
  parameters: string;
  triggered_by: string;
  applied_at: string;
}

export class UIMutationRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create a new UI mutation
   */
  create(mutation: UIMutation): void {
    const stmt = this.db.prepare(`
      INSERT INTO ui_mutations (id, type, target, parameters, triggered_by, applied_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      mutation.id,
      mutation.type,
      mutation.target,
      JSON.stringify(mutation.parameters),
      mutation.triggeredBy,
      mutation.appliedAt.toISOString()
    );
  }

  /**
   * Find a mutation by ID
   */
  findById(id: string): UIMutation | null {
    const stmt = this.db.prepare('SELECT * FROM ui_mutations WHERE id = ?');
    const row = stmt.get(id) as UIMutationRow | undefined;
    return row ? this.rowToMutation(row) : null;
  }

  /**
   * Find all mutations with optional filters
   */
  findAll(filters?: {
    type?: 'reorder' | 'resize' | 'hide' | 'show' | 'shortcut';
    target?: string;
    limit?: number;
    offset?: number;
  }): UIMutation[] {
    let query = 'SELECT * FROM ui_mutations WHERE 1=1';
    const params: any[] = [];

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.target) {
      query += ' AND target = ?';
      params.push(filters.target);
    }

    query += ' ORDER BY applied_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as UIMutationRow[];
    return rows.map(row => this.rowToMutation(row));
  }

  /**
   * Get mutation history (most recent 100)
   */
  getHistory(limit: number = 100): UIMutation[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ui_mutations 
      ORDER BY applied_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as UIMutationRow[];
    return rows.map(row => this.rowToMutation(row));
  }

  /**
   * Get mutations applied before a specific date
   */
  findBeforeDate(date: Date): UIMutation[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ui_mutations 
      WHERE applied_at <= ?
      ORDER BY applied_at ASC
    `);

    const rows = stmt.all(date.toISOString()) as UIMutationRow[];
    return rows.map(row => this.rowToMutation(row));
  }

  /**
   * Delete a mutation
   */
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM ui_mutations WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Delete mutations applied after a specific date (for revert functionality)
   */
  deleteAfterDate(date: Date): void {
    const stmt = this.db.prepare('DELETE FROM ui_mutations WHERE applied_at > ?');
    stmt.run(date.toISOString());
  }

  /**
   * Keep only the most recent N mutations
   */
  keepRecentOnly(count: number = 100): void {
    const stmt = this.db.prepare(`
      DELETE FROM ui_mutations 
      WHERE id NOT IN (
        SELECT id FROM ui_mutations 
        ORDER BY applied_at DESC 
        LIMIT ?
      )
    `);
    stmt.run(count);
  }

  /**
   * Count total mutations
   */
  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM ui_mutations');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Convert database row to UIMutation
   */
  private rowToMutation(row: UIMutationRow): UIMutation {
    return {
      id: row.id,
      type: row.type,
      target: row.target,
      parameters: JSON.parse(row.parameters),
      triggeredBy: row.triggered_by,
      appliedAt: new Date(row.applied_at)
    };
  }
}
