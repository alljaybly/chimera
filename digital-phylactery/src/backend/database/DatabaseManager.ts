import Database from 'better-sqlite3';
import { getDatabase, closeDatabase } from './init.js';
import { KnowledgeNodeRepository } from './repositories/KnowledgeNodeRepository.js';
import { ConnectionRepository } from './repositories/ConnectionRepository.js';
import { BehavioralEventRepository } from './repositories/BehavioralEventRepository.js';
import { UIMutationRepository } from './repositories/UIMutationRepository.js';

/**
 * Central database manager providing access to all repositories
 */
export class DatabaseManager {
  private db: Database.Database;
  public knowledgeNodes: KnowledgeNodeRepository;
  public connections: ConnectionRepository;
  public behavioralEvents: BehavioralEventRepository;
  public uiMutations: UIMutationRepository;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
    this.knowledgeNodes = new KnowledgeNodeRepository(this.db);
    this.connections = new ConnectionRepository(this.db);
    this.behavioralEvents = new BehavioralEventRepository(this.db);
    this.uiMutations = new UIMutationRepository(this.db);
  }

  /**
   * Get the raw database instance for custom queries
   */
  getDatabase(): Database.Database {
    return this.db;
  }

  /**
   * Execute a transaction
   */
  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  /**
   * Close the database connection
   */
  close(): void {
    closeDatabase();
  }
}

// Singleton instance
let dbManager: DatabaseManager | null = null;

/**
 * Get the singleton database manager instance
 */
export function getDatabaseManager(dbPath?: string): DatabaseManager {
  if (!dbManager) {
    dbManager = new DatabaseManager(dbPath);
  }
  return dbManager;
}

/**
 * Close the database manager
 */
export function closeDatabaseManager(): void {
  if (dbManager) {
    dbManager.close();
    dbManager = null;
  }
}
