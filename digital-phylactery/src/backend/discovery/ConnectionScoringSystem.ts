import { v4 as uuidv4 } from 'uuid';
import { Connection, KnowledgeNode } from '../../shared/types/index.js';
import { SemanticAnalyzer, SemanticSimilarity } from './SemanticAnalyzer.js';
import { TemporalAnalyzer, TemporalSimilarity } from './TemporalAnalyzer.js';
import { ConnectionRepository } from '../database/repositories/ConnectionRepository.js';

/**
 * Discovered connection before being stored
 */
export interface DiscoveredConnection {
  sourceNodeId: string;
  targetNodeId: string;
  type: 'semantic' | 'temporal';
  confidence: number;
  reason: string;
}

/**
 * ConnectionScoringSystem combines semantic and temporal analysis
 * to discover and score connections between knowledge nodes
 */
export class ConnectionScoringSystem {
  private semanticAnalyzer: SemanticAnalyzer;
  private temporalAnalyzer: TemporalAnalyzer;

  // Threshold for strong connections
  private readonly STRONG_CONNECTION_THRESHOLD = 0.7;

  // Weights for combining semantic and temporal scores
  private readonly SEMANTIC_WEIGHT = 0.7;
  private readonly TEMPORAL_WEIGHT = 0.3;

  constructor(private connectionRepository: ConnectionRepository) {
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.temporalAnalyzer = new TemporalAnalyzer();
  }

  /**
   * Analyze a node and discover all connections to other nodes
   * @param targetNode The node to analyze
   * @param allNodes All nodes in the knowledge base
   * @returns Array of discovered connections
   */
  analyzeNode(
    targetNode: KnowledgeNode,
    allNodes: KnowledgeNode[]
  ): DiscoveredConnection[] {
    const connections: DiscoveredConnection[] = [];

    // Find semantic connections
    const semanticSimilarities = this.semanticAnalyzer.findSimilarNodes(
      targetNode,
      allNodes,
      0.3 // Minimum threshold for semantic similarity
    );

    // Find temporal connections
    const temporalSimilarities = this.temporalAnalyzer.findTemporalConnections(
      targetNode,
      allNodes
    );

    // Create a map to combine scores for nodes that appear in both analyses
    const nodeScores = new Map<string, {
      semantic?: number;
      temporal?: number;
    }>();

    // Add semantic scores
    for (const similarity of semanticSimilarities) {
      nodeScores.set(similarity.nodeId, {
        semantic: similarity.similarity
      });
    }

    // Add temporal scores
    for (const similarity of temporalSimilarities) {
      const existing = nodeScores.get(similarity.nodeId);
      if (existing) {
        existing.temporal = similarity.confidence;
      } else {
        nodeScores.set(similarity.nodeId, {
          temporal: similarity.confidence
        });
      }
    }

    // Calculate final confidence scores and create connections
    for (const [nodeId, scores] of nodeScores) {
      const { type, confidence, reason } = this.calculateFinalScore(
        scores.semantic,
        scores.temporal
      );

      connections.push({
        sourceNodeId: targetNode.id,
        targetNodeId: nodeId,
        type,
        confidence,
        reason
      });
    }

    // Sort by confidence descending
    return connections.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate final confidence score combining semantic and temporal scores
   * @param semanticScore Semantic similarity score (0-1)
   * @param temporalScore Temporal similarity score (0-1)
   * @returns Connection type, confidence, and reason
   */
  private calculateFinalScore(
    semanticScore?: number,
    temporalScore?: number
  ): { type: 'semantic' | 'temporal'; confidence: number; reason: string } {
    // If only one type of score exists, use that
    if (semanticScore !== undefined && temporalScore === undefined) {
      return {
        type: 'semantic',
        confidence: semanticScore,
        reason: `Semantic similarity: ${(semanticScore * 100).toFixed(1)}%`
      };
    }

    if (temporalScore !== undefined && semanticScore === undefined) {
      return {
        type: 'temporal',
        confidence: temporalScore,
        reason: `Temporal proximity: ${(temporalScore * 100).toFixed(1)}%`
      };
    }

    // Both scores exist - combine them
    const semantic = semanticScore || 0;
    const temporal = temporalScore || 0;

    // Weighted average
    const combinedScore = (semantic * this.SEMANTIC_WEIGHT) + (temporal * this.TEMPORAL_WEIGHT);

    // Determine primary type based on which score is higher
    const type = semantic >= temporal ? 'semantic' : 'temporal';

    const reason = `Combined: semantic ${(semantic * 100).toFixed(1)}%, temporal ${(temporal * 100).toFixed(1)}%`;

    return {
      type,
      confidence: combinedScore,
      reason
    };
  }

  /**
   * Store discovered connections in the database
   * @param connections Array of discovered connections
   * @returns Array of created Connection objects
   */
  storeConnections(connections: DiscoveredConnection[]): Connection[] {
    const storedConnections: Connection[] = [];

    for (const conn of connections) {
      // Check if connection already exists
      const existing = this.connectionRepository.findBetweenNodes(
        conn.sourceNodeId,
        conn.targetNodeId
      );

      if (existing.length > 0) {
        // Update existing connection if new confidence is higher
        const existingConn = existing[0];
        if (conn.confidence > existingConn.confidence) {
          this.connectionRepository.update(existingConn.id, {
            confidence: conn.confidence,
            metadata: {
              ...existingConn.metadata,
              discoveredAt: new Date(),
              reason: conn.reason
            }
          });
          storedConnections.push({
            ...existingConn,
            confidence: conn.confidence
          });
        } else {
          storedConnections.push(existingConn);
        }
      } else {
        // Create new connection
        const connection: Connection = {
          id: uuidv4(),
          sourceNodeId: conn.sourceNodeId,
          targetNodeId: conn.targetNodeId,
          type: conn.type,
          confidence: conn.confidence,
          metadata: {
            discoveredAt: new Date(),
            reason: conn.reason
          }
        };

        this.connectionRepository.create(connection);
        storedConnections.push(connection);
      }
    }

    return storedConnections;
  }

  /**
   * Find and return only strong connections (confidence > 0.7)
   * @param connections Array of connections
   * @returns Filtered array of strong connections
   */
  filterStrongConnections(connections: DiscoveredConnection[]): DiscoveredConnection[] {
    return connections.filter(conn => conn.confidence > this.STRONG_CONNECTION_THRESHOLD);
  }

  /**
   * Check if a connection is considered strong
   * @param confidence Connection confidence score
   * @returns True if connection is strong
   */
  isStrongConnection(confidence: number): boolean {
    return confidence > this.STRONG_CONNECTION_THRESHOLD;
  }

  /**
   * Get the strong connection threshold
   */
  getStrongConnectionThreshold(): number {
    return this.STRONG_CONNECTION_THRESHOLD;
  }

  /**
   * Calculate confidence score between two specific nodes
   * @param node1 First node
   * @param node2 Second node
   * @param allNodes All nodes (needed for IDF calculation)
   * @returns Confidence score
   */
  calculateConfidence(
    node1: KnowledgeNode,
    node2: KnowledgeNode,
    allNodes: KnowledgeNode[]
  ): number {
    // Calculate semantic similarity
    const semanticSimilarities = this.semanticAnalyzer.findSimilarNodes(
      node1,
      [node2, ...allNodes.filter(n => n.id !== node1.id && n.id !== node2.id)],
      0
    );

    const semanticScore = semanticSimilarities.find(s => s.nodeId === node2.id)?.similarity || 0;

    // Calculate temporal similarity
    const temporalSimilarities = this.temporalAnalyzer.findTemporalConnections(
      node1,
      [node2]
    );

    const temporalScore = temporalSimilarities.find(s => s.nodeId === node2.id)?.confidence || 0;

    // Combine scores
    const { confidence } = this.calculateFinalScore(semanticScore, temporalScore);

    return confidence;
  }
}
