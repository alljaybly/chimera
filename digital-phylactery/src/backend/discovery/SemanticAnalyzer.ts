import { KnowledgeNode } from '../../shared/types/index.js';

/**
 * Term frequency map for a document
 */
interface TermFrequency {
  [term: string]: number;
}

/**
 * TF-IDF vector representation of a document
 */
interface TFIDFVector {
  [term: string]: number;
}

/**
 * Semantic similarity result
 */
export interface SemanticSimilarity {
  nodeId: string;
  similarity: number;
}

/**
 * SemanticAnalyzer implements TF-IDF vectorization and cosine similarity
 * to find semantically similar knowledge nodes
 */
export class SemanticAnalyzer {
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how'
  ]);

  /**
   * Tokenize text into terms, removing stop words and normalizing
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(term => term.length >= 2 && !this.stopWords.has(term)); // Changed > 2 to >= 2
  }

  /**
   * Calculate term frequency for a document
   */
  private calculateTermFrequency(tokens: string[]): TermFrequency {
    const tf: TermFrequency = {};
    const totalTerms = tokens.length;

    for (const term of tokens) {
      tf[term] = (tf[term] || 0) + 1;
    }

    // Normalize by total terms
    for (const term in tf) {
      tf[term] = tf[term] / totalTerms;
    }

    return tf;
  }

  /**
   * Calculate inverse document frequency across all documents
   */
  private calculateIDF(allDocuments: string[][]): Map<string, number> {
    const idf = new Map<string, number>();
    const totalDocs = allDocuments.length;

    // Count document frequency for each term
    const docFrequency = new Map<string, number>();
    for (const doc of allDocuments) {
      const uniqueTerms = new Set(doc);
      for (const term of uniqueTerms) {
        docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
      }
    }

    // Calculate IDF: log(total_docs / docs_containing_term)
    for (const [term, freq] of docFrequency) {
      idf.set(term, Math.log(totalDocs / freq));
    }

    return idf;
  }

  /**
   * Create TF-IDF vector for a document
   */
  private createTFIDFVector(tf: TermFrequency, idf: Map<string, number>): TFIDFVector {
    const vector: TFIDFVector = {};

    for (const term in tf) {
      const idfValue = idf.get(term) || 0;
      vector[term] = tf[term] * idfValue;
    }

    return vector;
  }

  /**
   * Calculate cosine similarity between two TF-IDF vectors
   */
  calculateCosineSimilarity(vector1: TFIDFVector, vector2: TFIDFVector): number {
    // Get all unique terms from both vectors
    const allTerms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const term of allTerms) {
      const v1 = vector1[term] || 0;
      const v2 = vector2[term] || 0;

      dotProduct += v1 * v2;
      magnitude1 += v1 * v1;
      magnitude2 += v2 * v2;
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find semantically similar nodes to the target node
   * @param targetNode The node to find similarities for
   * @param allNodes All nodes in the knowledge base
   * @param threshold Minimum similarity threshold (default 0.3)
   * @returns Array of similar nodes with similarity scores
   */
  findSimilarNodes(
    targetNode: KnowledgeNode,
    allNodes: KnowledgeNode[],
    threshold: number = 0.3
  ): SemanticSimilarity[] {
    // Filter out the target node itself
    const otherNodes = allNodes.filter(node => node.id !== targetNode.id);

    if (otherNodes.length === 0) {
      return [];
    }

    // Tokenize all documents
    const targetTokens = this.tokenize(targetNode.searchableText);
    const allTokens = [
      targetTokens,
      ...otherNodes.map(node => this.tokenize(node.searchableText))
    ];

    // Calculate IDF across all documents
    const idf = this.calculateIDF(allTokens);

    // Create TF-IDF vector for target node
    const targetTF = this.calculateTermFrequency(targetTokens);
    const targetVector = this.createTFIDFVector(targetTF, idf);

    // Calculate similarity with each other node
    const similarities: SemanticSimilarity[] = [];

    for (let i = 0; i < otherNodes.length; i++) {
      const node = otherNodes[i];
      const tokens = allTokens[i + 1]; // +1 because targetTokens is at index 0

      const tf = this.calculateTermFrequency(tokens);
      const vector = this.createTFIDFVector(tf, idf);

      const similarity = this.calculateCosineSimilarity(targetVector, vector);

      if (similarity >= threshold) {
        similarities.push({
          nodeId: node.id,
          similarity
        });
      }
    }

    // Sort by similarity descending
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Vectorize a single node's text content
   * Used for caching and incremental analysis
   */
  vectorize(text: string, idf: Map<string, number>): TFIDFVector {
    const tokens = this.tokenize(text);
    const tf = this.calculateTermFrequency(tokens);
    return this.createTFIDFVector(tf, idf);
  }
}
