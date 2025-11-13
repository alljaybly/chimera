#!/usr/bin/env node

/**
 * Necronomicon MCP Server
 * 
 * Provides access to legacy protocols (Gopher, Telnet BBS) through MCP tools.
 * This allows the Digital Phylactery to ingest content from deprecated internet protocols.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GopherAdapter } from './gopher-adapter.js';
import { TelnetBBSAdapter } from './telnet-adapter.js';

/**
 * Initialize adapters
 */
const gopherAdapter = new GopherAdapter();
const telnetAdapter = new TelnetBBSAdapter();

/**
 * Initialize the MCP server
 */
const server = new Server(
  {
    name: 'necronomicon-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
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
  ];

  return { tools };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'fetch_gopher': {
        const url = args?.url as string;
        
        if (!url) {
          throw new Error('Missing required parameter: url');
        }

        if (!gopherAdapter.isValidGopherUrl(url)) {
          throw new Error('Invalid Gopher URL. Must start with gopher://');
        }

        const response = await gopherAdapter.fetch(url);
        
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

        if (!telnetAdapter.isValidHost(host)) {
          throw new Error('Invalid host address');
        }

        if (!telnetAdapter.isValidPort(port)) {
          throw new Error('Invalid port number. Must be between 1 and 65535');
        }

        const response = await telnetAdapter.connect(host, port);

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
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Necronomicon MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
