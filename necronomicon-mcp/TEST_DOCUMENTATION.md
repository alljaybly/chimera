# MCP Server Integration Tests

This document describes the integration tests for the Necronomicon MCP server.

## Test Files

### 1. `gopher-adapter.test.ts`
Tests the Gopher protocol adapter with known Gopher sites.

**Test Coverage:**
- URL validation (valid and invalid Gopher URLs)
- URL parsing (host, port, selector, item type)
- Directory listing parsing
- Live fetching from Floodgap Gopher server (gopher://gopher.floodgap.com/)
- Text file fetching
- Error handling (connection errors, timeouts)
- Content type detection (directory vs text)

**Known Gopher Sites Used:**
- `gopher://gopher.floodgap.com/` - Main directory
- `gopher://gopher.floodgap.com/0/gopher/relevance.txt` - Text file

### 2. `telnet-adapter.test.ts`
Tests the Telnet BBS adapter with validation and ANSI handling.

**Test Coverage:**
- Host validation (hostnames and IP addresses)
- Port validation (valid ranges)
- ANSI code detection and stripping
- ANSI color code parsing
- BBS content formatting (line endings, whitespace)
- Connection error handling
- Adapter configuration options

**Note:** Live BBS testing is commented out due to the unreliability of public BBS systems. Tests focus on validation and ANSI processing logic.

### 3. `index.test.ts`
Tests MCP tool registration and invocation.

**Test Coverage:**
- Tool registration (listing available tools)
- Tool schema validation
- Gopher tool invocation:
  - Parameter validation
  - URL validation
  - Live fetching (when network available)
  - Error handling
- Telnet BBS tool invocation:
  - Parameter validation
  - Host/port validation
  - Default port handling
  - Error handling
- Unknown tool handling
- Response format validation

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Configuration

Tests are configured in `vitest.config.ts`:
- 30 second timeout for network operations
- Node environment
- Global test utilities

## Network Dependencies

Some tests require network access to external services:
- **Gopher tests**: Connect to `gopher.floodgap.com` (port 70)
- **Telnet tests**: Attempt connections to validate error handling

Tests gracefully handle network failures and will skip or warn when services are unavailable.

## Test Results

All 56 tests pass successfully:
- 16 Gopher adapter tests
- 27 Telnet adapter tests  
- 13 MCP server integration tests

## Implementation Notes

The MCP server tests use a `MockMCPToolHandler` class that replicates the server's tool handling logic without requiring a full MCP transport connection. This allows for reliable testing of tool registration and invocation logic.
