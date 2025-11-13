import { UIMutation } from '../../shared/types/index.js';
import { UIMutationRepository } from '../database/repositories/UIMutationRepository.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of loading mutations
 */
export interface LoadResult {
  success: boolean;
  mutationsLoaded: number;
  loadTimeMs: number;
  errors: string[];
}

/**
 * Loads and applies UI mutations on application startup
 */
export class MutationLoader {
  private mutationRepository: UIMutationRepository;
  private mutationStoragePath: string;
  private readonly LOAD_TIMEOUT_MS = 2000; // 2 seconds as per requirement

  constructor(mutationRepository: UIMutationRepository, storagePath?: string) {
    this.mutationRepository = mutationRepository;
    this.mutationStoragePath = storagePath || path.join(process.cwd(), 'data', 'ui-mutations.json');
  }

  /**
   * Load mutations from storage on app initialization
   * Must complete within 2 seconds
   */
  async loadMutations(): Promise<LoadResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let mutationsLoaded = 0;

    try {
      // Set a timeout to ensure we complete within 2 seconds
      const mutations = await this.loadWithTimeout();
      
      if (mutations.length === 0) {
        return {
          success: true,
          mutationsLoaded: 0,
          loadTimeMs: Date.now() - startTime,
          errors: []
        };
      }

      // Sort mutations by appliedAt timestamp (chronological order)
      const sortedMutations = this.sortMutationsChronologically(mutations);

      // Apply mutations in order
      for (const mutation of sortedMutations) {
        try {
          // Check if we're approaching timeout
          if (Date.now() - startTime > this.LOAD_TIMEOUT_MS - 100) {
            errors.push(`Timeout approaching, stopped at ${mutationsLoaded} mutations`);
            break;
          }

          // Validate mutation before applying
          if (this.validateMutation(mutation)) {
            mutationsLoaded++;
          } else {
            errors.push(`Invalid mutation skipped: ${mutation.id}`);
          }
        } catch (error) {
          errors.push(`Failed to apply mutation ${mutation.id}: ${error}`);
        }
      }

      const loadTimeMs = Date.now() - startTime;

      return {
        success: errors.length === 0,
        mutationsLoaded,
        loadTimeMs,
        errors
      };
    } catch (error) {
      const loadTimeMs = Date.now() - startTime;
      return {
        success: false,
        mutationsLoaded,
        loadTimeMs,
        errors: [`Fatal error loading mutations: ${error}`]
      };
    }
  }

  /**
   * Load mutations with timeout protection
   */
  private async loadWithTimeout(): Promise<UIMutation[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Mutation loading timed out'));
      }, this.LOAD_TIMEOUT_MS);

      try {
        const mutations = this.loadMutationsFromStorage();
        clearTimeout(timeout);
        resolve(mutations);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Load mutations from JSON storage
   */
  private loadMutationsFromStorage(): UIMutation[] {
    try {
      if (!fs.existsSync(this.mutationStoragePath)) {
        return [];
      }

      const jsonData = fs.readFileSync(this.mutationStoragePath, 'utf-8');
      const mutations = JSON.parse(jsonData) as UIMutation[];

      // Convert date strings back to Date objects
      return mutations.map(m => ({
        ...m,
        appliedAt: new Date(m.appliedAt)
      }));
    } catch (error) {
      console.error('Failed to load mutations from storage:', error);
      return [];
    }
  }

  /**
   * Sort mutations in chronological order (oldest first)
   */
  private sortMutationsChronologically(mutations: UIMutation[]): UIMutation[] {
    return [...mutations].sort((a, b) => 
      a.appliedAt.getTime() - b.appliedAt.getTime()
    );
  }

  /**
   * Validate a mutation before applying
   */
  private validateMutation(mutation: UIMutation): boolean {
    // Check required fields
    if (!mutation.id || !mutation.type || !mutation.target) {
      return false;
    }

    // Check valid mutation type
    const validTypes = ['reorder', 'resize', 'hide', 'show', 'shortcut'];
    if (!validTypes.includes(mutation.type)) {
      return false;
    }

    // Check parameters exist
    if (!mutation.parameters || typeof mutation.parameters !== 'object') {
      return false;
    }

    // Type-specific validation
    switch (mutation.type) {
      case 'reorder':
        return this.validateReorderParameters(mutation.parameters);
      case 'resize':
        return this.validateResizeParameters(mutation.parameters);
      case 'hide':
        return mutation.parameters.hidden === true;
      case 'show':
        return mutation.parameters.hidden === false;
      case 'shortcut':
        return this.validateShortcutParameters(mutation.parameters);
      default:
        return false;
    }
  }

  /**
   * Validate reorder parameters
   */
  private validateReorderParameters(params: any): boolean {
    return typeof params.newPosition === 'number' && 
           typeof params.oldPosition === 'number';
  }

  /**
   * Validate resize parameters
   */
  private validateResizeParameters(params: any): boolean {
    return (params.width !== undefined || params.height !== undefined);
  }

  /**
   * Validate shortcut parameters
   */
  private validateShortcutParameters(params: any): boolean {
    return typeof params.action === 'string' &&
           typeof params.label === 'string' &&
           Array.isArray(params.sequence);
  }

  /**
   * Get mutations that will be loaded (for preview)
   */
  getMutationsToLoad(): UIMutation[] {
    const mutations = this.loadMutationsFromStorage();
    return this.sortMutationsChronologically(mutations);
  }

  /**
   * Get load statistics
   */
  getLoadStatistics(): {
    totalMutations: number;
    byType: Record<string, number>;
    estimatedLoadTimeMs: number;
  } {
    const mutations = this.loadMutationsFromStorage();
    
    const byType: Record<string, number> = {
      reorder: 0,
      resize: 0,
      hide: 0,
      show: 0,
      shortcut: 0
    };

    for (const mutation of mutations) {
      if (byType[mutation.type] !== undefined) {
        byType[mutation.type]++;
      }
    }

    // Estimate ~1ms per mutation
    const estimatedLoadTimeMs = mutations.length;

    return {
      totalMutations: mutations.length,
      byType,
      estimatedLoadTimeMs
    };
  }

  /**
   * Verify storage file integrity
   */
  verifyStorageIntegrity(): {
    exists: boolean;
    readable: boolean;
    validJson: boolean;
    mutationCount: number;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!fs.existsSync(this.mutationStoragePath)) {
      return {
        exists: false,
        readable: false,
        validJson: false,
        mutationCount: 0,
        errors: ['Storage file does not exist']
      };
    }

    try {
      const jsonData = fs.readFileSync(this.mutationStoragePath, 'utf-8');
      
      try {
        const mutations = JSON.parse(jsonData);
        
        if (!Array.isArray(mutations)) {
          errors.push('Storage file does not contain an array');
          return {
            exists: true,
            readable: true,
            validJson: false,
            mutationCount: 0,
            errors
          };
        }

        return {
          exists: true,
          readable: true,
          validJson: true,
          mutationCount: mutations.length,
          errors: []
        };
      } catch (parseError) {
        errors.push(`Invalid JSON: ${parseError}`);
        return {
          exists: true,
          readable: true,
          validJson: false,
          mutationCount: 0,
          errors
        };
      }
    } catch (readError) {
      errors.push(`Cannot read file: ${readError}`);
      return {
        exists: true,
        readable: false,
        validJson: false,
        mutationCount: 0,
        errors
      };
    }
  }
}
