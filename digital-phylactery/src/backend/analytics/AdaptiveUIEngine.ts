import { BehavioralHook, BehavioralEvent, UIMutation } from '../../shared/types/index.js';
import { BehavioralEventRepository } from '../database/repositories/BehavioralEventRepository.js';
import { UIMutationRepository } from '../database/repositories/UIMutationRepository.js';
import { BehavioralHookSystem } from './BehavioralHookSystem.js';
import { PatternDetector, ActionSequencePattern, FrequentAccessPattern, LayoutPreferencePattern } from './PatternDetector.js';
import { UIMutationSystem, ShortcutParameters } from './UIMutationSystem.js';
import { MutationHistoryManager, UIStateSnapshot } from './MutationHistoryManager.js';
import { MutationLoader, LoadResult } from './MutationLoader.js';

/**
 * Main Adaptive UI Engine that coordinates all adaptive UI functionality
 */
export class AdaptiveUIEngine {
  private hookSystem: BehavioralHookSystem;
  private patternDetector: PatternDetector;
  private mutationSystem: UIMutationSystem;
  private historyManager: MutationHistoryManager;
  private mutationLoader: MutationLoader;

  constructor(
    eventRepository: BehavioralEventRepository,
    mutationRepository: UIMutationRepository,
    storagePath?: string
  ) {
    this.hookSystem = new BehavioralHookSystem(eventRepository);
    this.patternDetector = new PatternDetector(eventRepository);
    this.mutationSystem = new UIMutationSystem(mutationRepository, storagePath);
    this.historyManager = new MutationHistoryManager(mutationRepository, this.mutationSystem);
    this.mutationLoader = new MutationLoader(mutationRepository, storagePath);
  }

  // ===== Behavioral Hook Management =====

  /**
   * Register a behavioral hook
   */
  registerHook(hook: BehavioralHook): void {
    this.hookSystem.registerHook(hook);
  }

  /**
   * Unregister a behavioral hook
   */
  unregisterHook(hookId: string): boolean {
    return this.hookSystem.unregisterHook(hookId);
  }

  /**
   * Capture an interaction event
   */
  captureInteraction(event: Omit<BehavioralEvent, 'id' | 'timestamp'>): number {
    return this.hookSystem.captureEvent(event);
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): BehavioralHook[] {
    return this.hookSystem.getAllHooks();
  }

  // ===== Pattern Detection =====

  /**
   * Analyze patterns and automatically create mutations
   */
  analyzePatterns(): {
    actionSequences: ActionSequencePattern[];
    frequentAccess: FrequentAccessPattern[];
    layoutPreferences: LayoutPreferencePattern[];
    mutationsCreated: UIMutation[];
  } {
    const patterns = this.patternDetector.detectAllPatterns();
    const mutationsCreated: UIMutation[] = [];

    // Create shortcuts for repeated action sequences
    for (const sequence of patterns.actionSequences) {
      if (sequence.confidence >= 0.5) {
        const mutation = this.mutationSystem.createShortcutMutation(
          `shortcut:${sequence.sequence.join('-')}`,
          {
            action: sequence.sequence.join('->'),
            label: `Quick: ${sequence.sequence.slice(0, 2).join(' → ')}...`,
            sequence: sequence.sequence
          },
          `Repeated action sequence detected (${sequence.occurrences} times)`
        );
        mutationsCreated.push(mutation);
      }
    }

    // Promote frequently accessed nodes
    for (const access of patterns.frequentAccess) {
      if (access.accessCount >= 10) {
        const mutation = this.mutationSystem.createReorderMutation(
          access.target,
          { newPosition: 0, oldPosition: -1 },
          `Frequently accessed (${access.accessCount} times in 7 days)`
        );
        mutationsCreated.push(mutation);
      }
    }

    // Apply layout preferences
    for (const layout of patterns.layoutPreferences) {
      if (layout.preferenceScore >= 0.5) {
        const mutation = this.mutationSystem.createShowMutation(
          layout.viewType,
          `Preferred layout (${Math.round(layout.preferenceScore * 100)}% usage)`
        );
        mutationsCreated.push(mutation);
      }
    }

    return {
      ...patterns,
      mutationsCreated
    };
  }

  /**
   * Detect action sequences
   */
  detectActionSequences(windowDays: number = 7): ActionSequencePattern[] {
    return this.patternDetector.detectActionSequences(windowDays);
  }

  /**
   * Detect frequently accessed nodes
   */
  detectFrequentAccess(threshold: number = 10, windowDays: number = 7): FrequentAccessPattern[] {
    return this.patternDetector.detectFrequentAccess(threshold, windowDays);
  }

  /**
   * Detect layout preferences
   */
  detectLayoutPreferences(windowDays: number = 30): LayoutPreferencePattern[] {
    return this.patternDetector.detectLayoutPreferences(windowDays);
  }

  // ===== UI Mutation Management =====

  /**
   * Apply a UI mutation
   */
  applyMutation(mutation: UIMutation): void {
    this.mutationSystem.applyMutation(mutation);
  }

  /**
   * Create a reorder mutation
   */
  createReorderMutation(target: string, newPosition: number, oldPosition: number, triggeredBy: string): UIMutation {
    return this.mutationSystem.createReorderMutation(
      target,
      { newPosition, oldPosition },
      triggeredBy
    );
  }

  /**
   * Create a resize mutation
   */
  createResizeMutation(target: string, width?: number | string, height?: number | string, triggeredBy?: string): UIMutation {
    return this.mutationSystem.createResizeMutation(
      target,
      { width, height },
      triggeredBy || 'Manual resize'
    );
  }

  /**
   * Create a hide mutation
   */
  createHideMutation(target: string, triggeredBy: string): UIMutation {
    return this.mutationSystem.createHideMutation(target, triggeredBy);
  }

  /**
   * Create a show mutation
   */
  createShowMutation(target: string, triggeredBy: string): UIMutation {
    return this.mutationSystem.createShowMutation(target, triggeredBy);
  }

  /**
   * Create a shortcut mutation
   */
  createShortcutMutation(target: string, parameters: ShortcutParameters, triggeredBy: string): UIMutation {
    return this.mutationSystem.createShortcutMutation(target, parameters, triggeredBy);
  }

  /**
   * Get current UI state
   */
  getCurrentState(): UIMutation[] {
    return this.mutationSystem.getCurrentState();
  }

  // ===== History and Revert =====

  /**
   * Get mutation history
   */
  getHistory(limit: number = 100): UIMutation[] {
    return this.historyManager.getHistory(limit);
  }

  /**
   * Get history with trigger descriptions
   */
  getHistoryWithTriggers(): Array<{
    mutation: UIMutation;
    triggeredBy: string;
    appliedAt: Date;
  }> {
    return this.historyManager.getHistoryWithTriggers();
  }

  /**
   * Revert to a specific timestamp
   */
  revertToState(timestamp: Date): {
    success: boolean;
    removedMutations: UIMutation[];
    activeState: UIMutation[];
  } {
    return this.historyManager.revertToTimestamp(timestamp);
  }

  /**
   * Revert to a specific mutation
   */
  revertToMutation(mutationId: string): {
    success: boolean;
    removedMutations: UIMutation[];
    activeState: UIMutation[];
  } | null {
    return this.historyManager.revertToMutation(mutationId);
  }

  /**
   * Revert N steps back
   */
  revertSteps(steps: number): {
    success: boolean;
    removedMutations: UIMutation[];
    activeState: UIMutation[];
  } | null {
    return this.historyManager.revertSteps(steps);
  }

  /**
   * Get timeline view of mutations
   */
  getTimeline(groupByHours: number = 1): Array<{
    period: string;
    startTime: Date;
    endTime: Date;
    mutations: UIMutation[];
    count: number;
  }> {
    return this.historyManager.getTimeline(groupByHours);
  }

  /**
   * Create a snapshot of current state
   */
  createSnapshot(description?: string): UIStateSnapshot {
    return this.historyManager.createSnapshot(description);
  }

  /**
   * Get mutation statistics
   */
  getStatistics(): {
    totalMutations: number;
    mutationsByType: Record<string, number>;
    oldestMutation: Date | null;
    newestMutation: Date | null;
    averageMutationsPerDay: number;
  } {
    return this.historyManager.getStatistics();
  }

  // ===== Startup and Initialization =====

  /**
   * Load mutations on app startup
   */
  async loadMutations(): Promise<LoadResult> {
    return this.mutationLoader.loadMutations();
  }

  /**
   * Get mutations that will be loaded
   */
  getMutationsToLoad(): UIMutation[] {
    return this.mutationLoader.getMutationsToLoad();
  }

  /**
   * Verify storage integrity
   */
  verifyStorageIntegrity(): {
    exists: boolean;
    readable: boolean;
    validJson: boolean;
    mutationCount: number;
    errors: string[];
  } {
    return this.mutationLoader.verifyStorageIntegrity();
  }

  // ===== Maintenance =====

  /**
   * Clean up old events
   */
  cleanupOldEvents(olderThan: Date): void {
    this.hookSystem.cleanupOldEvents(olderThan);
  }

  /**
   * Maintain history size limit
   */
  maintainHistoryLimit(): void {
    this.historyManager.maintainHistoryLimit();
  }
}
