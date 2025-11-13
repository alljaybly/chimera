import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdaptiveUIEngine } from './AdaptiveUIEngine.js';
import { BehavioralEventRepository } from '../database/repositories/BehavioralEventRepository.js';
import { UIMutationRepository } from '../database/repositories/UIMutationRepository.js';
import { getDatabaseManager } from '../database/DatabaseManager.js';
import { BehavioralEvent, UIMutation } from '../../shared/types/index.js';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('AdaptiveUIEngine', () => {
  let dbManager: ReturnType<typeof getDatabaseManager>;
  let eventRepo: BehavioralEventRepository;
  let mutationRepo: UIMutationRepository;
  let engine: AdaptiveUIEngine;
  const testDbPath = './data/test-adaptive-ui.db';
  const testStoragePath = join(process.cwd(), 'data', 'test-ui-mutations.json');

  beforeEach(() => {
    dbManager = getDatabaseManager(testDbPath);
    eventRepo = dbManager.behavioralEvents;
    mutationRepo = dbManager.uiMutations;
    engine = new AdaptiveUIEngine(eventRepo, mutationRepo, testStoragePath);
  });

  afterEach(async () => {
    // Close database connection
    dbManager.close();
    
    // Wait for connection to close
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clean up test database
    if (existsSync(testDbPath)) {
      try {
        await rm(testDbPath, { force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Clean up test storage file
    if (existsSync(testStoragePath)) {
      await rm(testStoragePath, { force: true });
    }
  });

  describe('Behavioral Hook System', () => {
    it('should register a behavioral hook', () => {
      const hook = {
        id: 'test-hook-1',
        elementSelector: '#test-button',
        eventType: 'click' as const,
        handler: () => {}
      };

      engine.registerHook(hook);
      const hooks = engine.getAllHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0].id).toBe('test-hook-1');
      expect(hooks[0].elementSelector).toBe('#test-button');
    });

    it('should unregister a behavioral hook', () => {
      const hook = {
        id: 'test-hook-2',
        elementSelector: '#test-button',
        eventType: 'click' as const,
        handler: () => {}
      };

      engine.registerHook(hook);
      expect(engine.getAllHooks()).toHaveLength(1);

      const removed = engine.unregisterHook('test-hook-2');
      expect(removed).toBe(true);
      expect(engine.getAllHooks()).toHaveLength(0);
    });

    it('should capture interaction events', () => {
      const eventId = engine.captureInteraction({
        eventType: 'click',
        target: '#test-button',
        metadata: { x: 100, y: 200 }
      });

      expect(eventId).toBeGreaterThan(0);
    });

    it('should store behavioral events in database', () => {
      engine.captureInteraction({
        eventType: 'click',
        target: 'node:123',
        metadata: { nodeId: '123' }
      });

      engine.captureInteraction({
        eventType: 'hover',
        target: 'node:123',
        metadata: { nodeId: '123' }
      });

      const events = eventRepo.findByTarget('node:123');
      expect(events).toHaveLength(2);
    });
  });

  describe('Pattern Detection', () => {
    it('should detect repeated action sequences', () => {
      // Create a sequence that repeats 5+ times
      const sequence = ['search', 'filter', 'export'];
      const now = new Date();

      for (let i = 0; i < 6; i++) {
        for (const target of sequence) {
          const timestamp = new Date(now.getTime() + i * 60000 + sequence.indexOf(target) * 1000);
          eventRepo.create({
            eventType: 'click',
            target,
            timestamp
          });
        }
      }

      const patterns = engine.detectActionSequences(7);
      expect(patterns.length).toBeGreaterThan(0);
      
      const matchingPattern = patterns.find(p => 
        p.sequence.includes('search') && p.occurrences >= 5
      );
      expect(matchingPattern).toBeDefined();
    });

    it('should detect frequently accessed nodes', () => {
      const target = 'node:frequently-accessed';
      const now = new Date();

      // Create 15 access events over 7 days
      for (let i = 0; i < 15; i++) {
        const timestamp = new Date(now.getTime() - i * 12 * 60 * 60 * 1000); // Every 12 hours
        eventRepo.create({
          eventType: 'click',
          target,
          timestamp
        });
      }

      const patterns = engine.detectFrequentAccess(10, 7);
      expect(patterns.length).toBeGreaterThan(0);
      
      const matchingPattern = patterns.find(p => p.target === target);
      expect(matchingPattern).toBeDefined();
      expect(matchingPattern?.accessCount).toBeGreaterThanOrEqual(10);
    });

    it('should detect layout preferences', () => {
      const viewTypes = ['view:graph', 'view:list', 'view:graph'];
      const now = new Date();

      // Create events showing preference for graph view
      for (let i = 0; i < 20; i++) {
        const viewType = i < 15 ? 'view:graph' : 'view:list';
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        eventRepo.create({
          eventType: 'click',
          target: viewType,
          timestamp
        });
      }

      const patterns = engine.detectLayoutPreferences(30);
      expect(patterns.length).toBeGreaterThan(0);
      
      const graphPattern = patterns.find(p => p.viewType === 'view:graph');
      expect(graphPattern).toBeDefined();
      expect(graphPattern?.preferenceScore).toBeGreaterThan(0.5);
    });
  });

  describe('UI Mutation System', () => {
    it('should create a reorder mutation', () => {
      const mutation = engine.createReorderMutation(
        'panel:sidebar',
        0,
        5,
        'User preference'
      );

      expect(mutation.id).toBeDefined();
      expect(mutation.type).toBe('reorder');
      expect(mutation.target).toBe('panel:sidebar');
      expect(mutation.parameters.newPosition).toBe(0);
      expect(mutation.parameters.oldPosition).toBe(5);
    });

    it('should create a resize mutation', () => {
      const mutation = engine.createResizeMutation(
        'panel:sidebar',
        300,
        undefined,
        'User resized'
      );

      expect(mutation.type).toBe('resize');
      expect(mutation.parameters.width).toBe(300);
    });

    it('should create hide and show mutations', () => {
      const hideMutation = engine.createHideMutation('panel:help', 'Rarely used');
      expect(hideMutation.type).toBe('hide');
      expect(hideMutation.parameters.hidden).toBe(true);

      const showMutation = engine.createShowMutation('panel:help', 'User requested');
      expect(showMutation.type).toBe('show');
      expect(showMutation.parameters.hidden).toBe(false);
    });

    it('should create a shortcut mutation', () => {
      const mutation = engine.createShortcutMutation(
        'shortcut:quick-export',
        {
          action: 'search->filter->export',
          label: 'Quick Export',
          sequence: ['search', 'filter', 'export']
        },
        'Repeated action detected'
      );

      expect(mutation.type).toBe('shortcut');
      expect(mutation.parameters.action).toBe('search->filter->export');
      expect(mutation.parameters.sequence).toEqual(['search', 'filter', 'export']);
    });

    it('should persist mutations to JSON storage', () => {
      engine.createReorderMutation('test-target', 0, 1, 'test');
      
      // Verify file was created
      expect(existsSync(testStoragePath)).toBe(true);
    });

    it('should get current UI state', () => {
      engine.createReorderMutation('panel:sidebar', 0, 1, 'test');
      engine.createResizeMutation('panel:sidebar', 300, undefined, 'test');
      engine.createHideMutation('panel:help', 'test');

      const state = engine.getCurrentState();
      expect(state.length).toBeGreaterThan(0);
    });
  });

  describe('Mutation History and Revert', () => {
    it('should maintain mutation history', () => {
      engine.createReorderMutation('target1', 0, 1, 'test1');
      engine.createResizeMutation('target2', 300, undefined, 'test2');
      engine.createHideMutation('target3', 'test3');

      const history = engine.getHistory();
      expect(history.length).toBe(3);
    });

    it('should get history with triggers', () => {
      engine.createReorderMutation('target1', 0, 1, 'User preference');
      
      const historyWithTriggers = engine.getHistoryWithTriggers();
      expect(historyWithTriggers.length).toBe(1);
      expect(historyWithTriggers[0].triggeredBy).toBe('User preference');
    });

    it('should revert to a specific timestamp', () => {
      const mutation1 = engine.createReorderMutation('target1', 0, 1, 'test1');
      
      // Wait a bit to ensure different timestamps
      const revertPoint = new Date(Date.now() + 10);
      
      engine.createResizeMutation('target2', 300, undefined, 'test2');
      engine.createHideMutation('target3', 'test3');

      const result = engine.revertToState(revertPoint);
      expect(result.success).toBe(true);
      expect(result.removedMutations.length).toBe(2);
    });

    it('should revert to a specific mutation', () => {
      const mutation1 = engine.createReorderMutation('target1', 0, 1, 'test1');
      engine.createResizeMutation('target2', 300, undefined, 'test2');
      engine.createHideMutation('target3', 'test3');

      const result = engine.revertToMutation(mutation1.id);
      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });

    it('should revert N steps back', () => {
      engine.createReorderMutation('target1', 0, 1, 'test1');
      engine.createResizeMutation('target2', 300, undefined, 'test2');
      engine.createHideMutation('target3', 'test3');

      const result = engine.revertSteps(1);
      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.removedMutations.length).toBe(1);
    });

    it('should get timeline view of mutations', () => {
      engine.createReorderMutation('target1', 0, 1, 'test1');
      engine.createResizeMutation('target2', 300, undefined, 'test2');

      const timeline = engine.getTimeline(1);
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0].mutations).toBeDefined();
      expect(timeline[0].count).toBeGreaterThan(0);
    });

    it('should create state snapshots', () => {
      engine.createReorderMutation('target1', 0, 1, 'test1');
      
      const snapshot = engine.createSnapshot('Test snapshot');
      expect(snapshot.timestamp).toBeInstanceOf(Date);
      expect(snapshot.description).toBe('Test snapshot');
      expect(snapshot.mutations.length).toBeGreaterThan(0);
    });

    it('should get mutation statistics', () => {
      engine.createReorderMutation('target1', 0, 1, 'test1');
      engine.createResizeMutation('target2', 300, undefined, 'test2');
      engine.createHideMutation('target3', 'test3');

      const stats = engine.getStatistics();
      expect(stats.totalMutations).toBe(3);
      expect(stats.mutationsByType.reorder).toBe(1);
      expect(stats.mutationsByType.resize).toBe(1);
      expect(stats.mutationsByType.hide).toBe(1);
    });
  });

  describe('Mutation Loader', () => {
    it('should load mutations on startup', async () => {
      // Create some mutations first
      engine.createReorderMutation('target1', 0, 1, 'test1');
      engine.createResizeMutation('target2', 300, undefined, 'test2');

      // Create a new engine instance to simulate app restart
      const newEngine = new AdaptiveUIEngine(eventRepo, mutationRepo, testStoragePath);
      
      const result = await newEngine.loadMutations();
      expect(result.success).toBe(true);
      expect(result.loadTimeMs).toBeLessThan(2000); // Must complete within 2 seconds
    });

    it('should verify storage integrity', () => {
      engine.createReorderMutation('target1', 0, 1, 'test1');

      const integrity = engine.verifyStorageIntegrity();
      expect(integrity.exists).toBe(true);
      expect(integrity.readable).toBe(true);
      expect(integrity.validJson).toBe(true);
      expect(integrity.mutationCount).toBeGreaterThan(0);
    });

    it('should get mutations to load', () => {
      engine.createReorderMutation('target1', 0, 1, 'test1');
      engine.createResizeMutation('target2', 300, undefined, 'test2');

      const mutations = engine.getMutationsToLoad();
      expect(mutations.length).toBe(2);
      // Should be sorted chronologically
      expect(mutations[0].appliedAt.getTime()).toBeLessThanOrEqual(mutations[1].appliedAt.getTime());
    });
  });

  describe('Pattern Analysis and Auto-Mutation', () => {
    it('should automatically create mutations from detected patterns', () => {
      // Create repeated action sequence
      const sequence = ['search', 'filter', 'export'];
      const now = new Date();

      for (let i = 0; i < 6; i++) {
        for (const target of sequence) {
          const timestamp = new Date(now.getTime() + i * 60000 + sequence.indexOf(target) * 1000);
          eventRepo.create({
            eventType: 'click',
            target,
            timestamp
          });
        }
      }

      const result = engine.analyzePatterns();
      expect(result.mutationsCreated.length).toBeGreaterThan(0);
      
      // Should have created a shortcut mutation
      const shortcutMutation = result.mutationsCreated.find(m => m.type === 'shortcut');
      expect(shortcutMutation).toBeDefined();
    });

    it('should promote frequently accessed nodes', () => {
      const target = 'node:important';
      const now = new Date();

      // Create 12 access events
      for (let i = 0; i < 12; i++) {
        const timestamp = new Date(now.getTime() - i * 12 * 60 * 60 * 1000);
        eventRepo.create({
          eventType: 'click',
          target,
          timestamp
        });
      }

      const result = engine.analyzePatterns();
      
      // Should have created a reorder mutation to promote the node
      const reorderMutation = result.mutationsCreated.find(
        m => m.type === 'reorder' && m.target === target
      );
      expect(reorderMutation).toBeDefined();
    });
  });

  describe('Maintenance', () => {
    it('should clean up old events', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const recentDate = new Date();

      eventRepo.create({
        eventType: 'click',
        target: 'old-target',
        timestamp: oldDate
      });

      eventRepo.create({
        eventType: 'click',
        target: 'recent-target',
        timestamp: recentDate
      });

      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      engine.cleanupOldEvents(cutoffDate);

      const recentEvents = eventRepo.findRecent(100);
      const hasOldEvent = recentEvents.some(e => e.target === 'old-target');
      expect(hasOldEvent).toBe(false);
    });

    it('should maintain history size limit', () => {
      // Create more than 100 mutations
      for (let i = 0; i < 110; i++) {
        engine.createReorderMutation(`target${i}`, 0, 1, `test${i}`);
      }

      engine.maintainHistoryLimit();

      const history = engine.getHistory(200);
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });
});
