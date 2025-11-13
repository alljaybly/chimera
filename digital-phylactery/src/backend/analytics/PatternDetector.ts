import { BehavioralEvent } from '../../shared/types/index.js';
import { BehavioralEventRepository } from '../database/repositories/BehavioralEventRepository.js';

/**
 * Represents a detected action sequence pattern
 */
export interface ActionSequencePattern {
  sequence: string[]; // Array of target identifiers in order
  occurrences: number;
  lastOccurrence: Date;
  confidence: number; // 0.0 to 1.0
}

/**
 * Represents a frequently accessed node pattern
 */
export interface FrequentAccessPattern {
  target: string;
  accessCount: number;
  firstAccess: Date;
  lastAccess: Date;
  averageInterval: number; // Average time between accesses in milliseconds
}

/**
 * Represents layout preference patterns
 */
export interface LayoutPreferencePattern {
  viewType: string;
  timeSpent: number; // Total time in milliseconds
  accessCount: number;
  lastAccess: Date;
  preferenceScore: number; // 0.0 to 1.0
}

/**
 * Detects behavioral patterns from user interaction events
 */
export class PatternDetector {
  private eventRepository: BehavioralEventRepository;
  private readonly SEQUENCE_MIN_REPETITIONS = 5;
  private readonly FREQUENT_ACCESS_THRESHOLD = 10;
  private readonly FREQUENT_ACCESS_WINDOW_DAYS = 7;

  constructor(eventRepository: BehavioralEventRepository) {
    this.eventRepository = eventRepository;
  }

  /**
   * Detect repeated action sequences (5+ repetitions)
   */
  detectActionSequences(windowDays: number = 7): ActionSequencePattern[] {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);
    
    const events = this.eventRepository.findByTimeRange(startDate, new Date());
    
    // Group events by type and extract sequences
    const sequences = this.extractSequences(events);
    
    // Find patterns that repeat 5+ times
    const patterns: ActionSequencePattern[] = [];
    
    for (const [sequenceKey, occurrences] of sequences.entries()) {
      if (occurrences.length >= this.SEQUENCE_MIN_REPETITIONS) {
        const sequence = sequenceKey.split('->');
        const lastOccurrence = occurrences[occurrences.length - 1];
        const confidence = Math.min(occurrences.length / 10, 1.0); // Max confidence at 10 repetitions
        
        patterns.push({
          sequence,
          occurrences: occurrences.length,
          lastOccurrence,
          confidence
        });
      }
    }
    
    return patterns.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Identify frequently accessed nodes (10+ accesses in 7 days)
   */
  detectFrequentAccess(
    threshold: number = this.FREQUENT_ACCESS_THRESHOLD,
    windowDays: number = this.FREQUENT_ACCESS_WINDOW_DAYS
  ): FrequentAccessPattern[] {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);
    
    const events = this.eventRepository.findByTimeRange(startDate, new Date());
    
    // Group events by target
    const targetAccess = new Map<string, Date[]>();
    
    for (const event of events) {
      if (event.eventType === 'click') { // Focus on click events for access
        if (!targetAccess.has(event.target)) {
          targetAccess.set(event.target, []);
        }
        targetAccess.get(event.target)!.push(event.timestamp);
      }
    }
    
    // Find targets with threshold+ accesses
    const patterns: FrequentAccessPattern[] = [];
    
    for (const [target, timestamps] of targetAccess.entries()) {
      if (timestamps.length >= threshold) {
        timestamps.sort((a, b) => a.getTime() - b.getTime());
        
        const firstAccess = timestamps[0];
        const lastAccess = timestamps[timestamps.length - 1];
        
        // Calculate average interval between accesses
        let totalInterval = 0;
        for (let i = 1; i < timestamps.length; i++) {
          totalInterval += timestamps[i].getTime() - timestamps[i - 1].getTime();
        }
        const averageInterval = timestamps.length > 1 ? totalInterval / (timestamps.length - 1) : 0;
        
        patterns.push({
          target,
          accessCount: timestamps.length,
          firstAccess,
          lastAccess,
          averageInterval
        });
      }
    }
    
    return patterns.sort((a, b) => b.accessCount - a.accessCount);
  }

  /**
   * Track layout preferences and time spent in views
   */
  detectLayoutPreferences(windowDays: number = 30): LayoutPreferencePattern[] {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);
    
    const events = this.eventRepository.findByTimeRange(startDate, new Date());
    
    // Track view-related events
    const viewPatterns = new Map<string, {
      timestamps: Date[];
      accessCount: number;
    }>();
    
    for (const event of events) {
      // Look for view-related targets (e.g., "view:graph", "view:list", "panel:sidebar")
      if (event.target.startsWith('view:') || event.target.startsWith('panel:')) {
        if (!viewPatterns.has(event.target)) {
          viewPatterns.set(event.target, { timestamps: [], accessCount: 0 });
        }
        const pattern = viewPatterns.get(event.target)!;
        pattern.timestamps.push(event.timestamp);
        pattern.accessCount++;
      }
    }
    
    // Calculate time spent and preference scores
    const patterns: LayoutPreferencePattern[] = [];
    let totalAccessCount = 0;
    
    for (const pattern of viewPatterns.values()) {
      totalAccessCount += pattern.accessCount;
    }
    
    for (const [viewType, data] of viewPatterns.entries()) {
      data.timestamps.sort((a, b) => a.getTime() - b.getTime());
      
      // Estimate time spent (sum of intervals between consecutive accesses, capped at 5 minutes per interval)
      let timeSpent = 0;
      const MAX_INTERVAL = 5 * 60 * 1000; // 5 minutes
      
      for (let i = 1; i < data.timestamps.length; i++) {
        const interval = data.timestamps[i].getTime() - data.timestamps[i - 1].getTime();
        timeSpent += Math.min(interval, MAX_INTERVAL);
      }
      
      const preferenceScore = totalAccessCount > 0 ? data.accessCount / totalAccessCount : 0;
      
      patterns.push({
        viewType,
        timeSpent,
        accessCount: data.accessCount,
        lastAccess: data.timestamps[data.timestamps.length - 1],
        preferenceScore
      });
    }
    
    return patterns.sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  /**
   * Extract action sequences from events
   */
  private extractSequences(events: BehavioralEvent[]): Map<string, Date[]> {
    const sequences = new Map<string, Date[]>();
    const SEQUENCE_LENGTH = 3; // Look for 3-action sequences
    const MAX_TIME_GAP = 30000; // 30 seconds max between actions in a sequence
    
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Sliding window to find sequences
    for (let i = 0; i <= sortedEvents.length - SEQUENCE_LENGTH; i++) {
      const window = sortedEvents.slice(i, i + SEQUENCE_LENGTH);
      
      // Check if events are within time gap
      let validSequence = true;
      for (let j = 1; j < window.length; j++) {
        const timeDiff = window[j].timestamp.getTime() - window[j - 1].timestamp.getTime();
        if (timeDiff > MAX_TIME_GAP) {
          validSequence = false;
          break;
        }
      }
      
      if (validSequence) {
        const sequenceKey = window.map(e => e.target).join('->');
        if (!sequences.has(sequenceKey)) {
          sequences.set(sequenceKey, []);
        }
        sequences.get(sequenceKey)!.push(window[window.length - 1].timestamp);
      }
    }
    
    return sequences;
  }

  /**
   * Get all detected patterns
   */
  detectAllPatterns(): {
    actionSequences: ActionSequencePattern[];
    frequentAccess: FrequentAccessPattern[];
    layoutPreferences: LayoutPreferencePattern[];
  } {
    return {
      actionSequences: this.detectActionSequences(),
      frequentAccess: this.detectFrequentAccess(),
      layoutPreferences: this.detectLayoutPreferences()
    };
  }
}
