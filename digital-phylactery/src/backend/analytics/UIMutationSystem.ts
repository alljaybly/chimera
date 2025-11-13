import { UIMutation } from '../../shared/types/index.js';
import { UIMutationRepository } from '../database/repositories/UIMutationRepository.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Parameters for different mutation types
 */
export interface ReorderParameters {
  newPosition: number;
  oldPosition: number;
}

export interface ResizeParameters {
  width?: number | string;
  height?: number | string;
}

export interface HideParameters {
  hidden: true;
}

export interface ShowParameters {
  hidden: false;
}

export interface ShortcutParameters {
  action: string;
  label: string;
  icon?: string;
  sequence: string[]; // The action sequence this shortcut represents
}

/**
 * Manages UI mutations and their persistence
 */
export class UIMutationSystem {
  private mutationRepository: UIMutationRepository;
  private mutationStoragePath: string;
  private readonly MAX_MUTATIONS = 100;

  constructor(mutationRepository: UIMutationRepository, storagePath?: string) {
    this.mutationRepository = mutationRepository;
    this.mutationStoragePath = storagePath || path.join(process.cwd(), 'data', 'ui-mutations.json');
    this.ensureStorageDirectory();
  }

  /**
   * Create a reorder mutation
   */
  createReorderMutation(
    target: string,
    parameters: ReorderParameters,
    triggeredBy: string
  ): UIMutation {
    const mutation: UIMutation = {
      id: uuidv4(),
      type: 'reorder',
      target,
      parameters,
      appliedAt: new Date(),
      triggeredBy
    };

    this.applyMutation(mutation);
    return mutation;
  }

  /**
   * Create a resize mutation
   */
  createResizeMutation(
    target: string,
    parameters: ResizeParameters,
    triggeredBy: string
  ): UIMutation {
    const mutation: UIMutation = {
      id: uuidv4(),
      type: 'resize',
      target,
      parameters,
      appliedAt: new Date(),
      triggeredBy
    };

    this.applyMutation(mutation);
    return mutation;
  }

  /**
   * Create a hide mutation
   */
  createHideMutation(
    target: string,
    triggeredBy: string
  ): UIMutation {
    const mutation: UIMutation = {
      id: uuidv4(),
      type: 'hide',
      target,
      parameters: { hidden: true },
      appliedAt: new Date(),
      triggeredBy
    };

    this.applyMutation(mutation);
    return mutation;
  }

  /**
   * Create a show mutation
   */
  createShowMutation(
    target: string,
    triggeredBy: string
  ): UIMutation {
    const mutation: UIMutation = {
      id: uuidv4(),
      type: 'show',
      target,
      parameters: { hidden: false },
      appliedAt: new Date(),
      triggeredBy
    };

    this.applyMutation(mutation);
    return mutation;
  }

  /**
   * Create a shortcut mutation
   */
  createShortcutMutation(
    target: string,
    parameters: ShortcutParameters,
    triggeredBy: string
  ): UIMutation {
    const mutation: UIMutation = {
      id: uuidv4(),
      type: 'shortcut',
      target,
      parameters,
      appliedAt: new Date(),
      triggeredBy
    };

    this.applyMutation(mutation);
    return mutation;
  }

  /**
   * Apply a mutation (store in database and persist to JSON)
   */
  applyMutation(mutation: UIMutation): void {
    // Store in database
    this.mutationRepository.create(mutation);

    // Maintain max mutations limit
    const count = this.mutationRepository.count();
    if (count > this.MAX_MUTATIONS) {
      this.mutationRepository.keepRecentOnly(this.MAX_MUTATIONS);
    }

    // Persist to JSON storage
    this.persistMutations();
  }

  /**
   * Get all mutations
   */
  getAllMutations(): UIMutation[] {
    return this.mutationRepository.findAll();
  }

  /**
   * Get mutations by type
   */
  getMutationsByType(type: 'reorder' | 'resize' | 'hide' | 'show' | 'shortcut'): UIMutation[] {
    return this.mutationRepository.findAll({ type });
  }

  /**
   * Get mutations by target
   */
  getMutationsByTarget(target: string): UIMutation[] {
    return this.mutationRepository.findAll({ target });
  }

  /**
   * Get mutation history (most recent N mutations)
   */
  getHistory(limit: number = 100): UIMutation[] {
    return this.mutationRepository.getHistory(limit);
  }

  /**
   * Get a specific mutation by ID
   */
  getMutation(id: string): UIMutation | null {
    return this.mutationRepository.findById(id);
  }

  /**
   * Delete a mutation
   */
  deleteMutation(id: string): void {
    this.mutationRepository.delete(id);
    this.persistMutations();
  }

  /**
   * Persist mutations to JSON storage
   */
  private persistMutations(): void {
    try {
      const mutations = this.mutationRepository.getHistory(this.MAX_MUTATIONS);
      const jsonData = JSON.stringify(mutations, null, 2);
      fs.writeFileSync(this.mutationStoragePath, jsonData, 'utf-8');
    } catch (error) {
      console.error('Failed to persist mutations to JSON:', error);
    }
  }

  /**
   * Load mutations from JSON storage
   */
  loadMutationsFromStorage(): UIMutation[] {
    try {
      if (fs.existsSync(this.mutationStoragePath)) {
        const jsonData = fs.readFileSync(this.mutationStoragePath, 'utf-8');
        const mutations = JSON.parse(jsonData) as UIMutation[];
        
        // Convert date strings back to Date objects
        return mutations.map(m => ({
          ...m,
          appliedAt: new Date(m.appliedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load mutations from JSON:', error);
    }
    return [];
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDirectory(): void {
    const dir = path.dirname(this.mutationStoragePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Get the current UI state (all active mutations)
   */
  getCurrentState(): UIMutation[] {
    // Get all mutations and resolve conflicts (later mutations override earlier ones for same target)
    const allMutations = this.mutationRepository.findAll();
    const stateMap = new Map<string, UIMutation>();

    for (const mutation of allMutations) {
      const key = `${mutation.target}-${mutation.type}`;
      stateMap.set(key, mutation);
    }

    return Array.from(stateMap.values());
  }
}
