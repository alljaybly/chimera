import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SearchEngine } from './SearchEngine.js';
import { KnowledgeNodeRepository } from '../database/repositories/KnowledgeNodeRepository.js';
import { getDatabaseManager, closeDatabaseManager } from '../database/DatabaseManager.js';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { KnowledgeNode } from '../../shared/types/index.js';

describe('SearchEngine', () => {
  let dbManager: ReturnType<typeof getDatabaseManager>;
  let searchEngine: SearchEngine;
  let nodeRepository: KnowledgeNodeRepository;
  const testDbPath = './data/test-search-engine.db';

  beforeEach(() => {
    dbManager = getDatabaseManager(testDbPath);
    const db = dbManager.getDatabase();
    searchEngine = new SearchEngine(db);
    nodeRepository = new KnowledgeNodeRepository(db);

    // Create test nodes
    const testNodes: KnowledgeNode[] = [
      {
        id: 'node-1',
        type: 'note',
        content: 'JavaScript is a programming language used for web development',
        searchableText: 'JavaScript is a programming language used for web development',
        metadata: {
          title: 'JavaScript Basics',
          tags: ['javascript', 'programming'],
          createdAt: new Date('2024-01-01'),
          modifiedAt: new Date('2024-01-01')
        }
      },
      {
        id: 'node-2',
        type: 'note',
        content: 'TypeScript is a superset of JavaScript with static typing',
        searchableText: 'TypeScript is a superset of JavaScript with static typing',
        metadata: {
          title: 'TypeScript Overview',
          tags: ['typescript', 'javascript', 'programming'],
          createdAt: new Date('2024-01-02'),
          modifiedAt: new Date('2024-01-02')
        }
      },
      {
        id: 'node-3',
        type: 'webpage',
        content: 'Python is a high-level programming language',
        searchableText: 'Python is a high-level programming language',
        metadata: {
          title: 'Python Introduction',
          tags: ['python', 'programming'],
          source: 'https://example.com/python',
          createdAt: new Date('2024-01-03'),
          modifiedAt: new Date('2024-01-03')
        }
      },
      {
        id: 'node-4',
        type: 'image',
        content_path: '/path/to/image.jpg',
        content: '',
        searchableText: 'sunset beach vacation photo',
        metadata: {
          title: 'Beach Sunset',
          tags: ['vacation', 'beach'],
          createdAt: new Date('2024-01-04'),
          modifiedAt: new Date('2024-01-04')
        }
      },
      {
        id: 'node-5',
        type: 'note',
        content: 'React is a JavaScript library for building user interfaces',
        searchableText: 'React is a JavaScript library for building user interfaces',
        metadata: {
          title: 'React Fundamentals',
          tags: ['react', 'javascript', 'frontend'],
          createdAt: new Date('2024-01-05'),
          modifiedAt: new Date('2024-01-05')
        }
      }
    ];

    testNodes.forEach(node => nodeRepository.create(node));
  });

  afterEach(async () => {
    // Close database connection first
    closeDatabaseManager();
    
    // Wait a bit for the connection to fully close
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clean up test database
    if (existsSync(testDbPath)) {
      try {
        await rm(testDbPath, { force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('search with text query', () => {
    it('should find nodes matching text query', () => {
      const results = searchEngine.search({ text: 'JavaScript' });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.node.id === 'node-1')).toBe(true);
      expect(results.some(r => r.node.id === 'node-2')).toBe(true);
    });

    it('should return relevance scores for results', () => {
      const results = searchEngine.search({ text: 'JavaScript' });

      results.forEach(result => {
        expect(result.relevance).toBeGreaterThanOrEqual(0);
        expect(result.relevance).toBeLessThanOrEqual(1);
      });
    });

    it('should extract highlights from matching text', () => {
      const results = searchEngine.search({ text: 'JavaScript' });

      const jsResult = results.find(r => r.node.id === 'node-1');
      expect(jsResult).toBeDefined();
      expect(jsResult!.highlights.length).toBeGreaterThan(0);
      expect(jsResult!.highlights[0]).toContain('<mark>');
      expect(jsResult!.highlights[0]).toContain('</mark>');
    });

    it('should handle multi-word queries', () => {
      const results = searchEngine.search({ text: 'programming language' });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.node.searchableText.includes('programming'))).toBe(true);
    });

    it('should return empty results for non-matching query', () => {
      const results = searchEngine.search({ text: 'nonexistent-term-xyz' });

      expect(results.length).toBe(0);
    });
  });

  describe('search with type filter', () => {
    it('should filter by single content type', () => {
      const results = searchEngine.search({ types: ['note'] });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.type).toBe('note');
      });
    });

    it('should filter by multiple content types', () => {
      const results = searchEngine.search({ types: ['note', 'webpage'] });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(['note', 'webpage']).toContain(result.node.type);
      });
    });

    it('should exclude types not in filter', () => {
      const results = searchEngine.search({ types: ['image'] });

      expect(results.length).toBe(1);
      expect(results[0].node.type).toBe('image');
    });
  });

  describe('search with date range filter', () => {
    it('should filter by start date', () => {
      const results = searchEngine.search({
        dateRange: {
          start: new Date('2024-01-03'),
          end: new Date('2024-01-31')
        }
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.metadata.createdAt.getTime()).toBeGreaterThanOrEqual(
          new Date('2024-01-03').getTime()
        );
      });
    });

    it('should filter by end date', () => {
      const results = searchEngine.search({
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-02')
        }
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.metadata.createdAt.getTime()).toBeLessThanOrEqual(
          new Date('2024-01-02').getTime()
        );
      });
    });

    it('should filter by date range', () => {
      const results = searchEngine.search({
        dateRange: {
          start: new Date('2024-01-02'),
          end: new Date('2024-01-04')
        }
      });

      expect(results.length).toBe(3);
    });
  });

  describe('search with tag filter', () => {
    it('should filter by single tag', () => {
      const results = searchEngine.search({ tags: ['javascript'] });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.metadata.tags).toContain('javascript');
      });
    });

    it('should filter by multiple tags (AND logic)', () => {
      const results = searchEngine.search({ tags: ['javascript', 'programming'] });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.metadata.tags).toContain('javascript');
        expect(result.node.metadata.tags).toContain('programming');
      });
    });

    it('should return empty results if no nodes match all tags', () => {
      const results = searchEngine.search({ tags: ['javascript', 'vacation'] });

      expect(results.length).toBe(0);
    });
  });

  describe('search with combined filters', () => {
    it('should combine text query and type filter', () => {
      const results = searchEngine.search({
        text: 'JavaScript',
        types: ['note']
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.type).toBe('note');
        expect(result.node.searchableText.toLowerCase()).toContain('javascript');
      });
    });

    it('should combine text query, type, and tag filters', () => {
      const results = searchEngine.search({
        text: 'JavaScript',
        types: ['note'],
        tags: ['programming']
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.type).toBe('note');
        expect(result.node.metadata.tags).toContain('programming');
      });
    });

    it('should combine all filter types', () => {
      const results = searchEngine.search({
        text: 'JavaScript',
        types: ['note'],
        tags: ['javascript'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-03')
        }
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.node.type).toBe('note');
        expect(result.node.metadata.tags).toContain('javascript');
        expect(result.node.metadata.createdAt.getTime()).toBeLessThanOrEqual(
          new Date('2024-01-03').getTime()
        );
      });
    });
  });

  describe('pagination', () => {
    it('should respect limit parameter', () => {
      const results = searchEngine.search({}, 2, 0);

      expect(results.length).toBe(2);
    });

    it('should respect offset parameter', () => {
      const firstPage = searchEngine.search({}, 2, 0);
      const secondPage = searchEngine.search({}, 2, 2);

      expect(firstPage.length).toBe(2);
      expect(secondPage.length).toBeGreaterThan(0);
      expect(firstPage[0].node.id).not.toBe(secondPage[0].node.id);
    });

    it('should return correct count', () => {
      const count = searchEngine.count({ text: 'JavaScript' });

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });
  });

  describe('relevance calculation', () => {
    it('should boost relevance for title matches', () => {
      const results = searchEngine.search({ text: 'JavaScript' });

      const titleMatch = results.find(r => r.node.metadata.title?.includes('JavaScript'));
      expect(titleMatch).toBeDefined();
      expect(titleMatch!.relevance).toBeGreaterThan(0.5);
    });

    it('should boost relevance for tag matches', () => {
      const results = searchEngine.search({
        text: 'JavaScript',
        tags: ['javascript']
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.relevance).toBeGreaterThan(0);
      });
    });
  });

  describe('highlight extraction', () => {
    it('should extract context around matches', () => {
      const results = searchEngine.search({ text: 'JavaScript' });

      const result = results.find(r => r.node.id === 'node-1');
      expect(result).toBeDefined();
      expect(result!.highlights.length).toBeGreaterThan(0);
      
      const highlight = result!.highlights[0];
      expect(highlight).toContain('JavaScript');
      expect(highlight).toContain('<mark>');
    });

    it('should limit highlights to 3 per result', () => {
      const results = searchEngine.search({ text: 'programming' });

      results.forEach(result => {
        expect(result.highlights.length).toBeLessThanOrEqual(3);
      });
    });

    it('should add ellipsis for truncated context', () => {
      // Create a node with long content
      const longNode: KnowledgeNode = {
        id: 'long-node',
        type: 'note',
        content: 'A'.repeat(100) + ' JavaScript ' + 'B'.repeat(100),
        searchableText: 'A'.repeat(100) + ' JavaScript ' + 'B'.repeat(100),
        metadata: {
          title: 'Long Content',
          tags: [],
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      };
      nodeRepository.create(longNode);

      const results = searchEngine.search({ text: 'JavaScript' });
      const longResult = results.find(r => r.node.id === 'long-node');

      expect(longResult).toBeDefined();
      expect(longResult!.highlights.length).toBeGreaterThan(0);
      expect(longResult!.highlights[0]).toContain('...');
    });
  });
});
