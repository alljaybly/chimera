# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Create directory structure for digital-phylactery and necronomicon-mcp
  - Initialize package.json files with required dependencies
  - Configure TypeScript for both projects
  - Set up build tooling (Vite for frontend, tsc for backend)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement data layer and database schema






  - [x] 2.1 Create SQLite database initialization script

    - Write SQL schema for knowledge_nodes, connections, behavioral_events, and ui_mutations tables
    - Create FTS5 full-text search index
    - Add necessary indexes for performance
    - _Requirements: 1.4, 2.4, 3.4, 6.1, 6.2_
  

  - [x] 2.2 Implement database access layer

    - Create database connection manager
    - Write CRUD operations for knowledge nodes
    - Write CRUD operations for connections
    - Implement query builders for complex searches
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.1_
  
  - [x] 2.3 Create TypeScript type definitions


    - Define KnowledgeNode, Connection, UIMutation, and BehavioralHook interfaces
    - Create shared types package for use across frontend and backend
    - _Requirements: 1.4, 2.4, 3.4_

- [x] 3. Build Content Ingestion Engine






  - [x] 3.1 Implement note ingestion

    - Create API endpoint for note submission
    - Write text processing and metadata extraction
    - Store note in database with full-text indexing
    - _Requirements: 1.1, 1.4, 1.5_
  

  - [x] 3.2 Implement image ingestion

    - Create API endpoint for image upload
    - Extract EXIF metadata from images
    - Store image files on filesystem and reference in database
    - Generate searchable text from image metadata
    - _Requirements: 1.2, 1.4, 1.5_
  
  - [x] 3.3 Implement web page ingestion


    - Create API endpoint for URL submission
    - Set up Puppeteer for web scraping
    - Extract page content, title, and metadata
    - Store as knowledge node with full-text indexing
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [x] 3.4 Write unit tests for ingestion engine


    - Test note ingestion with various text formats
    - Test image ingestion with different file types
    - Test web page ingestion with mock HTML
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Build Connection Discovery System




  - [x] 4.1 Implement semantic analysis


    - Create TF-IDF vectorization for text content
    - Implement cosine similarity calculation
    - Write algorithm to find semantically similar nodes
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 4.2 Implement temporal analysis


    - Write algorithm to find nodes created/modified in similar timeframes
    - Calculate temporal connection confidence scores
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [x] 4.3 Create connection scoring system


    - Implement confidence score calculation (0.0 to 1.0)
    - Mark strong connections (>0.7 confidence)
    - Store connections in database
    - _Requirements: 2.4, 2.5_
  
  - [x] 4.4 Build background analysis worker


    - Create async job queue for connection analysis
    - Trigger analysis on new node ingestion
    - Implement caching for analysis results
    - _Requirements: 2.1_
  
  - [x] 4.5 Write unit tests for connection discovery


    - Test semantic similarity with known text pairs
    - Test temporal connection detection
    - Test confidence score calculation
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 5. Implement Adaptive UI Engine






  - [x] 5.1 Create behavioral hook system

    - Implement hook registration mechanism
    - Create event capture system for clicks, hovers, focus, scroll
    - Store behavioral events in database
    - _Requirements: 3.1_
  

  - [x] 5.2 Build pattern detection algorithms

    - Detect repeated action sequences (5+ repetitions)
    - Identify frequently accessed nodes (10+ accesses in 7 days)
    - Track layout preferences and time spent in views
    - _Requirements: 3.2, 3.3_
  

  - [x] 5.3 Implement UI mutation system

    - Create mutation types: reorder, resize, hide, show, shortcut
    - Write mutation application logic
    - Persist mutations to JSON storage
    - _Requirements: 3.4_
  

  - [x] 5.4 Build mutation history and revert functionality

    - Store mutation history with timestamps and triggers
    - Implement state revert to any historical point
    - Maintain 100 most recent mutations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  

  - [x] 5.5 Create mutation loader for app startup

    - Load mutations from storage on app initialization
    - Apply mutations in chronological order
    - Complete within 2 seconds
    - _Requirements: 3.5_
  

  - [x] 5.6 Write unit tests for adaptive UI engine

    - Test pattern detection with mock behavioral data
    - Test mutation application and revert
    - Test mutation persistence and loading
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Build Knowledge Graph Visualizer



  - [x] 6.1 Create D3.js graph rendering component


    - Implement force-directed layout
    - Render nodes as interactive SVG elements
    - Render connections as lines between nodes
    - _Requirements: 4.1, 4.2_
  


  - [x] 6.2 Implement connection visualization

    - Color-code connections by confidence (green >0.8, yellow 0.7-0.8, gray <0.7)
    - Make node size proportional to connection count
    - _Requirements: 4.2, 4.4_

  
  - [x] 6.3 Add node interaction handlers

    - Implement click handler to show node details
    - Display full content and connections in side panel
    - Allow manual connection creation/deletion
    - _Requirements: 4.3, 4.5_
  
  - [x] 6.4 Optimize for large graphs


    - Implement virtualization for 1000+ nodes
    - Add zoom and pan controls
    - Cache layout calculations
    - _Requirements: 4.1_
  
  - [x] 6.5 Write integration tests for graph visualizer


    - Test rendering with various graph sizes
    - Test interaction handlers
    - Test performance with large datasets
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Implement Search and Filter System




  - [x] 7.1 Create search API endpoint


    - Build query parser for text, type, date, and tag filters
    - Execute FTS5 full-text search queries
    - Return results within 500ms
    - _Requirements: 5.1, 5.2_
  

  - [x] 7.2 Implement result ranking and highlighting


    - Calculate relevance scores for search results
    - Extract and highlight matching text segments
    - _Requirements: 5.1, 5.5_

  
  - [x] 7.3 Build filter UI components

    - Create filter controls for content type
    - Create date range picker
    - Create tag filter
    - _Requirements: 5.3, 5.4_
  

  - [x] 7.4 Implement search result display

    - Create result list component
    - Show highlights and relevance scores
    - Add pagination for large result sets
    - _Requirements: 5.1, 5.5_
  

  - [x] 7.5 Write unit tests for search system

    - Test query parsing and execution
    - Test result ranking algorithm
    - Test highlight extraction
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 8. Build backend API server




  - [x] 8.1 Set up Express server


    - Create Express app with middleware
    - Configure CORS and body parsing
    - Set up error handling middleware
    - _Requirements: 1.1, 1.2, 1.3_
  


  - [x] 8.2 Implement REST API endpoints

    - POST /api/nodes (create knowledge node)
    - GET /api/nodes/:id (get node details)
    - GET /api/nodes (list/search nodes)
    - POST /api/connections (create manual connection)
    - GET /api/connections/:nodeId (get node connections)
    - GET /api/ui-mutations (get mutation history)
    - POST /api/ui-mutations/revert (revert to historical state)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.5, 6.3, 6.4_

  
  - [x] 8.3 Add request validation

    - Validate all incoming request bodies
    - Sanitize user input to prevent injection
    - Enforce file size limits (10MB max)
    - _Requirements: 1.1, 1.2, 1.3_
  

  - [x] 8.4 Write integration tests for API

    - Test all endpoints with valid and invalid data
    - Test error handling and status codes
    - Test concurrent requests
    - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [-] 9. Build React frontend application






  - [x] 9.1 Set up React app with Vite

    - Initialize React project with TypeScript
    - Configure routing with React Router
    - Set up state management (Context API or Zustand)
    - _Requirements: 4.1, 5.1_
  


  - [x] 9.2 Create main layout components





    - Build app shell with header, sidebar, main content area
    - Create navigation menu
    - Implement responsive layout
    - _Requirements: 4.1_

  
  - [x] 9.3 Build content ingestion UI

    - Create note input form
    - Create image upload component
    - Create web page URL input
    - Wire up to backend API
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 9.4 Integrate knowledge graph visualizer


    - Embed D3.js graph component in main view
    - Connect to backend API for node and connection data
    - Implement node detail panel
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 9.5 Build search interface


    - Create search bar component
    - Create filter controls
    - Create search results display
    - Wire up to search API
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 9.6 Implement adaptive UI hooks


    - Register behavioral hooks on all interactive elements
    - Send behavioral events to backend
    - Apply UI mutations from backend
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  

  - [x] 9.7 Create UI mutation history viewer

    - Build timeline view of mutations
    - Show trigger descriptions for each mutation
    - Add revert button for each historical state
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [ ] 9.8 Write component tests





    - Test ingestion form submissions
    - Test graph interactions
    - Test search and filter functionality
    - _Requirements: 1.1, 1.2, 1.3, 4.3, 5.1_
-

- [ ] 10. Implement Necronomicon MCP server


  - [x] 10.1 Set up MCP server structure





    - Initialize Node.js project for MCP server
    - Install MCP SDK dependencies
    - Create server entry point
    - _Requirements: 1.3_
  
  - [x] 10.2 Build Gopher protocol adapter





    - Implement Gopher client for fetching content
    - Create tool for MCP to access Gopher URLs
    - Handle Gopher-specific content types
    - _Requirements: 1.3_
  
  - [x] 10.3 Build Telnet BBS adapter





    - Implement Telnet client for BBS connections
    - Create tool for MCP to interact with BBS systems
    - Handle ANSI escape codes and text formatting
    - _Requirements: 1.3_
  
  - [x] 10.4 Write integration tests for MCP server





    - Test Gopher adapter with known Gopher sites
    - Test Telnet adapter with test BBS
    - Test MCP tool registration and invocation
    - _Requirements: 1.3_

- [ ] 11. Wire everything together and polish
  - [ ] 11.1 Create application startup script
    - Write script to initialize database on first run
    - Start backend server
    - Start frontend dev server
    - _Requirements: 1.4, 3.5_
  
  - [ ] 11.2 Implement error boundaries and logging
    - Add React error boundaries to all major components
    - Set up backend error logging
    - Create user-facing error notifications
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 11.3 Add loading states and feedback
    - Show loading spinners during async operations
    - Add toast notifications for success/error
    - Implement progress indicators for long operations
    - _Requirements: 1.4, 2.1, 5.1_
  
  - [ ] 11.4 Optimize performance
    - Implement lazy loading for node content
    - Add caching for frequently accessed data
    - Optimize database queries with proper indexes
    - _Requirements: 1.4, 2.1, 5.1_
  
  - [ ] 11.5 Write end-to-end tests
    - Test complete workflow: ingest → discover → visualize
    - Test adaptive UI mutations actually apply
    - Test search returns correct results
    - _Requirements: 1.1, 2.1, 3.2, 4.1, 5.1_
