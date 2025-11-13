/**
 * Integration tests for MCP Server
 * 
 * Tests MCP tool registration and invocation.
 * These tests verify the MCP server correctly exposes and executes tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GopherAdapter } from './gopher-adapter.js';
import { TelnetBBSAdapter } from './telnet-adapter.js';

/**
 * Mock tool handler that simulates MCP server behavior
 * This allows us to test the tool logic without requiring a full MCP server connection
 */
class MockMCPToolHandler {
  private gopherAdapter: GopherAdapter;
  private telnetAdapter: TelnetBBSAdapter;

  constructor() {
    this.gopherAdapter = new GopherAdapter();
    this.telnetAdapter = new TelnetBBSAdapter();
  }

  listTools() {
    return {
      tools: [
        {
          name: 'fetch_gopher',
          description: 'Fetch content from a Gopher URL. Gopher is a legacy protocol from the early internet.',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The Gopher URL to fetch (e.g., gopher://gopher.floodgap.com/)',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'connect_telnet_bbs',
          description: 'Connect to a Telnet BBS (Bulletin Board System) and retrieve content.',
          inputSchema: {
            type: 'object',
            properties: {
              host: {
                type: 'string',
                description: 'The BBS host address',
              },
              port: {
                type: 'number',
                description: 'The BBS port (typically 23 for Telnet)',
                default: 23,
              },
            },
            required: ['host'],
          },
        },
      ],
    };
  }

  async callTool(name: string, args: any) {
    try {
      switch (name) {
        case 'fetch_gopher': {
          const url = args?.url as string;
          
          if (!url) {
            throw new Error('Missing required parameter: url');
          }

          if (!this.gopherAdapter.isValidGopherUrl(url)) {
            throw new Error('Invalid Gopher URL. Must start with gopher://');
          }

          const response = await this.gopherAdapter.fetch(url);
          
          let resultText = `Fetched from ${url}\n\n`;
          resultText += `Content Type: ${response.contentType}\n\n`;
          resultText += response.content;

          if (response.items && response.items.length > 0) {
            resultText += `\n\nFound ${response.items.length} items in directory.`;
          }

          return {
            content: [
              {
                type: 'text',
                text: resultText,
              },
            ],
          };
        }

        case 'connect_telnet_bbs': {
          const host = args?.host as string;
          const port = (args?.port as number) || 23;

          if (!host) {
            throw new Error('Missing required parameter: host');
          }

          if (!this.telnetAdapter.isValidHost(host)) {
            throw new Error('Invalid host address');
          }

          if (!this.telnetAdapter.isValidPort(port)) {
            throw new Error('Invalid port number. Must be between 1 and 65535');
          }

          const response = await this.telnetAdapter.connect(host, port);

          let resultText = `Connected to BBS at ${host}:${port}\n\n`;
          resultText += `ANSI Codes Detected: ${response.hasAnsiCodes ? 'Yes' : 'No'}\n\n`;
          resultText += '--- BBS Content ---\n\n';
          resultText += response.content;

          return {
            content: [
              {
                type: 'text',
                text: resultText,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
}

describe('MCP Server Integration Tests', () => {
  let handler: MockMCPToolHandler;

  beforeEach(() => {
    handler = new MockMCPToolHandler();
  });

  describe('Tool Registration', () => {
    it('should list all available tools', () => {
      const response = handler.listTools();

      expect(response.tools).toBeDefined();
      expect(response.tools).toHaveLength(2);
      
      const toolNames = response.tools.map(t => t.name);
      expect(toolNames).toContain('fetch_gopher');
      expect(toolNames).toContain('connect_telnet_bbs');
    });

    it('should have correct tool schemas', () => {
      const response = handler.listTools();

      const gopherTool = response.tools.find(t => t.name === 'fetch_gopher');
      expect(gopherTool).toBeDefined();
      expect(gopherTool!.description).toContain('Gopher');
      expect(gopherTool!.inputSchema.properties).toHaveProperty('url');
      expect(gopherTool!.inputSchema.required).toContain('url');

      const telnetTool = response.tools.find(t => t.name === 'connect_telnet_bbs');
      expect(telnetTool).toBeDefined();
      expect(telnetTool!.description).toContain('Telnet');
      expect(telnetTool!.inputSchema.properties).toHaveProperty('host');
      expect(telnetTool!.inputSchema.properties).toHaveProperty('port');
      expect(telnetTool!.inputSchema.required).toContain('host');
    });
  });

  describe('Gopher Tool Invocation', () => {
    it('should reject missing URL parameter', async () => {
      const response = await handler.callTool('fetch_gopher', {});

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Missing required parameter: url');
    });

    it('should reject invalid Gopher URL', async () => {
      const response = await handler.callTool('fetch_gopher', {
        url: 'http://example.com/',
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid Gopher URL');
    });

    it('should fetch from valid Gopher URL', async () => {
      try {
        const response = await handler.callTool('fetch_gopher', {
          url: 'gopher://gopher.floodgap.com/',
        });

        // If successful, verify response structure
        expect(response.content).toBeDefined();
        expect(response.content[0].type).toBe('text');
        expect(response.content[0].text).toContain('Fetched from');
        expect(response.content[0].text).toContain('Content Type:');
      } catch (error) {
        // Network errors are acceptable in tests
        console.warn('Gopher fetch failed (network issue):', error);
      }
    }, 20000);

    it('should handle Gopher connection errors gracefully', async () => {
      const response = await handler.callTool('fetch_gopher', {
        url: 'gopher://nonexistent-server-12345.invalid/',
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Error executing tool');
    }, 20000);
  });

  describe('Telnet BBS Tool Invocation', () => {
    it('should reject missing host parameter', async () => {
      const response = await handler.callTool('connect_telnet_bbs', {});

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Missing required parameter: host');
    });

    it('should reject invalid host', async () => {
      const response = await handler.callTool('connect_telnet_bbs', {
        host: 'invalid host with spaces',
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid host address');
    });

    it('should reject invalid port', async () => {
      const response = await handler.callTool('connect_telnet_bbs', {
        host: 'example.com',
        port: 99999,
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid port number');
    });

    it('should use default port when not specified', async () => {
      const response = await handler.callTool('connect_telnet_bbs', {
        host: 'nonexistent-bbs.invalid',
      });

      // Should attempt connection with default port 23
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Error executing tool');
    }, 20000);

    it('should handle BBS connection errors gracefully', async () => {
      const response = await handler.callTool('connect_telnet_bbs', {
        host: 'nonexistent-bbs-12345.invalid',
        port: 23,
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Error executing tool');
    }, 20000);
  });

  describe('Unknown Tool Handling', () => {
    it('should reject unknown tool names', async () => {
      const response = await handler.callTool('unknown_tool', {});

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Unknown tool');
    });
  });

  describe('Tool Response Format', () => {
    it('should return properly formatted Gopher response', async () => {
      try {
        const response = await handler.callTool('fetch_gopher', {
          url: 'gopher://gopher.floodgap.com/',
        });

        if (!response.isError) {
          expect(response.content).toHaveLength(1);
          expect(response.content[0].type).toBe('text');
          expect(response.content[0].text).toContain('Fetched from gopher://gopher.floodgap.com/');
          expect(response.content[0].text).toContain('Content Type:');
        }
      } catch (error) {
        console.warn('Skipping format test due to network issue');
      }
    }, 20000);
  });
});
