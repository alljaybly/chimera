# Design Document: Digital Phylactery

## Overview

The Digital Phylactery is a self-evolving knowledge management system built on three core subsystems: Content Ingestion, Connection Discovery, and Adaptive UI. The system uses a hybrid architecture combining a local-first data store with real-time behavioral monitoring to create an interface that literally rewrites itself based on usage patterns.

The technical approach prioritizes functional pragmatism over architectural purity. We'll integrate legacy protocols and APIs where they provide unique capabilities, treating their "limitations" as features that add character to the system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Adaptive UI  │  │  Knowledge   │  │   Search     │  │
│  │   Engine     │  │  Graph View  │  │  Interface   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────┐
│                    Backend Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Content     │  │  Connection  │  │  Behavioral  │  │
│  │  Ingestion   │  │  Discovery   │  │  Analytics   │  │
│  │  Engine      │  │  System      │  │  Engine      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Knowledge   │  │  Connection  │  │  UI State    │  │
│  │  Node Store  │  │  Graph DB    │  │  Store       │  │
│  │  (SQLite)    │  │  (Graph)     │  │  (JSON)      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with functional components
- D3.js for knowledge graph visualization
- IndexedDB for client-side caching
- Web Workers for background processing

**Backend:**
- Node.js with Express
- SQLite for primary data storage (simple, embedded, no server)
- In-memory graph structure for connection analysis
- File system for binary content (images)

**Legacy Integration Layer:**
- Custom MCP server for accessing deprecated APIs
- Protocol adapters for Gopher, Telnet
- Fallback mechanisms for API failures

## Components and Interfaces

### 1. Content Ingestion Engine

**Purpose:** Import and normalize diverse content types into Knowledge Nodes

**Core Components:**

```typescript
interface KnowledgeNode {
  id: string;
  type: 'note' | 'image' | 'webpage';
  content: string | Buffer;
  metadata: {
    title?: string;
    source?: string;
    createdAt: Date;
    modifiedAt: Date;
    tags: string[];
  };
  searchableText: string;
}

class ContentIngestionEngine {
  ingestNote(text: string, metadata?: Partial<Metadata>): Promise<KnowledgeNode>
  ingestImage(file: Buffer, metadata?: Partial<Metadata>): Promise<KnowledgeNode>
  ingestWebPage(url: string): Promise<KnowledgeNode>
  extractMetadata(content: any, type: string): Metadata
}
```

**Implementation Notes:**
- Web page ingestion uses a headless browser (Puppeteer) to handle JavaScript-heavy sites
- Image metadata extraction uses EXIF data when available
- All content gets full-text indexed immediately upon ingestion
- Binary content stored on filesystem, referenced by ID in database

### 2. Connection Discovery System

**Purpose:** Analyze content and identify relationships between Knowledge Nodes

**Core Components:**

```typescript
interface Connection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: 'semantic' | 'temporal' | 'manual';
  confidence: number; // 0.0 to 1.0
  metadata: {
    discoveredAt: Date;
    reason: string;
  };
}

class ConnectionDiscoverySystem {
  analyzeNode(nodeId: string): Promise<Connection[]>
  findSemanticConnections(node: KnowledgeNode): Promise<Connection[]>
  findTemporalConnections(node: KnowledgeNode): Promise<Connection[]>
  calculateConfidence(node1: KnowledgeNode, node2: KnowledgeNode): number
}
```

**Analysis Strategies:**

1. **Semantic Analysis:**
   - TF-IDF vectorization of text content
   - Cosine similarity between document vectors
   - Threshold: 0.7 for strong connections

2. **Temporal Analysis:**
   - Nodes created/modified within 1 hour window
   - Weighted by content type (notes > images > webpages)

3. **Manual Connections:**
   - User-created links always have confidence 1.0
   - Never auto-deleted

**Performance:**
- Analysis runs asynchronously after ingestion
- Results cached in memory for fast retrieval
- Re-analysis triggered on node updates

### 3. Adaptive UI Engine

**Purpose:** Monitor user behavior and programmatically modify the interface

**Core Components:**

```typescript
interface BehavioralHook {
  id: string;
  elementSelector: string;
  eventType: 'click' | 'hover' | 'focus' | 'scroll';
  handler: (event: Event) => void;
}

interface UIMutation {
  id: string;
  type: 'reorder' | 'resize' | 'hide' | 'show' | 'shortcut';
  target: string;
  parameters: Record<string, any>;
  appliedAt: Date;
  triggeredBy: string; // behavioral pattern description
}

class AdaptiveUIEngine {
  registerHook(hook: BehavioralHook): void
  captureInteraction(event: Event): void
  analyzePatterns(): UIMutation[]
  applyMutation(mutation: UIMutation): void
  revertToState(timestamp: Date): void
  getHistory(): UIMutation[]
}
```

**Behavioral Patterns Detected:**

1. **Frequent Access Pattern:**
   - Track node access count over 7-day window
   - Promote nodes accessed >10 times to "favorites" section
   - Auto-creates UI shortcut

2. **Action Sequence Pattern:**
   - Detect repeated sequences (e.g., search → filter → export)
   - After 5 repetitions, create one-click shortcut
   - Shortcut appears in toolbar

3. **Layout Preference Pattern:**
   - Track time spent in different view modes
   - Auto-switch to preferred mode on startup
   - Adjust panel sizes based on usage

**Mutation Storage:**
- Mutations stored as JSON in `.kiro/ui-state/mutations.json`
- History limited to 100 most recent mutations
- Mutations applied on app startup in chronological order

### 4. Knowledge Graph Visualizer

**Purpose:** Render nodes and connections as an interactive graph

**Core Components:**

```typescript
interface GraphNode {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  confidence: number;
}

class KnowledgeGraphVisualizer {
  renderGraph(nodes: GraphNode[], edges: GraphEdge[]): void
  applyForceLayout(): void
  highlightNode(nodeId: string): void
  filterByConfidence(threshold: number): void
}
```

**Visualization Strategy:**
- D3.js force-directed layout for automatic positioning
- Color coding: green (>0.8), yellow (0.7-0.8), gray (<0.7)
- Node size proportional to connection count
- Click to expand node details in side panel

### 5. Search and Filter System

**Purpose:** Fast retrieval of Knowledge Nodes

**Core Components:**

```typescript
interface SearchQuery {
  text?: string;
  types?: Array<'note' | 'image' | 'webpage'>;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
}

interface SearchResult {
  node: KnowledgeNode;
  relevance: number;
  highlights: string[];
}

class SearchEngine {
  search(query: SearchQuery): Promise<SearchResult[]>
  buildIndex(): void
  updateIndex(nodeId: string): void
}
```

**Implementation:**
- Full-text search using SQLite FTS5 extension
- Results ranked by relevance score
- Highlights generated by extracting context around matches
- Search executes in <500ms for databases up to 10,000 nodes

## Data Models

### Database Schema (SQLite)

```sql
-- Knowledge Nodes table
CREATE TABLE knowledge_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT,
  content_path TEXT, -- for binary content
  metadata JSON NOT NULL,
  searchable_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index
CREATE VIRTUAL TABLE nodes_fts USING fts5(
  id UNINDEXED,
  searchable_text,
  content='knowledge_nodes',
  content_rowid='rowid'
);

-- Connections table
CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  confidence REAL NOT NULL,
  metadata JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_node_id) REFERENCES knowledge_nodes(id),
  FOREIGN KEY (target_node_id) REFERENCES knowledge_nodes(id)
);

-- Behavioral events table
CREATE TABLE behavioral_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  target TEXT NOT NULL,
  metadata JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- UI mutations table
CREATE TABLE ui_mutations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  parameters JSON NOT NULL,
  triggered_by TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_connections_source ON connections(source_node_id);
CREATE INDEX idx_connections_target ON connections(target_node_id);
CREATE INDEX idx_nodes_type ON knowledge_nodes(type);
CREATE INDEX idx_nodes_created ON knowledge_nodes(created_at);
CREATE INDEX idx_behavioral_events_timestamp ON behavioral_events(timestamp);
```

### File System Structure

```
project-chimera/
├── .kiro/
│   ├── specs/
│   │   └── digital-phylactery/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   ├── ui-state/
│   │   └── mutations.json
│   └── steering/
│       └── project-guidelines.md
├── digital-phylactery/
│   ├── src/
│   │   ├── backend/
│   │   │   ├── ingestion/
│   │   │   ├── discovery/
│   │   │   ├── analytics/
│   │   │   └── api/
│   │   ├── frontend/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── adaptive-ui/
│   │   └── shared/
│   │       └── types/
│   ├── data/
│   │   ├── phylactery.db
│   │   └── content/
│   │       └── [node-id].[ext]
│   └── package.json
└── necronomicon-mcp/
    ├── src/
    │   ├── gopher-adapter.ts
    │   ├── telnet-adapter.ts
    │   └── legacy-api-bridge.ts
    └── package.json
```

## Error Handling

### Strategy

1. **Graceful Degradation:**
   - If connection discovery fails, system continues with manual connections only
   - If adaptive UI fails, fall back to static default layout
   - If legacy API unavailable, skip that integration

2. **Error Boundaries:**
   - React error boundaries around each major component
   - Backend errors logged but don't crash server
   - Database errors trigger automatic backup

3. **User Feedback:**
   - Toast notifications for non-critical errors
   - Modal dialogs for critical errors requiring user action
   - Error log accessible from settings panel

### Error Types

```typescript
class PhylacteryError extends Error {
  code: string;
  recoverable: boolean;
  context: Record<string, any>;
}

// Specific error classes
class IngestionError extends PhylacteryError {}
class ConnectionError extends PhylacteryError {}
class UIAdaptationError extends PhylacteryError {}
class StorageError extends PhylacteryError {}
```

## Testing Strategy

### Unit Tests
- Test each engine component in isolation
- Mock database and file system operations
- Focus on business logic and algorithms
- Target: 70% code coverage

### Integration Tests
- Test complete workflows (ingest → discover → display)
- Use test database with known data
- Verify API contracts between components
- Test error handling and recovery

### End-to-End Tests
- Simulate user interactions with Playwright
- Test adaptive UI mutations actually apply
- Verify search returns correct results
- Test across different content types

### Performance Tests
- Benchmark ingestion speed (target: <100ms per node)
- Benchmark connection discovery (target: <5s per node)
- Benchmark search (target: <500ms)
- Test with large datasets (10,000+ nodes)

## Security Considerations

1. **Input Validation:**
   - Sanitize all user-provided content
   - Validate URLs before fetching
   - Limit file upload sizes (10MB max)

2. **Data Privacy:**
   - All data stored locally
   - No external transmission except for web page fetching
   - User controls all data deletion

3. **Code Injection Prevention:**
   - No eval() or Function() constructor usage
   - UI mutations limited to predefined types
   - Behavioral hooks sandboxed

## Performance Optimizations

1. **Lazy Loading:**
   - Load node content on-demand
   - Paginate search results
   - Virtualize graph rendering for large datasets

2. **Caching:**
   - Cache connection analysis results
   - Cache search results for 5 minutes
   - Cache rendered graph layouts

3. **Background Processing:**
   - Run connection discovery in Web Workers
   - Batch database writes
   - Debounce behavioral event logging

## Future Extensibility

The architecture supports future enhancements:

- Plugin system for custom content importers
- Export to various formats (Markdown, JSON, etc.)
- Sync between multiple devices
- AI-powered connection suggestions
- Voice input for note creation
- Mobile companion app
