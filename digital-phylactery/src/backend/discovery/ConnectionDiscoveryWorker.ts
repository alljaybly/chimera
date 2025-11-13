import { KnowledgeNode } from '../../shared/types/index.js';
import { ConnectionScoringSystem, DiscoveredConnection } from './ConnectionScoringSystem.js';
import { KnowledgeNodeRepository } from '../database/repositories/KnowledgeNodeRepository.js';
import { ConnectionRepository } from '../database/repositories/ConnectionRepository.js';

/**
 * Job in the analysis queue
 */
interface AnalysisJob {
  nodeId: string;
  priority: number;
  addedAt: Date;
}

/**
 * Analysis result with timing information
 */
export interface AnalysisResult {
  nodeId: string;
  connectionsFound: number;
  strongConnections: number;
  processingTimeMs: number;
  completedAt: Date;
}

/**
 * Cache entry for analysis results
 */
interface CacheEntry {
  connections: DiscoveredConnection[];
  analyzedAt: Date;
}

/**
 * ConnectionDiscoveryWorker manages background analysis of nodes
 * to discover connections asynchronously
 */
export class ConnectionDiscoveryWorker {
  private jobQueue: AnalysisJob[] = [];
  private isProcessing = false;
  private analysisCache = new Map<string, CacheEntry>();
  
  // Cache TTL: 5 minutes
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  
  // Maximum time for analysis (5 seconds as per requirements)
  private readonly MAX_ANALYSIS_TIME_MS = 5000;

  constructor(
    private nodeRepository: KnowledgeNodeRepository,
    private connectionRepository: ConnectionRepository,
    private scoringSystem: ConnectionScoringSystem
  ) {}

  /**
   * Add a node to the analysis queue
   * @param nodeId ID of the node to analyze
   * @param priority Priority level (higher = processed first)
   */
  enqueueAnalysis(nodeId: string, priority: number = 0): void {
    // Check if already in queue
    const existingIndex = this.jobQueue.findIndex(job => job.nodeId === nodeId);
    
    if (existingIndex >= 0) {
      // Update priority if higher
      if (priority > this.jobQueue[existingIndex].priority) {
        this.jobQueue[existingIndex].priority = priority;
        this.sortQueue();
      }
      return;
    }

    // Add new job
    this.jobQueue.push({
      nodeId,
      priority,
      addedAt: new Date()
    });

    this.sortQueue();

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Sort queue by priority (highest first)
   */
  private sortQueue(): void {
    this.jobQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process jobs in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift()!;
      
      try {
        await this.analyzeNode(job.nodeId);
      } catch (error) {
        console.error(`Error analyzing node ${job.nodeId}:`, error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Analyze a single node and store discovered connections
   * @param nodeId ID of the node to analyze
   * @returns Analysis result
   */
  async analyzeNode(nodeId: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Check cache first
    const cached = this.getCachedAnalysis(nodeId);
    if (cached) {
      // Store cached connections
      this.scoringSystem.storeConnections(cached.connections);
      
      return {
        nodeId,
        connectionsFound: cached.connections.length,
        strongConnections: this.scoringSystem.filterStrongConnections(cached.connections).length,
        processingTimeMs: Date.now() - startTime,
        completedAt: new Date()
      };
    }

    // Get the target node
    const targetNode = this.nodeRepository.findById(nodeId);
    if (!targetNode) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Get all other nodes
    const allNodes = this.nodeRepository.findAll();

    // Perform analysis with timeout protection
    const connections = await this.analyzeWithTimeout(
      targetNode,
      allNodes,
      this.MAX_ANALYSIS_TIME_MS
    );

    // Store connections in database
    this.scoringSystem.storeConnections(connections);

    // Cache the results
    this.cacheAnalysis(nodeId, connections);

    const processingTime = Date.now() - startTime;

    return {
      nodeId,
      connectionsFound: connections.length,
      strongConnections: this.scoringSystem.filterStrongConnections(connections).length,
      processingTimeMs: processingTime,
      completedAt: new Date()
    };
  }

  /**
   * Analyze node with timeout protection
   */
  private async analyzeWithTimeout(
    targetNode: KnowledgeNode,
    allNodes: KnowledgeNode[],
    timeoutMs: number
  ): Promise<DiscoveredConnection[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Analysis timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const connections = this.scoringSystem.analyzeNode(targetNode, allNodes);
        clearTimeout(timeout);
        resolve(connections);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Get cached analysis results if still valid
   */
  private getCachedAnalysis(nodeId: string): CacheEntry | null {
    const cached = this.analysisCache.get(nodeId);
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const age = Date.now() - cached.analyzedAt.getTime();
    if (age > this.CACHE_TTL_MS) {
      this.analysisCache.delete(nodeId);
      return null;
    }

    return cached;
  }

  /**
   * Cache analysis results
   */
  private cacheAnalysis(nodeId: string, connections: DiscoveredConnection[]): void {
    this.analysisCache.set(nodeId, {
      connections,
      analyzedAt: new Date()
    });
  }

  /**
   * Clear the analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Clear cache for a specific node
   */
  clearNodeCache(nodeId: string): void {
    this.analysisCache.delete(nodeId);
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.jobQueue.length;
  }

  /**
   * Check if worker is currently processing
   */
  isWorking(): boolean {
    return this.isProcessing;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.analysisCache.size,
      entries: Array.from(this.analysisCache.keys())
    };
  }

  /**
   * Trigger analysis for a newly ingested node
   * This is called automatically after node ingestion
   */
  onNodeIngested(nodeId: string): void {
    // High priority for newly ingested nodes
    this.enqueueAnalysis(nodeId, 10);
  }

  /**
   * Trigger re-analysis for an updated node
   */
  onNodeUpdated(nodeId: string): void {
    // Clear cache and re-analyze with medium priority
    this.clearNodeCache(nodeId);
    this.enqueueAnalysis(nodeId, 5);
  }

  /**
   * Batch analyze multiple nodes
   */
  async batchAnalyze(nodeIds: string[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const nodeId of nodeIds) {
      try {
        const result = await this.analyzeNode(nodeId);
        results.push(result);
      } catch (error) {
        console.error(`Error analyzing node ${nodeId}:`, error);
      }
    }

    return results;
  }
}
