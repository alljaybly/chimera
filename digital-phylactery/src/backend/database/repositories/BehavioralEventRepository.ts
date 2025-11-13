import Database from 'better-sqlite3';

export interface BehavioralEvent {
  id?: number;
  eventType: 'click' | 'hover' | 'focus' | 'scroll';
  target: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface BehavioralEventRow {
  id: number;
  event_type: 'click' | 'hover' | 'focus' | 'scroll';
  target: string;
  metadata: string | null;
  timestamp: string;
}

export class BehavioralEventRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create a new behavioral event
   */
  create(event: BehavioralEvent): number {
    const stmt = this.db.prepare(`
      INSERT INTO behavioral_events (event_type, target, metadata, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      event.eventType,
      event.target,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.timestamp.toISOString()
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Find events by target
   */
  findByTarget(target: string, limit: number = 100): BehavioralEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM behavioral_events 
      WHERE target = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(target, limit) as BehavioralEventRow[];
    return rows.map(row => this.rowToEvent(row));
  }

  /**
   * Find events by type
   */
  findByType(eventType: 'click' | 'hover' | 'focus' | 'scroll', limit: number = 100): BehavioralEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM behavioral_events 
      WHERE event_type = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(eventType, limit) as BehavioralEventRow[];
    return rows.map(row => this.rowToEvent(row));
  }

  /**
   * Find events within a time range
   */
  findByTimeRange(startDate: Date, endDate: Date): BehavioralEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM behavioral_events 
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(startDate.toISOString(), endDate.toISOString()) as BehavioralEventRow[];
    return rows.map(row => this.rowToEvent(row));
  }

  /**
   * Get recent events
   */
  findRecent(limit: number = 100): BehavioralEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM behavioral_events 
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as BehavioralEventRow[];
    return rows.map(row => this.rowToEvent(row));
  }

  /**
   * Count events by target
   */
  countByTarget(target: string, since?: Date): number {
    let query = 'SELECT COUNT(*) as count FROM behavioral_events WHERE target = ?';
    const params: any[] = [target];

    if (since) {
      query += ' AND timestamp >= ?';
      params.push(since.toISOString());
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  /**
   * Delete old events (cleanup)
   */
  deleteOlderThan(date: Date): void {
    const stmt = this.db.prepare('DELETE FROM behavioral_events WHERE timestamp < ?');
    stmt.run(date.toISOString());
  }

  /**
   * Convert database row to BehavioralEvent
   */
  private rowToEvent(row: BehavioralEventRow): BehavioralEvent {
    return {
      id: row.id,
      eventType: row.event_type,
      target: row.target,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: new Date(row.timestamp)
    };
  }
}
