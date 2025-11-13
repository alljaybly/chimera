# 📊 Sample Data for Demo

## Overview

The demo includes 10 knowledge nodes and 10 connections that showcase the Digital Phylactery's capabilities.

## Knowledge Nodes (10)

### 1. AI Ethics
- **Type:** Note
- **Tags:** AI, ethics, technology
- **Content:** AI Ethics and responsible development are crucial for the future of technology.

### 2. Gopher Protocol
- **Type:** Note
- **Tags:** internet, history, protocols
- **Content:** The Gopher protocol was an early internet protocol that predated HTTP.

### 3. Self-Evolving UIs
- **Type:** Note
- **Tags:** UI, UX, adaptive, AI
- **Content:** Self-evolving user interfaces adapt to user behavior patterns automatically.

### 4. Knowledge Graphs
- **Type:** Note
- **Tags:** data, graphs, knowledge
- **Content:** Knowledge graphs represent information as interconnected nodes and relationships.

### 5. Telnet BBS
- **Type:** Note
- **Tags:** BBS, telnet, history, internet
- **Content:** Telnet BBS systems were popular in the 1980s and 1990s for online communities.

### 6. ML Pattern Detection
- **Type:** Note
- **Tags:** ML, patterns, AI, optimization
- **Content:** Machine learning models can detect patterns in user behavior for UI optimization.

### 7. Model Context Protocol
- **Type:** Note
- **Tags:** MCP, AI, protocols, integration
- **Content:** The Model Context Protocol (MCP) enables AI systems to access external tools and data.

### 8. TypeScript Benefits
- **Type:** Note
- **Tags:** TypeScript, JavaScript, programming
- **Content:** TypeScript provides type safety for large-scale JavaScript applications.

### 9. React Hooks
- **Type:** Note
- **Tags:** React, JavaScript, frontend
- **Content:** React hooks enable functional components to manage state and side effects.

### 10. SQLite Database
- **Type:** Note
- **Tags:** database, SQLite, storage
- **Content:** SQLite is a lightweight database perfect for embedded applications.

## Connections (10)

The connections create a meaningful knowledge graph:

1. **AI Ethics → Self-Evolving UIs** (semantic)
2. **AI Ethics → ML Pattern Detection** (semantic)
3. **Self-Evolving UIs → ML Pattern Detection** (semantic)
4. **Self-Evolving UIs → React Hooks** (semantic)
5. **Gopher Protocol → Telnet BBS** (temporal)
6. **Gopher Protocol → Model Context Protocol** (semantic)
7. **Knowledge Graphs → SQLite Database** (semantic)
8. **TypeScript Benefits → React Hooks** (semantic)
9. **Model Context Protocol → TypeScript Benefits** (semantic)
10. **ML Pattern Detection → Knowledge Graphs** (semantic)

## Connection Types

- **Semantic:** Related by meaning/topic
- **Temporal:** Related by time period
- **Manual:** User-created connections

## Graph Structure

The sample data creates several clusters:

### AI/ML Cluster
- AI Ethics
- Self-Evolving UIs
- ML Pattern Detection
- Knowledge Graphs

### Legacy Tech Cluster
- Gopher Protocol
- Telnet BBS
- Model Context Protocol

### Modern Dev Cluster
- TypeScript Benefits
- React Hooks
- SQLite Database

## How to Seed

```bash
# Run the seed script
cd digital-phylactery
npm run seed
```

This will:
1. Clear existing data
2. Create 10 knowledge nodes
3. Create 10 connections
4. Display progress and summary

## Resetting Data

To reset and reseed:

```bash
# Delete the database
rm phylactery.db

# Reseed
npm run seed

# Restart backend
npm run dev:backend
```

## Demo Tips

1. **Show the Graph View** - All 10 nodes will be visible
2. **Click on Nodes** - See details and connections
3. **Highlight Clusters** - Point out the AI/ML cluster
4. **Show Connections** - Explain semantic vs temporal
5. **Add New Node** - Demonstrate ingestion
6. **Create Connection** - Show manual linking

## Why This Data?

The sample data is carefully chosen to:
- **Showcase the project** - Includes topics relevant to Digital Phylactery
- **Tell a story** - Connects legacy tech (Gopher, BBS) to modern AI
- **Create visual interest** - Forms clear clusters in the graph
- **Enable demos** - Provides enough data to be impressive
- **Stay relevant** - Topics judges will recognize

---

**Perfect for your Kiroween demo! 🎃📊**
