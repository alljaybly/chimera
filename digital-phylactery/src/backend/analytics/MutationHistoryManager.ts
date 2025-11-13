import { UIMutation } from '../../shared/types/index.js';
import { UIMutationRepository } from '../database/repositories/UIMutationRepository.js';
import { UIMutationSystem } from './UIMutationSystem.js';

/**
 * Represents a historical UI state snapshot
 */
export interface UIStateSnapshot {
  timestamp: Date;
  mutations: UIMutation[];
  description: string;
}

/**
 * Manages mutation history and provides revert functionality
 */
export class MutationHistoryManager {
  private mutationRepository: UIMutationRepository;
  private mutationSystem: UIMutationSystem;
  private readonly MAX_HISTORY_SIZE = 100;

  constructor(mutationRepository: UIMutationRepository, mutationSystem: UIMutationSystem) {
    this.mutationRepository = mutationRepository;
    this.mutationSystem = mutationSystem;
  }

  /**
   * Get the complete mutation history
   */
  getHistory(limit: number = this.MAX_HISTORY_SIZE): UIMutation[] {
    return this.mutationRepository.getHistory(limit);
  }

  /**
   * Get mutations with their trigger descriptions
   */
  getHistoryWithTriggers(): Array<{
    mutation: UIMutation;
    triggeredBy: string;
    appliedAt: Date;
  }> {
    const mutations = this.getHistory();
    return mutations.map(m => ({
      mutation: m,
      triggeredBy: m.triggeredBy,
      appliedAt: m.appliedAt
    }));
  }

  /**
   * Get UI state at a specific point in time
   */
  getStateAtTime(timestamp: Date): UIMutation[] {
    return this.mutationRepository.findBeforeDate(timestamp);
  }

  /**
   * Create a snapshot of the current UI state
   */
  createSnapshot(description: string = 'Manual snapshot'): UIStateSnapshot {
    const mutations = this.mutationSystem.getCurrentState();
    return {
      timestamp: new Date(),
      mutations,
      description
    };
  }

  /**
   * Revert to a specific historical state by timestamp
   */
  revertToTimestamp(timestamp: Date): {
    success: boolean;
    removedMutations: UIMutation[];
    activeState: UIMutation[];
  } {
    // Get mutations that were applied after the target timestamp
    const allMutations = this.getHistory();
    const removedMutations = allMutations.filter(m => m.appliedAt > timestamp);

    // Delete mutations applied after the timestamp
    this.mutationRepository.deleteAfterDate(timestamp);

    // Get the new active state
    const activeState = this.mutationRepository.findBeforeDate(timestamp);

    // Persist the changes
    this.mutationSystem['persistMutations']();

    return {
      success: true,
      removedMutations,
      activeState
    };
  }

  /**
   * Revert to a specific mutation (removes all mutations after it)
   */
  revertToMutation(mutationId: string): {
    success: boolean;
    removedMutations: UIMutation[];
    activeState: UIMutation[];
  } | null {
    const targetMutation = this.mutationRepository.findById(mutationId);
    
    if (!targetMutation) {
      return null;
    }

    return this.revertToTimestamp(targetMutation.appliedAt);
  }

  /**
   * Revert N steps back in history
   */
  revertSteps(steps: number): {
    success: boolean;
    removedMutations: UIMutation[];
    activeState: UIMutation[];
  } | null {
    const history = this.getHistory();
    
    if (steps >= history.length) {
      // Revert all mutations
      return this.revertToTimestamp(new Date(0));
    }

    const targetMutation = history[steps];
    return this.revertToMutation(targetMutation.id);
  }

  /**
   * Get a timeline view of mutations grouped by time periods
   */
  getTimeline(groupByHours: number = 1): Array<{
    period: string;
    startTime: Date;
    endTime: Date;
    mutations: UIMutation[];
    count: number;
  }> {
    const history = this.getHistory();
    const timeline: Array<{
      period: string;
      startTime: Date;
      endTime: Date;
      mutations: UIMutation[];
      count: number;
    }> = [];

    if (history.length === 0) {
      return timeline;
    }

    // Sort by timestamp (oldest first)
    const sortedHistory = [...history].sort((a, b) => 
      a.appliedAt.getTime() - b.appliedAt.getTime()
    );

    const groupMs = groupByHours * 60 * 60 * 1000;
    let currentGroup: UIMutation[] = [];
    let groupStart = sortedHistory[0].appliedAt;

    for (const mutation of sortedHistory) {
      const timeDiff = mutation.appliedAt.getTime() - groupStart.getTime();
      
      if (timeDiff > groupMs && currentGroup.length > 0) {
        // Start new group
        const groupEnd = currentGroup[currentGroup.length - 1].appliedAt;
        timeline.push({
          period: this.formatPeriod(groupStart, groupEnd),
          startTime: groupStart,
          endTime: groupEnd,
          mutations: currentGroup,
          count: currentGroup.length
        });
        
        currentGroup = [mutation];
        groupStart = mutation.appliedAt;
      } else {
        currentGroup.push(mutation);
      }
    }

    // Add the last group
    if (currentGroup.length > 0) {
      const groupEnd = currentGroup[currentGroup.length - 1].appliedAt;
      timeline.push({
        period: this.formatPeriod(groupStart, groupEnd),
        startTime: groupStart,
        endTime: groupEnd,
        mutations: currentGroup,
        count: currentGroup.length
      });
    }

    return timeline.reverse(); // Most recent first
  }

  /**
   * Get mutations grouped by trigger type
   */
  getMutationsByTrigger(): Map<string, UIMutation[]> {
    const history = this.getHistory();
    const grouped = new Map<string, UIMutation[]>();

    for (const mutation of history) {
      if (!grouped.has(mutation.triggeredBy)) {
        grouped.set(mutation.triggeredBy, []);
      }
      grouped.get(mutation.triggeredBy)!.push(mutation);
    }

    return grouped;
  }

  /**
   * Get statistics about mutation history
   */
  getStatistics(): {
    totalMutations: number;
    mutationsByType: Record<string, number>;
    oldestMutation: Date | null;
    newestMutation: Date | null;
    averageMutationsPerDay: number;
  } {
    const history = this.getHistory();
    
    const mutationsByType: Record<string, number> = {
      reorder: 0,
      resize: 0,
      hide: 0,
      show: 0,
      shortcut: 0
    };

    let oldestMutation: Date | null = null;
    let newestMutation: Date | null = null;

    for (const mutation of history) {
      mutationsByType[mutation.type]++;
      
      if (!oldestMutation || mutation.appliedAt < oldestMutation) {
        oldestMutation = mutation.appliedAt;
      }
      if (!newestMutation || mutation.appliedAt > newestMutation) {
        newestMutation = mutation.appliedAt;
      }
    }

    let averageMutationsPerDay = 0;
    if (oldestMutation && newestMutation) {
      const daysDiff = (newestMutation.getTime() - oldestMutation.getTime()) / (1000 * 60 * 60 * 24);
      averageMutationsPerDay = daysDiff > 0 ? history.length / daysDiff : history.length;
    }

    return {
      totalMutations: history.length,
      mutationsByType,
      oldestMutation,
      newestMutation,
      averageMutationsPerDay
    };
  }

  /**
   * Maintain history size limit
   */
  maintainHistoryLimit(): void {
    this.mutationRepository.keepRecentOnly(this.MAX_HISTORY_SIZE);
  }

  /**
   * Format a time period for display
   */
  private formatPeriod(start: Date, end: Date): string {
    const sameDay = start.toDateString() === end.toDateString();
    
    if (sameDay) {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
    } else {
      return `${start.toLocaleString()} - ${end.toLocaleString()}`;
    }
  }
}
