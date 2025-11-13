# Project Chimera: Digital Phylactery

A self-evolving knowledge management system that automatically discovers connections between diverse content types and adapts its interface based on usage patterns.

## Project Structure

```
project-chimera/
├── .kiro/                          # Kiro spec files
│   └── specs/
│       └── digital-phylactery/
│           ├── requirements.md     # Feature requirements
│           ├── design.md           # System design
│           └── tasks.md            # Implementation tasks
├── digital-phylactery/             # Main application
│   ├── src/
│   │   ├── backend/                # Node.js backend
│   │   ├── frontend/               # React frontend
│   │   └── shared/                 # Shared types
│   └── data/                       # SQLite database
└── necronomicon-mcp/               # MCP server for legacy protocols
    └── src/
        ├── gopher-adapter.ts       # Gopher protocol support
        ├── telnet-adapter.ts       # Telnet BBS support
        └── legacy-api-bridge.ts    # Legacy API bridge
```

## Getting Started

### Digital Phylactery (Main Application)

```bash
cd digital-phylactery
npm install
npm run dev
```

This starts both the backend server (port 3001) and frontend dev server (port 3000).

### Necronomicon MCP Server

```bash
cd necronomicon-mcp
npm install
npm run dev
```

## Features

- **Content Ingestion**: Import notes, images, and web pages
- **Connection Discovery**: Automatic semantic and temporal relationship detection
- **Adaptive UI**: Interface that evolves based on your usage patterns
- **Knowledge Graph**: Visual representation of your knowledge network
- **Full-Text Search**: Fast search across all content
- **Legacy Protocol Support**: Access content from Gopher and Telnet BBS systems

## Tech Stack

- **Frontend**: React 18, D3.js, Vite
- **Backend**: Node.js, Express, SQLite
- **MCP Server**: Model Context Protocol SDK
- **Language**: TypeScript

## Development Status

This project is currently in active development. See `.kiro/specs/digital-phylactery/tasks.md` for the implementation roadmap.
