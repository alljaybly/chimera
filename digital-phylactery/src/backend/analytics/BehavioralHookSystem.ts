import { BehavioralHook, BehavioralEvent } from '../../shared/types/index.js';
import { BehavioralEventRepository } from '../database/repositories/BehavioralEventRepository.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Manages behavioral hooks and captures user interaction events
 */
export class BehavioralHookSystem {
  private hooks: Map<string, BehavioralHook> = new Map();
  private eventRepository: BehavioralEventRepository;

  constructor(eventRepository: BehavioralEventRepository) {
    this.eventRepository = eventRepository;
  }

  /**
   * Register a new behavioral hook
   */
  registerHook(hook: BehavioralHook): void {
    this.hooks.set(hook.id, hook);
  }

  /**
   * Unregister a behavioral hook
   */
  unregisterHook(hookId: string): boolean {
    return this.hooks.delete(hookId);
  }

  /**
   * Get a hook by ID
   */
  getHook(hookId: string): BehavioralHook | undefined {
    return this.hooks.get(hookId);
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): BehavioralHook[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Get hooks by event type
   */
  getHooksByEventType(eventType: 'click' | 'hover' | 'focus' | 'scroll'): BehavioralHook[] {
    return Array.from(this.hooks.values()).filter(hook => hook.eventType === eventType);
  }

  /**
   * Get hooks by element selector
   */
  getHooksBySelector(selector: string): BehavioralHook[] {
    return Array.from(this.hooks.values()).filter(hook => hook.elementSelector === selector);
  }

  /**
   * Capture and store a behavioral event
   */
  captureEvent(event: Omit<BehavioralEvent, 'id' | 'timestamp'>): number {
    const behavioralEvent: BehavioralEvent = {
      ...event,
      timestamp: new Date()
    };

    return this.eventRepository.create(behavioralEvent);
  }

  /**
   * Capture event from a registered hook
   */
  captureHookEvent(hookId: string, additionalMetadata?: Record<string, any>): number | null {
    const hook = this.hooks.get(hookId);
    if (!hook) {
      return null;
    }

    return this.captureEvent({
      eventType: hook.eventType,
      target: hook.elementSelector,
      metadata: additionalMetadata
    });
  }

  /**
   * Get recent events for analysis
   */
  getRecentEvents(limit: number = 100): BehavioralEvent[] {
    return this.eventRepository.findRecent(limit);
  }

  /**
   * Get events by target
   */
  getEventsByTarget(target: string, limit: number = 100): BehavioralEvent[] {
    return this.eventRepository.findByTarget(target, limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: 'click' | 'hover' | 'focus' | 'scroll', limit: number = 100): BehavioralEvent[] {
    return this.eventRepository.findByType(eventType, limit);
  }

  /**
   * Get events within a time range
   */
  getEventsByTimeRange(startDate: Date, endDate: Date): BehavioralEvent[] {
    return this.eventRepository.findByTimeRange(startDate, endDate);
  }

  /**
   * Count events for a specific target
   */
  countEventsByTarget(target: string, since?: Date): number {
    return this.eventRepository.countByTarget(target, since);
  }

  /**
   * Clear all registered hooks
   */
  clearHooks(): void {
    this.hooks.clear();
  }

  /**
   * Clean up old events (for maintenance)
   */
  cleanupOldEvents(olderThan: Date): void {
    this.eventRepository.deleteOlderThan(olderThan);
  }
}
