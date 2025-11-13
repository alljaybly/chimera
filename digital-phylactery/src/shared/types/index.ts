// Shared type definitions for Digital Phylactery

/**
 * Represents a single piece of content in the knowledge base
 */
export interface KnowledgeNode {
  id: string;
  type: 'note' | 'image' | 'webpage';
  content: string | Buffer;
  content_path?: string; // Path to binary content on filesystem
  metadata: KnowledgeNodeMetadata;
  searchableText: string;
}

/**
 * Metadata associated with a knowledge node
 */
export interface KnowledgeNodeMetadata {
  title?: string;
  source?: string;
  createdAt: Date;
  modifiedAt: Date;
  tags: string[];
  [key: string]: any; // Allow additional metadata fields
}

/**
 * Represents a discovered or manual connection between knowledge nodes
 */
export interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: 'semantic' | 'temporal' | 'manual';
  confidence: number; // 0.0 to 1.0
  metadata: ConnectionMetadata;
}

/**
 * Metadata associated with a connection
 */
export interface ConnectionMetadata {
  discoveredAt: Date;
  reason: string;
  [key: string]: any; // Allow additional metadata fields
}

/**
 * Represents a behavioral monitoring hook in the UI
 */
export interface BehavioralHook {
  id: string;
  elementSelector: string;
  eventType: 'click' | 'hover' | 'focus' | 'scroll';
  handler: (event: Event) => void;
}

/**
 * Represents a programmatic change to the user interface
 */
export interface UIMutation {
  id: string;
  type: 'reorder' | 'resize' | 'hide' | 'show' | 'shortcut';
  target: string;
  parameters: Record<string, any>;
  appliedAt: Date;
  triggeredBy: string; // Description of the behavioral pattern that triggered this mutation
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  text?: string;
  types?: Array<'note' | 'image' | 'webpage'>;
  dateRange?: { start?: Date; end?: Date };
  tags?: string[];
}

/**
 * Search result with relevance scoring
 */
export interface SearchResult {
  node: KnowledgeNode;
  relevance: number;
  highlights: string[];
}

/**
 * Behavioral event captured from user interactions
 */
export interface BehavioralEvent {
  id?: number;
  eventType: 'click' | 'hover' | 'focus' | 'scroll';
  target: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Graph node for visualization
 */
export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'image' | 'webpage';
  x?: number;
  y?: number;
  connectionCount?: number;
}

/**
 * Graph edge for visualization
 */
export interface GraphEdge {
  source: string;
  target: string;
  confidence: number;
  type: 'semantic' | 'temporal' | 'manual';
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
