import Database from 'better-sqlite3';
import { KnowledgeNode, SearchQuery, SearchResult } from '../../shared/types/index.js';
import { KnowledgeNodeRepository } from '../database/repositories/KnowledgeNodeRepository.js';

export class SearchEngine {
  private nodeRepository: KnowledgeNodeRepository;

  constructor(private db: Database.Database) {
    this.nodeRepository = new KnowledgeNodeRepository(db);
  }

  /**
   * Execute a search query with filters
   */
  search(query: SearchQuery, limit: number = 50, offset: number = 0): SearchResult[] {
    const startTime = Date.now();

    const params: any[] = [];
    const whereClauses: string[] = [];
    
    // Build the SQL query based on whether we have a text search
    let sql: string;
    
    // Full-text search if text query provided
    if (query.text && query.text.trim()) {
      sql = `
        SELECT kn.*, 
               fts.rank as fts_rank
        FROM knowledge_nodes kn
        INNER JOIN nodes_fts fts ON kn.rowid = fts.rowid
      `;
      whereClauses.push(`nodes_fts MATCH ?`);
      // Escape the search term for FTS5 by quoting it
      const searchTerm = `"${query.text.trim().replace(/"/g, '""')}"`;
      params.push(searchTerm);
    } else {
      // No text search
      sql = `
        SELECT kn.*, 
               0 as fts_rank
        FROM knowledge_nodes kn
      `;
    }

    // Filter by content types
    if (query.types && query.types.length > 0) {
      const typePlaceholders = query.types.map(() => '?').join(', ');
      whereClauses.push(`kn.type IN (${typePlaceholders})`);
      params.push(...query.types);
    }

    // Filter by date range
    if (query.dateRange) {
      if (query.dateRange.start) {
        whereClauses.push(`kn.created_at >= ?`);
        params.push(query.dateRange.start.toISOString());
      }
      if (query.dateRange.end) {
        whereClauses.push(`kn.created_at <= ?`);
        params.push(query.dateRange.end.toISOString());
      }
    }

    // Filter by tags (tags are stored in metadata JSON)
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        whereClauses.push(`json_extract(kn.metadata, '$.tags') LIKE ?`);
        params.push(`%"${tag}"%`);
      }
    }

    // Add WHERE clause if we have any conditions
    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Order by relevance (FTS rank) if text search, otherwise by date
    if (query.text && query.text.trim()) {
      sql += ` ORDER BY fts_rank`;
    } else {
      sql += ` ORDER BY kn.created_at DESC`;
    }

    // Add pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute query
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    // Convert rows to SearchResults
    const results = rows.map(row => {
      const node = this.nodeRepository['rowToNode'](row);
      const relevance = this.calculateRelevance(node, query, row.fts_rank);
      const highlights = this.extractHighlights(node, query);

      return {
        node,
        relevance,
        highlights
      } as SearchResult;
    });

    const elapsedTime = Date.now() - startTime;
    console.log(`Search completed in ${elapsedTime}ms`);

    return results;
  }

  /**
   * Count total results for a query (for pagination)
   */
  count(query: SearchQuery): number {
    let sql = `SELECT COUNT(*) as count FROM knowledge_nodes kn`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    // Full-text search if text query provided
    if (query.text && query.text.trim()) {
      sql += ` INNER JOIN nodes_fts fts ON kn.rowid = fts.rowid`;
      whereClauses.push(`nodes_fts MATCH ?`);
      // Escape the search term for FTS5 by quoting it
      const searchTerm = `"${query.text.trim().replace(/"/g, '""')}"`;
      params.push(searchTerm);
    }

    // Filter by content types
    if (query.types && query.types.length > 0) {
      const typePlaceholders = query.types.map(() => '?').join(', ');
      whereClauses.push(`kn.type IN (${typePlaceholders})`);
      params.push(...query.types);
    }

    // Filter by date range
    if (query.dateRange) {
      if (query.dateRange.start) {
        whereClauses.push(`kn.created_at >= ?`);
        params.push(query.dateRange.start.toISOString());
      }
      if (query.dateRange.end) {
        whereClauses.push(`kn.created_at <= ?`);
        params.push(query.dateRange.end.toISOString());
      }
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        whereClauses.push(`json_extract(kn.metadata, '$.tags') LIKE ?`);
        params.push(`%"${tag}"%`);
      }
    }

    // Add WHERE clause if we have any conditions
    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  /**
   * Calculate relevance score for a search result
   */
  private calculateRelevance(node: KnowledgeNode, query: SearchQuery, ftsRank: number): number {
    let score = 0;

    // FTS rank contributes to relevance (normalize from negative rank)
    if (query.text && query.text.trim()) {
      // FTS5 rank is negative, closer to 0 is better
      // Normalize to 0-1 range (assuming rank between -10 and 0)
      score += Math.max(0, (10 + ftsRank) / 10) * 0.6;
    } else {
      // No text search, base score
      score = 0.5;
    }

    // Boost score if tags match
    if (query.tags && query.tags.length > 0) {
      const matchingTags = query.tags.filter(tag => 
        node.metadata.tags.includes(tag)
      ).length;
      score += (matchingTags / query.tags.length) * 0.2;
    }

    // Boost score for recent content
    const daysSinceCreation = (Date.now() - node.metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      score += 0.1;
    }

    // Boost score if title matches query text
    if (query.text && node.metadata.title) {
      const titleLower = node.metadata.title.toLowerCase();
      const queryLower = query.text.toLowerCase();
      if (titleLower.includes(queryLower)) {
        score += 0.1;
      }
    }

    // Normalize to 0-1 range
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Extract highlighted text segments that match the query
   */
  private extractHighlights(node: KnowledgeNode, query: SearchQuery): string[] {
    const highlights: string[] = [];

    if (!query.text || !query.text.trim()) {
      return highlights;
    }

    const searchTerms = query.text.toLowerCase().split(/\s+/);
    const text = node.searchableText.toLowerCase();
    const originalText = node.searchableText;

    // Find matches for each search term
    for (const term of searchTerms) {
      let index = text.indexOf(term);
      while (index !== -1 && highlights.length < 3) {
        // Extract context around the match (50 chars before and after)
        const start = Math.max(0, index - 50);
        const end = Math.min(originalText.length, index + term.length + 50);
        
        let highlight = originalText.substring(start, end);
        
        // Add ellipsis if we're not at the start/end
        if (start > 0) highlight = '...' + highlight;
        if (end < originalText.length) highlight = highlight + '...';

        // Wrap the matching term in markers
        const matchStart = index - start + (start > 0 ? 3 : 0);
        const matchEnd = matchStart + term.length;
        highlight = 
          highlight.substring(0, matchStart) +
          '<mark>' + highlight.substring(matchStart, matchEnd) + '</mark>' +
          highlight.substring(matchEnd);

        highlights.push(highlight);
        
        // Find next occurrence
        index = text.indexOf(term, index + 1);
      }
    }

    return highlights.slice(0, 3); // Return max 3 highlights
  }
}
