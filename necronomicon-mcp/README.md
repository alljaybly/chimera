# Necronomicon MCP Server

Model Context Protocol server providing adapters for legacy protocols and APIs.

## Overview

The Necronomicon MCP server provides Model Context Protocol (MCP) tools that allow AI assistants and applications to access content from legacy internet protocols that are no longer commonly supported by modern browsers and tools.

## Features

- **Gopher Protocol Adapter**: Access content from Gopher servers (gopher://)
- **Telnet BBS Adapter**: Connect to and interact with Telnet BBS systems
- **Legacy API Bridge**: Unified interface for deprecated APIs

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Usage

### Running the Server

The server runs on stdio and communicates using the MCP protocol:

```bash
npm start
```

### Available Tools

#### fetch_gopher

Fetch content from a Gopher URL.

**Parameters:**
- `url` (string, required): The Gopher URL to fetch (e.g., gopher://gopher.floodgap.com/)

**Returns:**
- Content from the Gopher server
- Content type (text, directory, html, image, binary)
- For directories: list of items with their types and selectors

**Supported Gopher Item Types:**
- Text files (type 0)
- Directory listings (type 1)
- HTML files (type h)
- Images (types g, I)
- Binary files (types 5, 9)
- Search indexes (type 7)
- Info lines (type i)

**Example:**
```json
{
  "url": "gopher://gopher.floodgap.com/"
}
```

**Status**: ✅ Implemented

#### connect_telnet_bbs

Connect to a Telnet BBS and retrieve content.

**Parameters:**
- `host` (string, required): The BBS host address
- `port` (number, optional): The BBS port (default: 23)

**Status**: Placeholder - will be implemented in task 10.3

## Configuration with Kiro

To use this MCP server with Kiro, add it to your `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "necronomicon": {
      "command": "node",
      "args": ["./necronomicon-mcp/dist/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Architecture

The server is structured as follows:

- `src/index.ts`: Main server entry point and tool registration
- `src/gopher-adapter.ts`: Gopher protocol implementation (task 10.2)
- `src/telnet-adapter.ts`: Telnet BBS protocol implementation (task 10.3)

## Requirements

- Node.js 18+
- TypeScript 5.3+
- @modelcontextprotocol/sdk ^0.5.0

## Integration

This MCP server is designed to be used with the CHIMERA Digital Phylactery knowledge management system to enable ingestion of content from legacy protocols.
