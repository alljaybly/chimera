import { Connection, KnowledgeNode } from '../../shared/types/index.js';
import { KnowledgeNodeRepository } from '../database/repositories/KnowledgeNodeRepository.js';
import { ConnectionRepository } from '../database/repositories/ConnectionRepository.js';
import { SemanticAnalyzer } from './SemanticAnalyzer.js';
import { TemporalAnalyzer } from './TemporalAnalyzer.js';
import { ConnectionScoringSystem } from './ConnectionScoringSystem.js';
import { ConnectionDiscoveryWorker, AnalysisResult } from './ConnectionDiscoveryWorker.js';

/**
 * Main ConnectionDiscoverySystem that orchestrates all connection discovery
 * functionality as specified in the design document
 */
export class ConnectionDiscoverySystem {
  private semanticAnalyzer: SemanticAnalyzer;
  private temporalAnalyzer: TemporalAnalyzer;
  private scoringSystem: ConnectionScoringSystem;
  private worker: ConnectionDiscoveryWorker;

  constructor(
    private nodeRepository: KnowledgeNodeRepository,
    private connectionRepository: ConnectionRepository
  ) {
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.temporalAnalyzer = new TemporalAnalyzer();
    this.scoringSystem = new ConnectionScoringSystem(connectionRepository);
    this.worker = new ConnectionDiscoveryWorker(
      nodeRepository,
      connectionRepository,
      this.scoringSystem
    );
  }

  /**
   * Analyze a node and discover connections (async, queued)
   * This is the main entry point called after node ingestion
   */
  analyzeNode(nodeId: string): void {
    this.worker.onNodeIngested(nodeId);
  }

  /**
   * Analyze a node synchronously and return results immediately
   * Used for testing or when immediate results are needed
   */
  async analyzeNodeSync(nodeId: string): Promise<AnalysisResult> {
    return this.worker.analyzeNode(nodeId);
  }

  /**
   * Find semantic connections for a node
   */
  findSemanticConnections(node: KnowledgeNode, allNodes: KnowledgeNode[]): Connection[] {
    const similarities = this.semanticAnalyzer.findSimilarNodes(node, allNodes);
    
    const connections: Connection[] = similarities.map(sim => ({
      id: '', // Will be set when stored
      sourceNodeId: node.id,
      targetNodeId: sim.nodeId,
      type: 'semantic' as const,
      confidence: sim.similarity,
      metadata: {
        discoveredAt: new Date(),
        reason: `Semantic similarity: ${(sim.similarity * 100).toFixed(1)}%`
      }
    }));

    return connections;
  }

  /**
   * Find temporal connections for a node
   */
  findTemporalConnections(node: KnowledgeNode, allNodes: KnowledgeNode[]): Connection[] {
    const similarities = this.temporalAnalyzer.findTemporalConnections(node, allNodes);
    
    const connections: Connection[] = similarities.map(sim => ({
      id: '', // Will be set when stored
      sourceNodeId: node.id,
      targetNodeId: sim.nodeId,
      type: 'temporal' as const,
      confidence: sim.confidence,
      metadata: {
        discoveredAt: new Date(),
        reason: `Temporal proximity: ${(sim.confidence * 100).toFixed(1)}%`
      }
    }));

    return connections;
  }

  /**
   * Calculate confidence score between two nodes
   */
  calculateConfidence(node1: KnowledgeNode, node2: KnowledgeNode): number {
    const allNodes = this.nodeRepository.findAll();
    return this.scoringSystem.calculateConfidence(node1, node2, allNodes);
  }

  /**
   * Get all connections for a specific node
   */
  getNodeConnections(nodeId: string): Connection[] {
    return this.connectionRepository.findByNodeId(nodeId);
  }

  /**
   * Get strong connections (confidence > 0.7) for a node
   */
  getStrongConnections(nodeId?: string): Connection[] {
    return this.connectionRepository.findStrongConnections(nodeId);
  }

  /**
   * Check if a connection is strong
   */
  isStrongConnection(confidence: number): boolean {
    return this.scoringSystem.isStrongConnection(confidence);
  }

  /**
   * Get worker status
   */
  getWorkerStatus(): {
    isProcessing: boolean;
    queueSize: number;
    cacheStats: { size: number; entries: string[] };
  } {
    return {
      isProcessing: this.worker.isWorking(),
      queueSize: this.worker.getQueueSize(),
      cacheStats: this.worker.getCacheStats()
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.worker.clearCache();
  }

  /**
   * Batch analyze multiple nodes
   */
  async batchAnalyze(nodeIds: string[]): Promise<AnalysisResult[]> {
    return this.worker.batchAnalyze(nodeIds);
  }

  /**
   * Re-analyze a node after updates
   */
  reanalyzeNode(nodeId: string): void {
    this.worker.onNodeUpdated(nodeId);
  }
}
