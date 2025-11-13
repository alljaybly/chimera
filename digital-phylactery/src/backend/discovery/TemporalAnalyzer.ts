import { KnowledgeNode } from '../../shared/types/index.js';

/**
 * Temporal similarity result
 */
export interface TemporalSimilarity {
  nodeId: string;
  confidence: number;
  timeDifferenceMs: number;
}

/**
 * TemporalAnalyzer finds connections between nodes based on temporal proximity
 * (created or modified within similar timeframes)
 */
export class TemporalAnalyzer {
  // Time window for considering nodes as temporally related (1 hour in milliseconds)
  private readonly TIME_WINDOW_MS = 60 * 60 * 1000;

  // Content type weights for temporal connections
  private readonly TYPE_WEIGHTS = {
    note: 1.0,      // Notes get highest weight
    image: 0.8,     // Images get medium weight
    webpage: 0.6    // Webpages get lowest weight
  };

  /**
   * Find nodes that were created or modified within similar timeframes
   * @param targetNode The node to find temporal connections for
   * @param allNodes All nodes in the knowledge base
   * @param timeWindowMs Time window in milliseconds (default 1 hour)
   * @returns Array of temporally related nodes with confidence scores
   */
  findTemporalConnections(
    targetNode: KnowledgeNode,
    allNodes: KnowledgeNode[],
    timeWindowMs: number = this.TIME_WINDOW_MS
  ): TemporalSimilarity[] {
    const connections: TemporalSimilarity[] = [];

    // Get target node timestamps
    const targetCreated = targetNode.metadata.createdAt.getTime();
    const targetModified = targetNode.metadata.modifiedAt.getTime();

    for (const node of allNodes) {
      // Skip the target node itself
      if (node.id === targetNode.id) {
        continue;
      }

      const nodeCreated = node.metadata.createdAt.getTime();
      const nodeModified = node.metadata.modifiedAt.getTime();

      // Calculate time differences
      const createdDiff = Math.abs(targetCreated - nodeCreated);
      const modifiedDiff = Math.abs(targetModified - nodeModified);

      // Use the smaller time difference (closer temporal proximity)
      const timeDiff = Math.min(createdDiff, modifiedDiff);

      // Check if within time window
      if (timeDiff <= timeWindowMs) {
        const confidence = this.calculateTemporalConfidence(
          timeDiff,
          timeWindowMs,
          targetNode.type,
          node.type
        );

        connections.push({
          nodeId: node.id,
          confidence,
          timeDifferenceMs: timeDiff
        });
      }
    }

    // Sort by confidence descending
    return connections.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for a temporal connection
   * @param timeDiff Time difference in milliseconds
   * @param timeWindow Maximum time window
   * @param sourceType Type of source node
   * @param targetType Type of target node
   * @returns Confidence score between 0.0 and 1.0
   */
  calculateTemporalConfidence(
    timeDiff: number,
    timeWindow: number,
    sourceType: 'note' | 'image' | 'webpage',
    targetType: 'note' | 'image' | 'webpage'
  ): number {
    // Base confidence: inverse of time difference (closer = higher confidence)
    // Use exponential decay for more natural falloff
    const timeRatio = timeDiff / timeWindow;
    const baseConfidence = Math.exp(-3 * timeRatio); // e^(-3x) gives good decay curve

    // Apply content type weights
    const sourceWeight = this.TYPE_WEIGHTS[sourceType];
    const targetWeight = this.TYPE_WEIGHTS[targetType];
    const typeWeight = (sourceWeight + targetWeight) / 2;

    // Final confidence is base confidence weighted by content types
    const confidence = baseConfidence * typeWeight;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Find nodes created within a specific time range
   * @param startTime Start of time range
   * @param endTime End of time range
   * @param allNodes All nodes to search
   * @returns Nodes created within the time range
   */
  findNodesInTimeRange(
    startTime: Date,
    endTime: Date,
    allNodes: KnowledgeNode[]
  ): KnowledgeNode[] {
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();

    return allNodes.filter(node => {
      const createdMs = node.metadata.createdAt.getTime();
      return createdMs >= startMs && createdMs <= endMs;
    });
  }

  /**
   * Group nodes by temporal clusters (nodes created close together in time)
   * @param allNodes All nodes to cluster
   * @param timeWindowMs Time window for clustering
   * @returns Array of node clusters
   */
  clusterByTime(
    allNodes: KnowledgeNode[],
    timeWindowMs: number = this.TIME_WINDOW_MS
  ): KnowledgeNode[][] {
    // Sort nodes by creation time
    const sortedNodes = [...allNodes].sort(
      (a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime()
    );

    const clusters: KnowledgeNode[][] = [];
    let currentCluster: KnowledgeNode[] = [];

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];

      if (currentCluster.length === 0) {
        // Start new cluster
        currentCluster.push(node);
      } else {
        // Check if node belongs to current cluster
        const lastNode = currentCluster[currentCluster.length - 1];
        const timeDiff = node.metadata.createdAt.getTime() - lastNode.metadata.createdAt.getTime();

        if (timeDiff <= timeWindowMs) {
          currentCluster.push(node);
        } else {
          // Start new cluster
          clusters.push(currentCluster);
          currentCluster = [node];
        }
      }
    }

    // Add last cluster if not empty
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    return clusters;
  }
}
